import type { Abi } from "viem"
import forwarder from "./abis/ERC2771Forwarder.json"
import attestations from "./abis/HelpAttestations.json"
import escrow from "./abis/HelpEscrow.json"
import usdc from "./abis/MockUSDC.json"
import pool from "./abis/SponsorPool.json"
import tipJar from "./abis/TipJar.json"

export const forwarderAbi = forwarder as Abi
export const attestationsAbi = attestations as Abi
export const escrowAbi = escrow as Abi
export const usdcAbi = usdc as Abi
export const poolAbi = pool as Abi
export const tipJarAbi = tipJar as Abi
