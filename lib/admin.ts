"use client"

import { createPublicClient, http, formatUnits, type Address, type Hex } from "viem"
import { baseSepolia } from "viem/chains"
import { addresses, CHAIN_ID, EXPLORER } from "@/lib/chain/addresses"
import { escrowAbi, poolAbi, attestationsAbi, usdcAbi } from "@/lib/chain/abi"

// Create a public client for reading contract state
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(process.env.NEXT_PUBLIC_RPC_URL || "https://sepolia.base.org"),
})

export interface ContractInfo {
  name: string
  address: Address
  explorerUrl: string
}

export interface EscrowStats {
  paused: boolean
  maxAmount: string
  maxSessionDuration: string
  autoReleaseWindow: string
  tokenAllowed: boolean
}

export interface PoolInfo {
  id: number
  owner: Address
  token: Address
  rulesHash: Hex
  maxPerRequest: string
  balance: string
  totalDeposited: string
  totalDisbursed: string
  paused: boolean
}

export interface PlatformStats {
  escrowPaused: boolean
  poolBalance: string
  totalDeposited: string
  totalDisbursed: string
  usdcBalance: string
  nextPoolId: number
}

export const contracts: ContractInfo[] = [
  { name: "HelpEscrow", address: addresses.helpEscrow, explorerUrl: `${EXPLORER}/address/${addresses.helpEscrow}` },
  { name: "SponsorPool", address: addresses.sponsorPool, explorerUrl: `${EXPLORER}/address/${addresses.sponsorPool}` },
  { name: "HelpAttestations", address: addresses.helpAttestations, explorerUrl: `${EXPLORER}/address/${addresses.helpAttestations}` },
  { name: "MockUSDC", address: addresses.mockUsdc, explorerUrl: `${EXPLORER}/address/${addresses.mockUsdc}` },
  { name: "TipJar", address: addresses.tipJar, explorerUrl: `${EXPLORER}/address/${addresses.tipJar}` },
  { name: "ERC2771Forwarder", address: addresses.forwarder, explorerUrl: `${EXPLORER}/address/${addresses.forwarder}` },
]

export const ADMIN_ADDRESS = addresses.admin

// Role hashes (keccak256)
export const ROLES = {
  DEFAULT_ADMIN: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex,
  ARBITER: "0x" as Hex, // Will be fetched from contract
  ELIGIBILITY_SIGNER: "0x" as Hex,
  OPERATOR: "0x" as Hex,
  PAUSER: "0x" as Hex,
  ESCROW: "0x" as Hex, // For attestations contract
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  try {
    const [paused, nextPoolId] = await Promise.all([
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "paused",
      }) as Promise<boolean>,
      publicClient.readContract({
        address: addresses.sponsorPool,
        abi: poolAbi,
        functionName: "nextPoolId",
      }) as Promise<bigint>,
    ])

    // Try to get pool 1 info (main pool)
    let poolBalance = "0"
    let totalDeposited = "0"
    let totalDisbursed = "0"

    try {
      const poolData = await publicClient.readContract({
        address: addresses.sponsorPool,
        abi: poolAbi,
        functionName: "pools",
        args: [1n],
      }) as [Address, Address, Hex, bigint, bigint, bigint, bigint, boolean]

      poolBalance = formatUnits(poolData[4], 6)
      totalDeposited = formatUnits(poolData[5], 6)
      totalDisbursed = formatUnits(poolData[6], 6)
    } catch {
      // Pool might not exist yet
    }

    // Get USDC balance of escrow contract
    let usdcBalance = "0"
    try {
      const balance = await publicClient.readContract({
        address: addresses.mockUsdc,
        abi: usdcAbi,
        functionName: "balanceOf",
        args: [addresses.helpEscrow],
      }) as bigint
      usdcBalance = formatUnits(balance, 6)
    } catch {
      // Ignore
    }

    return {
      escrowPaused: paused,
      poolBalance,
      totalDeposited,
      totalDisbursed,
      usdcBalance,
      nextPoolId: Number(nextPoolId),
    }
  } catch (error) {
    console.error("Failed to fetch platform stats:", error)
    return {
      escrowPaused: false,
      poolBalance: "0",
      totalDeposited: "0",
      totalDisbursed: "0",
      usdcBalance: "0",
      nextPoolId: 0,
    }
  }
}

export async function fetchEscrowSettings(): Promise<EscrowStats> {
  try {
    const [paused, maxAmount, maxSession, autoRelease, tokenAllowed] = await Promise.all([
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "paused",
      }) as Promise<boolean>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "maxAmount",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "maxSessionDuration",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "autoReleaseWindow",
      }) as Promise<bigint>,
      publicClient.readContract({
        address: addresses.helpEscrow,
        abi: escrowAbi,
        functionName: "tokenAllowed",
        args: [addresses.mockUsdc],
      }) as Promise<boolean>,
    ])

    return {
      paused,
      maxAmount: formatUnits(maxAmount, 6),
      maxSessionDuration: (Number(maxSession) / 3600).toFixed(1) + " hours",
      autoReleaseWindow: (Number(autoRelease) / 3600).toFixed(1) + " hours",
      tokenAllowed,
    }
  } catch (error) {
    console.error("Failed to fetch escrow settings:", error)
    return {
      paused: false,
      maxAmount: "0",
      maxSessionDuration: "0",
      autoReleaseWindow: "0",
      tokenAllowed: false,
    }
  }
}

export async function fetchPoolInfo(poolId: number): Promise<PoolInfo | null> {
  try {
    const data = await publicClient.readContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "pools",
      args: [BigInt(poolId)],
    }) as [Address, Address, Hex, bigint, bigint, bigint, bigint, boolean]

    // Check if pool exists (owner is not zero address)
    if (data[0] === "0x0000000000000000000000000000000000000000") {
      return null
    }

    return {
      id: poolId,
      owner: data[0],
      token: data[1],
      rulesHash: data[2],
      maxPerRequest: formatUnits(data[3], 6),
      balance: formatUnits(data[4], 6),
      totalDeposited: formatUnits(data[5], 6),
      totalDisbursed: formatUnits(data[6], 6),
      paused: data[7],
    }
  } catch (error) {
    console.error(`Failed to fetch pool ${poolId}:`, error)
    return null
  }
}

export async function fetchAllPools(): Promise<PoolInfo[]> {
  try {
    const nextPoolId = await publicClient.readContract({
      address: addresses.sponsorPool,
      abi: poolAbi,
      functionName: "nextPoolId",
    }) as bigint

    const pools: PoolInfo[] = []
    for (let i = 1; i < Number(nextPoolId); i++) {
      const pool = await fetchPoolInfo(i)
      if (pool) pools.push(pool)
    }
    return pools
  } catch {
    return []
  }
}

export async function checkRole(contract: Address, role: Hex, account: Address): Promise<boolean> {
  try {
    const abi = contract === addresses.helpEscrow ? escrowAbi : 
                contract === addresses.sponsorPool ? poolAbi : attestationsAbi
    
    return await publicClient.readContract({
      address: contract,
      abi,
      functionName: "hasRole",
      args: [role, account],
    }) as boolean
  } catch {
    return false
  }
}

export async function fetchHelperCompletions(helperAddress: Address): Promise<number> {
  try {
    const completions = await publicClient.readContract({
      address: addresses.helpAttestations,
      abi: attestationsAbi,
      functionName: "completions",
      args: [helperAddress],
    }) as number
    return completions
  } catch {
    return 0
  }
}

export function isAdminAddress(address: string | undefined): boolean {
  if (!address) return false
  return address.toLowerCase() === ADMIN_ADDRESS.toLowerCase()
}

export { CHAIN_ID, EXPLORER, addresses }
