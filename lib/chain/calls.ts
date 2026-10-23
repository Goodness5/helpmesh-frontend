import { encodeFunctionData, parseSignature, type Address, type Hex } from "viem"
import { addresses } from "@/lib/chain/addresses"
import { escrowAbi, tipJarAbi, usdcAbi, poolAbi } from "@/lib/chain/abi"
import { assignMessage, fundMessage, plainError } from "@/lib/chain/plain"
import { accountFor, helperRole, type SignerRole } from "@/lib/chain/session"
import type { Snapshot } from "@/lib/chain/types"

export type ChainResult = { ok: true } | { ok: false; message: string }

const forwardTypes = {
  ForwardRequest: [
    { name: "from", type: "address" },
    { name: "to", type: "address" },
    { name: "value", type: "uint256" },
    { name: "gas", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint48" },
    { name: "data", type: "bytes" },
  ],
} as const

const permitTypes = {
  Permit: [
    { name: "owner", type: "address" },
    { name: "spender", type: "address" },
    { name: "value", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "deadline", type: "uint256" },
  ],
} as const

const confirmationTypes = {
  Confirmation: [
    { name: "requestId", type: "bytes32" },
    { name: "helper", type: "address" },
    { name: "requester", type: "address" },
    { name: "completedAt", type: "uint64" },
  ],
} as const

export async function readMesh(address: Address, requestKey?: Hex | null): Promise<Snapshot> {
  const url = new URL("/api/mesh", window.location.origin)
  url.searchParams.set("address", address)
  if (requestKey) url.searchParams.set("request", requestKey)
  const response = await fetch(url, { cache: "no-store" })
  const body: unknown = await response.json().catch(() => null)
  if (!body || typeof body !== "object" || !("ok" in body) || body.ok !== true || !("snapshot" in body)) {
    const message = body && typeof body === "object" && "message" in body && typeof body.message === "string"
      ? body.message
      : "The network did not respond. Try again."
    throw new Error(message)
  }
  return body.snapshot as Snapshot
}

async function postMesh(payload: unknown): Promise<ChainResult> {
  try {
    const response = await fetch("/api/mesh", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    })
    const body: unknown = await response.json().catch(() => null)
    if (body && typeof body === "object" && "ok" in body && body.ok === true) return { ok: true }
    if (body && typeof body === "object" && "message" in body && typeof body.message === "string") {
      return { ok: false, message: body.message }
    }
    return { ok: false, message: "That did not go through. Try again." }
  } catch (error) {
    return { ok: false, message: plainError(error) }
  }
}

async function signForward(role: SignerRole, to: Address, data: Hex, snap: Snapshot) {
  const account = accountFor(role)
  const deadline = snap.blockTimestamp + 60 * 60
  const gas = 500_000n
  const signature = await account.signTypedData({
    domain: {
      name: snap.forwarderName,
      version: snap.forwarderVersion,
      chainId: snap.chainId,
      verifyingContract: addresses.forwarder,
    },
    types: forwardTypes,
    primaryType: "ForwardRequest",
    message: {
      from: account.address,
      to,
      value: 0n,
      gas,
      nonce: BigInt(snap.forwarderNonce),
      deadline,
      data,
    },
  })
  return {
    from: account.address,
    to,
    data,
    signature,
    gas: gas.toString(),
    deadline: deadline.toString(),
  }
}

async function signPermit(role: SignerRole, spender: Address, amount: bigint, snap: Snapshot) {
  const account = accountFor(role)
  const deadline = BigInt(snap.blockTimestamp + 60 * 60)
  const signature = await account.signTypedData({
    domain: {
      name: snap.tokenName,
      version: snap.tokenVersion,
      chainId: snap.chainId,
      verifyingContract: addresses.mockUsdc,
    },
    types: permitTypes,
    primaryType: "Permit",
    message: {
      owner: account.address,
      spender,
      value: amount,
      nonce: BigInt(snap.permitNonce),
      deadline,
    },
  })
  const parsed = parseSignature(signature)
  if (parsed.v === undefined) return null
  return {
    owner: account.address,
    spender,
    value: amount.toString(),
    deadline: deadline.toString(),
    v: Number(parsed.v),
    r: parsed.r,
    s: parsed.s,
  }
}

export async function chainFaucet(): Promise<ChainResult> {
  const you = accountFor("you")
  const snap = await readMesh(you.address)
  const data = encodeFunctionData({ abi: usdcAbi, functionName: "faucet" })
  const forward = await signForward("you", addresses.mockUsdc, data, snap)
  return postMesh({ kind: "forward", forward })
}

export async function chainFundReward(chainKey: Hex, amount: bigint): Promise<ChainResult> {
  const you = accountFor("you")
  const snap = await readMesh(you.address, chainKey)
  const deadline = BigInt(snap.blockTimestamp + 60 * 60)
  const signature = await you.signTypedData({
    domain: {
      name: snap.tokenName,
      version: snap.tokenVersion,
      chainId: snap.chainId,
      verifyingContract: addresses.mockUsdc,
    },
    types: permitTypes,
    primaryType: "Permit",
    message: {
      owner: you.address,
      spender: addresses.helpEscrow,
      value: amount,
      nonce: BigInt(snap.permitNonce),
      deadline,
    },
  })
  const parsed = parseSignature(signature)
  if (parsed.v === undefined) return { ok: false, message: "The approval did not match. Try again." }
  const openUntil = BigInt(snap.blockTimestamp + 3 * 24 * 60 * 60)
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "fundFromRequesterWithPermit",
    args: [chainKey, addresses.mockUsdc, amount, openUntil, deadline, Number(parsed.v), parsed.r, parsed.s],
  })
  const forward = await signForward("you", addresses.helpEscrow, data, snap)
  return postMesh({ kind: "forward", forward })
}

export async function chainEscrow(role: SignerRole, chainKey: Hex, functionName: "start" | "complete" | "confirm" | "cancel" | "dispute" | "releaseAssignment"): Promise<ChainResult> {
  const account = accountFor(role)
  const snap = await readMesh(account.address, chainKey)
  const data = encodeFunctionData({ abi: escrowAbi, functionName, args: [chainKey] })
  const forward = await signForward(role, addresses.helpEscrow, data, snap)
  return postMesh({ kind: "forward", forward })
}

export async function chainAssign(chainKey: Hex, helperId: string): Promise<ChainResult> {
  const you = accountFor("you")
  const helper = accountFor(helperRole(helperId))
  const signature = await you.signMessage({ message: assignMessage(chainKey, helper.address) })
  return postMesh({ kind: "assign", requestKey: chainKey, helper: helper.address, signature })
}

export async function chainFundPool(chainKey: Hex, amount: bigint, category: string): Promise<ChainResult> {
  const you = accountFor("you")
  const signature = await you.signMessage({ message: fundMessage(chainKey, amount.toString(), category) })
  return postMesh({ kind: "fundPool", requestKey: chainKey, amount: amount.toString(), category, signature })
}

export async function chainVolunteer(chainKey: Hex, helperId: string): Promise<ChainResult> {
  const you = accountFor("you")
  const helper = accountFor(helperRole(helperId))
  const snap = await readMesh(you.address, chainKey)
  const completedAt = BigInt(snap.blockTimestamp)
  const signature = await you.signTypedData({
    domain: {
      name: snap.attestName,
      version: snap.attestVersion,
      chainId: snap.chainId,
      verifyingContract: addresses.helpAttestations,
    },
    types: confirmationTypes,
    primaryType: "Confirmation",
    message: { requestId: chainKey, helper: helper.address, requester: you.address, completedAt },
  })
  return postMesh({
    kind: "attest",
    requestId: chainKey,
    helper: helper.address,
    requester: you.address,
    completedAt: completedAt.toString(),
    signature,
  })
}

export async function chainDeposit(amount: bigint): Promise<ChainResult> {
  const you = accountFor("you")
  const snap = await readMesh(you.address)
  if (snap.poolId === "0") return { ok: false, message: "The fund is not ready yet. Try again." }
  const permit = await signPermit("you", addresses.sponsorPool, amount, snap)
  if (!permit) return { ok: false, message: "The approval did not match. Try again." }
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "deposit",
    args: [BigInt(snap.poolId), amount],
  })
  const forward = await signForward("you", addresses.sponsorPool, data, snap)
  return postMesh({ kind: "permitAndForward", permit, forward })
}

export async function chainTip(helperId: string, amount: bigint, chainKey?: Hex | null): Promise<ChainResult> {
  const you = accountFor("you")
  const helper = accountFor(helperRole(helperId))
  const snap = await readMesh(you.address, chainKey)
  const permit = await signPermit("you", addresses.tipJar, amount, snap)
  if (!permit) return { ok: false, message: "The approval did not match. Try again." }
  const data = chainKey
    ? encodeFunctionData({
        abi: tipJarAbi,
        functionName: "tip",
        args: [helper.address, addresses.mockUsdc, amount, chainKey],
      })
    : encodeFunctionData({
        abi: tipJarAbi,
        functionName: "support",
        args: [helper.address, addresses.mockUsdc, amount],
      })
  const forward = await signForward("you", addresses.tipJar, data, snap)
  return postMesh({ kind: "permitAndForward", permit, forward })
}

export async function chainBalance(): Promise<Snapshot> {
  return readMesh(accountFor("you").address)
}
