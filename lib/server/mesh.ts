import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  isAddress,
  recoverMessageAddress,
  type Address,
  type Hex,
} from "viem"
import { privateKeyToAccount } from "viem/accounts"
import { baseSepolia } from "viem/chains"
import { attestationsAbi, escrowAbi, forwarderAbi, poolAbi, tipJarAbi, usdcAbi } from "@/lib/chain/abi"
import { addresses } from "@/lib/chain/addresses"
import {
  amountAllowed,
  assignMessage,
  categoryAllowed,
  fundMessage,
  plainError,
  rulesHash,
} from "@/lib/chain/plain"
import type { Snapshot } from "@/lib/chain/types"

const GAS = 500_000n
const OUTER_GAS = 1_200_000n
const rpc = process.env.RPC_URL || "https://sepolia.base.org"

const publicClient = createPublicClient({ chain: baseSepolia, transport: http(rpc) })

const hits = new Map<string, number[]>()

function relayer() {
  const key = process.env.RELAYER_PRIVATE_KEY
  if (!key) throw new Error("missing relayer")
  const account = privateKeyToAccount(key as Hex)
  if (account.address.toLowerCase() !== addresses.admin.toLowerCase()) {
    throw new Error("relayer mismatch")
  }
  return account
}

function wallet() {
  return createWalletClient({ account: relayer(), chain: baseSepolia, transport: http(rpc) })
}

export function limited(key: string) {
  const now = Date.now()
  const recent = (hits.get(key) ?? []).filter((time) => now - time < 10 * 60 * 1000)
  if (recent.length >= 120) return true
  recent.push(now)
  hits.set(key, recent)
  return false
}

function hex32(value: unknown): value is Hex {
  return typeof value === "string" && /^0x[0-9a-fA-F]{64}$/.test(value)
}

function hexData(value: unknown): value is Hex {
  return typeof value === "string" && /^0x([0-9a-fA-F]{2})+$/.test(value)
}

function addressOf(value: unknown): Address | null {
  if (typeof value !== "string" || !isAddress(value)) return null
  return value
}

let tokenDomain: { name: string; version: string } | null = null
let forwarderDomain: { name: string; version: string } | null = null
let attestDomain: { name: string; version: string } | null = null
let poolReady: Promise<bigint> | null = null

async function domain(address: Address, abi: typeof usdcAbi) {
  const result = await publicClient.readContract({ address, abi, functionName: "eip712Domain" })
  const named = result as { name?: string; version?: string }
  if (named.name && named.version) return { name: named.name, version: named.version }
  const tuple = result as readonly [unknown, string, string]
  return { name: tuple[1], version: tuple[2] }
}

async function domains() {
  tokenDomain ??= await domain(addresses.mockUsdc, usdcAbi)
  forwarderDomain ??= await domain(addresses.forwarder, forwarderAbi)
  attestDomain ??= await domain(addresses.helpAttestations, attestationsAbi)
  return { tokenDomain, forwarderDomain, attestDomain }
}

function selector(abi: typeof escrowAbi, functionName: string, args: readonly unknown[] = []) {
  return encodeFunctionData({ abi, functionName, args: args as never }).slice(0, 10).toLowerCase()
}

const allowedSelectors = new Set(
  [
    selector(usdcAbi, "faucet"),
    selector(escrowAbi, "fundFromRequesterWithPermit", ["0x" + "11".repeat(32), addresses.mockUsdc, 1n, 1n, 1n, 27, `0x${"22".repeat(32)}`, `0x${"33".repeat(32)}`]),
    selector(escrowAbi, "start", ["0x" + "11".repeat(32)]),
    selector(escrowAbi, "complete", ["0x" + "11".repeat(32)]),
    selector(escrowAbi, "confirm", ["0x" + "11".repeat(32)]),
    selector(escrowAbi, "cancel", ["0x" + "11".repeat(32)]),
    selector(escrowAbi, "dispute", ["0x" + "11".repeat(32)]),
    selector(escrowAbi, "releaseAssignment", ["0x" + "11".repeat(32)]),
    selector(poolAbi, "deposit", [1n, 1n]),
    selector(tipJarAbi, "tip", [addresses.admin, addresses.mockUsdc, 1n, "0x" + "11".repeat(32)]),
    selector(tipJarAbi, "support", [addresses.admin, addresses.mockUsdc, 1n]),
  ].map((item) => item.toLowerCase()),
)

async function send(hashPromise: Promise<Hex>) {
  const hash = await hashPromise
  const receipt = await publicClient.waitForTransactionReceipt({ hash })
  if (receipt.status !== "success") throw new Error("reverted")
  return hash
}

async function findOrCreatePool(): Promise<bigint> {
  const next = await publicClient.readContract({
    address: addresses.sponsorPool,
    abi: poolAbi,
    functionName: "nextPoolId",
  })
  const want = rulesHash()
  const count = typeof next === "bigint" ? next : 0n
  for (let id = 1n; id <= count; id++) {
    const pool = await publicClient.readContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "pools",
      args: [id],
    })
    const hash = poolHash(pool)
    if (hash === want) {
      await seedPool(id, poolBalanceOf(pool))
      return id
    }
  }
  const account = wallet()
  await send(
    account.writeContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "createPool",
      args: [addresses.mockUsdc, want, 20_000_000n],
      gas: OUTER_GAS,
    }),
  )
  const id = count + 1n
  await seedPool(id, 0n)
  return id
}

function poolHash(pool: unknown): Hex | null {
  if (Array.isArray(pool)) return typeof pool[2] === "string" ? (pool[2] as Hex) : null
  if (pool && typeof pool === "object" && "rulesHash" in pool && typeof pool.rulesHash === "string") {
    return pool.rulesHash as Hex
  }
  return null
}

function poolBalanceOf(pool: unknown): bigint {
  if (Array.isArray(pool) && typeof pool[4] === "bigint") return pool[4]
  if (pool && typeof pool === "object" && "balance" in pool && typeof pool.balance === "bigint") return pool.balance
  return 0n
}

async function seedPool(poolId: bigint, balance: bigint) {
  if (balance > 0n) return
  const account = wallet()
  try {
    await send(
      account.writeContract({
        address: addresses.mockUsdc,
        abi: usdcAbi,
        functionName: "faucet",
        gas: OUTER_GAS,
      }),
    )
  } catch {
    // The daily drip may already have been used.
  }
  const held = await publicClient.readContract({
    address: addresses.mockUsdc,
    abi: usdcAbi,
    functionName: "balanceOf",
    args: [relayer().address],
  })
  const amount = typeof held === "bigint" && held > 100_000_000n ? 100_000_000n : held
  if (typeof amount !== "bigint" || amount === 0n) return
  await send(
    account.writeContract({
      address: addresses.mockUsdc,
      abi: usdcAbi,
      functionName: "approve",
      args: [addresses.sponsorPool, amount],
      gas: OUTER_GAS,
    }),
  )
  await send(
    account.writeContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "deposit",
      args: [poolId, amount],
      gas: OUTER_GAS,
    }),
  )
}

function accessibilityPool() {
  poolReady ??= findOrCreatePool().catch((error) => {
    poolReady = null
    throw error
  })
  return poolReady
}

function asState(value: unknown): number {
  if (typeof value === "bigint" || typeof value === "number") return Number(value)
  if (Array.isArray(value)) return asState(value[6])
  if (value && typeof value === "object" && "state" in value) return asState(value.state)
  return 0
}

export async function readSnapshot(address: Address | null, request: Hex | null): Promise<Snapshot> {
  const domainsNow = await domains()
  const block = await publicClient.getBlock()
  const blockTimestamp = Number(block.timestamp)
  let poolId = 0n
  let poolBalance = 0n
  try {
    poolId = await accessibilityPool()
    const pool = await publicClient.readContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "pools",
      args: [poolId],
    })
    poolBalance = poolBalanceOf(pool)
  } catch {
    poolId = 0n
    poolBalance = 0n
  }

  let balance = 0n
  let forwarderNonce = 0n
  let permitNonce = 0n
  let faucetNext = 0
  if (address) {
    const [bal, fwd, nonce, last] = await Promise.all([
      publicClient.readContract({ address: addresses.mockUsdc, abi: usdcAbi, functionName: "balanceOf", args: [address] }),
      publicClient.readContract({ address: addresses.forwarder, abi: forwarderAbi, functionName: "nonces", args: [address] }),
      publicClient.readContract({ address: addresses.mockUsdc, abi: usdcAbi, functionName: "nonces", args: [address] }),
      publicClient.readContract({ address: addresses.mockUsdc, abi: usdcAbi, functionName: "lastFaucetAt", args: [address] }),
    ])
    balance = typeof bal === "bigint" ? bal : 0n
    forwarderNonce = typeof fwd === "bigint" ? fwd : 0n
    permitNonce = typeof nonce === "bigint" ? nonce : 0n
    const lastAt = typeof last === "bigint" ? last : 0n
    const cooldown = 24 * 60 * 60
    const readyAt = Number(lastAt) + cooldown
    faucetNext = lastAt === 0n || readyAt <= blockTimestamp ? 0 : readyAt * 1000
  }

  let escrowState = 0
  if (request) {
    const escrow = await publicClient.readContract({
      address: addresses.helpEscrow,
      abi: escrowAbi,
      functionName: "escrows",
      args: [request],
    })
    escrowState = asState(escrow)
  }

  return {
    balance: Number(balance),
    poolBalance: Number(poolBalance),
    poolId: poolId.toString(),
    faucetNext,
    blockTimestamp,
    forwarderNonce: forwarderNonce.toString(),
    permitNonce: permitNonce.toString(),
    escrowState,
    tokenName: domainsNow.tokenDomain.name,
    tokenVersion: domainsNow.tokenDomain.version,
    forwarderName: domainsNow.forwarderDomain.name,
    forwarderVersion: domainsNow.forwarderDomain.version,
    chainId: baseSepolia.id,
    attestName: domainsNow.attestDomain.name,
    attestVersion: domainsNow.attestDomain.version,
  }
}

type ForwardInput = {
  from: Address
  to: Address
  data: Hex
  signature: Hex
  gas: bigint
  deadline: bigint
}

const targets = new Set<string>([
  addresses.helpEscrow.toLowerCase(),
  addresses.mockUsdc.toLowerCase(),
  addresses.sponsorPool.toLowerCase(),
  addresses.tipJar.toLowerCase(),
  addresses.helpAttestations.toLowerCase(),
])

function readForward(value: unknown, now: bigint): ForwardInput | string {
  if (!value || typeof value !== "object") return "That did not go through. Try again."
  const body = value as Record<string, unknown>
  const from = addressOf(body.from)
  const to = addressOf(body.to)
  if (!from || !to || !targets.has(to.toLowerCase())) return "That step is not available right now. Try again."
  if (!hexData(body.data) || !hexData(body.signature)) return "The approval did not match. Try again."
  if (!allowedSelectors.has(body.data.slice(0, 10).toLowerCase())) return "That step is not available right now. Try again."
  let gas = GAS
  let deadline = 0n
  try {
    gas = BigInt(String(body.gas))
    deadline = BigInt(String(body.deadline))
  } catch {
    return "That approval has expired."
  }
  if (gas < GAS || gas > 2_000_000n) return "That step is not available right now. Try again."
  if (deadline <= now || deadline > now + 2n * 60n * 60n) return "That request or approval has expired."
  return { from, to, data: body.data, signature: body.signature, gas, deadline }
}

async function executeForward(input: ForwardInput) {
  await send(
    wallet().writeContract({
      address: addresses.forwarder,
      abi: forwarderAbi,
      functionName: "execute",
      args: [
        {
          from: input.from,
          to: input.to,
          value: 0n,
          gas: input.gas,
          deadline: Number(input.deadline),
          data: input.data,
          signature: input.signature,
        },
      ],
      gas: OUTER_GAS,
    }),
  )
}

const spenders = new Set<string>([
  addresses.helpEscrow.toLowerCase(),
  addresses.sponsorPool.toLowerCase(),
  addresses.tipJar.toLowerCase(),
])

async function submitPermit(value: unknown, now: bigint) {
  if (!value || typeof value !== "object") return "The approval did not match. Try again."
  const body = value as Record<string, unknown>
  const owner = addressOf(body.owner)
  const spender = addressOf(body.spender)
  if (!owner || !spender || !spenders.has(spender.toLowerCase())) return "Only test money can be used here."
  if (!hex32(body.r) || !hex32(body.s)) return "The approval did not match. Try again."
  const v = Number(body.v)
  if (v !== 27 && v !== 28) return "The approval did not match. Try again."
  let amount = 0n
  let deadline = 0n
  try {
    amount = BigInt(String(body.value))
    deadline = BigInt(String(body.deadline))
  } catch {
    return "That request or approval has expired."
  }
  if (deadline <= now) return "That request or approval has expired."
  if (amount <= 0n || amount > 10_000_000_000n) return "That amount is above the testnet limit."
  await send(
    wallet().writeContract({
      address: addresses.mockUsdc,
      abi: usdcAbi,
      functionName: "permit",
      args: [owner, spender, amount, deadline, v, body.r, body.s],
      gas: OUTER_GAS,
    }),
  )
  return null
}

export async function handleMesh(body: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    if (!body || typeof body !== "object" || !("kind" in body)) {
      return { ok: false, message: "That did not go through. Try again." }
    }
    const kind = (body as { kind: unknown }).kind
    const block = await publicClient.getBlock()
    const now = block.timestamp
    if (kind === "forward") {
      const forward = readForward((body as { forward?: unknown }).forward ?? body, now)
      if (typeof forward === "string") return { ok: false, message: forward }
      if (limited(forward.from)) return { ok: false, message: "Please wait a moment, then try again." }
      await executeForward(forward)
      return { ok: true }
    }
    if (kind === "permitAndForward") {
      const record = body as { permit?: unknown; forward?: unknown }
      const forward = readForward(record.forward, now)
      if (typeof forward === "string") return { ok: false, message: forward }
      if (limited(forward.from)) return { ok: false, message: "Please wait a moment, then try again." }
      const permitError = await submitPermit(record.permit, now)
      if (permitError) return { ok: false, message: permitError }
      await executeForward(forward)
      return { ok: true }
    }
    if (kind === "attest") return attest(body)
    if (kind === "assign") return assign(body)
    if (kind === "fundPool") return fundPool(body, now)
    return { ok: false, message: "That step is not available right now. Try again." }
  } catch (error) {
    return { ok: false, message: plainError(error) }
  }
}

async function attest(body: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const record = body as Record<string, unknown>
  const helper = addressOf(record.helper)
  const requester = addressOf(record.requester)
  if (!hex32(record.requestId) || !helper || !requester || !hexData(record.signature)) {
    return { ok: false, message: "The approval did not match. Try again." }
  }
  if (limited(requester)) return { ok: false, message: "Please wait a moment, then try again." }
  let completedAt = 0n
  try {
    completedAt = BigInt(String(record.completedAt))
  } catch {
    return { ok: false, message: "That request or approval has expired." }
  }
  await send(
    wallet().writeContract({
      address: addresses.helpAttestations,
      abi: attestationsAbi,
      functionName: "attestVolunteer",
      args: [{ requestId: record.requestId, helper, requester, completedAt }, record.signature],
      gas: OUTER_GAS,
    }),
  )
  return { ok: true }
}

async function assign(body: unknown): Promise<{ ok: true } | { ok: false; message: string }> {
  const record = body as Record<string, unknown>
  const helper = addressOf(record.helper)
  if (!hex32(record.requestKey) || !helper || typeof record.signature !== "string") {
    return { ok: false, message: "The approval did not match. Try again." }
  }
  const escrow = await publicClient.readContract({
    address: addresses.helpEscrow,
    abi: escrowAbi,
    functionName: "escrows",
    args: [record.requestKey],
  })
  const requester = escrowRequester(escrow)
  if (!requester) return { ok: false, message: "We can't find that request." }
  const recovered = await recoverMessageAddress({
    message: assignMessage(record.requestKey, helper),
    signature: record.signature as Hex,
  })
  if (recovered.toLowerCase() !== requester.toLowerCase()) {
    return { ok: false, message: "The approval did not match. Try again." }
  }
  if (limited(requester)) return { ok: false, message: "Please wait a moment, then try again." }
  await send(
    wallet().writeContract({
      address: addresses.helpEscrow,
      abi: escrowAbi,
      functionName: "assignHelper",
      args: [record.requestKey, helper],
      gas: OUTER_GAS,
    }),
  )
  return { ok: true }
}

function escrowRequester(escrow: unknown): Address | null {
  if (Array.isArray(escrow) && typeof escrow[0] === "string" && isAddress(escrow[0])) return escrow[0]
  if (escrow && typeof escrow === "object" && "requester" in escrow && typeof escrow.requester === "string" && isAddress(escrow.requester)) {
    return escrow.requester
  }
  return null
}

async function fundPool(body: unknown, now: bigint): Promise<{ ok: true } | { ok: false; message: string }> {
  const record = body as Record<string, unknown>
  if (!hex32(record.requestKey) || typeof record.signature !== "string" || typeof record.category !== "string") {
    return { ok: false, message: "That did not go through. Try again." }
  }
  if (!categoryAllowed(record.category)) return { ok: false, message: "This fund does not cover that kind of help." }
  let amount = 0n
  try {
    amount = BigInt(String(record.amount))
  } catch {
    return { ok: false, message: "Enter an amount like 10 or 10.50." }
  }
  if (!amountAllowed(amount)) return { ok: false, message: "That amount is above what this fund allows per request." }
  const requester = await recoverMessageAddress({
    message: fundMessage(record.requestKey, amount.toString(), record.category),
    signature: record.signature as Hex,
  })
  if (limited(requester)) return { ok: false, message: "Please wait a moment, then try again." }
  const poolId = await accessibilityPool()
  const openUntil = now + 3n * 24n * 60n * 60n
  const expiry = now + 4n * 24n * 60n * 60n
  const voucher = {
    poolId,
    requestId: record.requestKey,
    requester,
    amount,
    openUntil,
    expiry,
  }
  const signer = relayer()
  const signature = await signer.signTypedData({
    domain: { name: "HelpEscrow", version: "1", chainId: baseSepolia.id, verifyingContract: addresses.helpEscrow },
    types: {
      PoolVoucher: [
        { name: "poolId", type: "uint64" },
        { name: "requestId", type: "bytes32" },
        { name: "requester", type: "address" },
        { name: "amount", type: "uint128" },
        { name: "openUntil", type: "uint64" },
        { name: "expiry", type: "uint64" },
      ],
    },
    primaryType: "PoolVoucher",
    message: voucher,
  })
  await send(
    wallet().writeContract({
      address: addresses.helpEscrow,
      abi: escrowAbi,
      functionName: "fundFromPool",
      args: [voucher, signature],
      gas: OUTER_GAS,
    }),
  )
  return { ok: true }
}
