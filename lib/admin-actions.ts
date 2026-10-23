"use client"

import {
  createPublicClient,
  createWalletClient,
  custom,
  http,
  encodeFunctionData,
  parseUnits,
  type Address,
  type Hex,
  type WalletClient,
} from "viem"
import { baseSepolia } from "viem/chains"
import { addresses } from "@/lib/chain/addresses"
import { escrowAbi, poolAbi, usdcAbi } from "@/lib/chain/abi"

// Public client for reading
export const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http("https://sepolia.base.org"),
})

// Get wallet client from browser provider (MetaMask, etc.)
export async function getWalletClient(): Promise<WalletClient | null> {
  if (typeof window === "undefined") return null
  
  const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum
  if (!ethereum) {
    throw new Error("No wallet found. Please install MetaMask or another Web3 wallet.")
  }

  // Request account access
  await ethereum.request({ method: "eth_requestAccounts" })

  const walletClient = createWalletClient({
    chain: baseSepolia,
    transport: custom(ethereum),
  })

  return walletClient
}

// Get connected account address
export async function getConnectedAddress(): Promise<Address | null> {
  const client = await getWalletClient()
  if (!client) return null
  const [address] = await client.getAddresses()
  return address || null
}

// Helper to execute a transaction
async function executeTransaction(
  to: Address,
  data: Hex,
  _description: string
): Promise<{ success: boolean; hash?: Hex; error?: string }> {
  try {
    const client = await getWalletClient()
    if (!client) {
      return { success: false, error: "No wallet connected" }
    }

    const [account] = await client.getAddresses()
    if (!account) {
      return { success: false, error: "No account found" }
    }

    const hash = await client.sendTransaction({
      account,
      to,
      data,
      chain: baseSepolia,
    })

    // Wait for transaction to be mined
    const receipt = await publicClient.waitForTransactionReceipt({ hash })

    if (receipt.status === "success") {
      return { success: true, hash }
    } else {
      return { success: false, hash, error: "Transaction reverted" }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Transaction failed"
    return { success: false, error: message }
  }
}

// ============================================
// ESCROW ADMIN FUNCTIONS
// ============================================

export async function pauseEscrow() {
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "pause",
  })
  return executeTransaction(addresses.helpEscrow, data, "Pause Escrow")
}

export async function unpauseEscrow() {
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "unpause",
  })
  return executeTransaction(addresses.helpEscrow, data, "Unpause Escrow")
}

export async function setMaxAmount(amountUSD: number) {
  const amount = parseUnits(amountUSD.toString(), 6) // USDC has 6 decimals
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "setMaxAmount",
    args: [amount],
  })
  return executeTransaction(addresses.helpEscrow, data, "Set Max Amount")
}

export async function setMaxSessionDuration(hours: number) {
  const seconds = BigInt(hours * 60 * 60)
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "setMaxSessionDuration",
    args: [seconds],
  })
  return executeTransaction(addresses.helpEscrow, data, "Set Max Session Duration")
}

export async function setAutoReleaseWindow(hours: number) {
  const seconds = BigInt(hours * 60 * 60)
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "setAutoReleaseWindow",
    args: [seconds],
  })
  return executeTransaction(addresses.helpEscrow, data, "Set Auto Release Window")
}

export async function setTokenAllowed(tokenAddress: Address, allowed: boolean) {
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "setTokenAllowed",
    args: [tokenAddress, allowed],
  })
  return executeTransaction(addresses.helpEscrow, data, "Set Token Allowed")
}

export async function resolveDispute(requestId: Hex, helperBps: number) {
  // helperBps is basis points (e.g., 5000 = 50%)
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "resolve",
    args: [requestId, BigInt(helperBps)],
  })
  return executeTransaction(addresses.helpEscrow, data, "Resolve Dispute")
}

export async function grantEscrowRole(role: Hex, account: Address) {
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "grantRole",
    args: [role, account],
  })
  return executeTransaction(addresses.helpEscrow, data, "Grant Escrow Role")
}

export async function revokeEscrowRole(role: Hex, account: Address) {
  const data = encodeFunctionData({
    abi: escrowAbi,
    functionName: "revokeRole",
    args: [role, account],
  })
  return executeTransaction(addresses.helpEscrow, data, "Revoke Escrow Role")
}

// ============================================
// POOL ADMIN FUNCTIONS
// ============================================

export async function createPool(
  tokenAddress: Address,
  rulesHash: Hex,
  maxPerRequestUSD: number
) {
  const maxPerRequest = parseUnits(maxPerRequestUSD.toString(), 6)
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "createPool",
    args: [tokenAddress, rulesHash, maxPerRequest],
  })
  return executeTransaction(addresses.sponsorPool, data, "Create Pool")
}

export async function setPoolMaxPerRequest(poolId: number, maxPerRequestUSD: number) {
  const maxPerRequest = parseUnits(maxPerRequestUSD.toString(), 6)
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "setMaxPerRequest",
    args: [BigInt(poolId), maxPerRequest],
  })
  return executeTransaction(addresses.sponsorPool, data, "Set Pool Max Per Request")
}

export async function setPoolPaused(poolId: number, paused: boolean) {
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "setPaused",
    args: [BigInt(poolId), paused],
  })
  return executeTransaction(addresses.sponsorPool, data, paused ? "Pause Pool" : "Unpause Pool")
}

export async function setPoolRulesHash(poolId: number, rulesHash: Hex) {
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "setRulesHash",
    args: [BigInt(poolId), rulesHash],
  })
  return executeTransaction(addresses.sponsorPool, data, "Set Pool Rules Hash")
}

export async function grantPoolRole(role: Hex, account: Address) {
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "grantRole",
    args: [role, account],
  })
  return executeTransaction(addresses.sponsorPool, data, "Grant Pool Role")
}

export async function revokePoolRole(role: Hex, account: Address) {
  const data = encodeFunctionData({
    abi: poolAbi,
    functionName: "revokeRole",
    args: [role, account],
  })
  return executeTransaction(addresses.sponsorPool, data, "Revoke Pool Role")
}

// ============================================
// USDC FAUCET (for testing)
// ============================================

export async function mintTestUSDC() {
  const data = encodeFunctionData({
    abi: usdcAbi,
    functionName: "faucet",
  })
  return executeTransaction(addresses.mockUsdc, data, "Mint Test USDC")
}

// ============================================
// ROLE CONSTANTS
// ============================================

export const ESCROW_ROLES = {
  DEFAULT_ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
  ARBITER: "0x" as Hex, // Fetched dynamically
  ELIGIBILITY_SIGNER: "0x" as Hex,
  OPERATOR: "0x" as Hex,
  PAUSER: "0x" as Hex,
}

// Fetch role hashes from contract
export async function fetchEscrowRoles() {
  try {
    const [arbiter, eligibility, operator, pauser] = await Promise.all([
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "ARBITER_ROLE",
      }) as Promise<Hex>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "ELIGIBILITY_SIGNER_ROLE",
      }) as Promise<Hex>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "OPERATOR_ROLE",
      }) as Promise<Hex>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "PAUSER_ROLE",
      }) as Promise<Hex>,
    ])

    return {
      DEFAULT_ADMIN: ESCROW_ROLES.DEFAULT_ADMIN,
      ARBITER: arbiter,
      ELIGIBILITY_SIGNER: eligibility,
      OPERATOR: operator,
      PAUSER: pauser,
    }
  } catch {
    return ESCROW_ROLES
  }
}

// Check if address has a role
export async function hasEscrowRole(role: Hex, account: Address): Promise<boolean> {
  try {
    return await publicClient.readContract({
      address: addresses.helpEscrow,
      abi: escrowAbi,
      functionName: "hasRole",
      args: [role, account],
    }) as boolean
  } catch {
    return false
  }
}

export async function hasPoolRole(role: Hex, account: Address): Promise<boolean> {
  try {
    return await publicClient.readContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "hasRole",
      args: [role, account],
    }) as boolean
  } catch {
    return false
  }
}
