import { NextResponse } from "next/server"
import { addresses, CHAIN_ID, EXPLORER } from "@/lib/chain/addresses"
import {
  attestationsAbi,
  escrowAbi,
  forwarderAbi,
  poolAbi,
  tipJarAbi,
  usdcAbi,
} from "@/lib/chain/abi"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const contract = url.searchParams.get("contract")

  const registry = {
    network: "Base Network (84532)",
    chainId: CHAIN_ID,
    explorer: EXPLORER,
    contracts: {
      HelpEscrow: {
        address: addresses.helpEscrow,
        explorerUrl: `${EXPLORER}/address/${addresses.helpEscrow}`,
        abi: escrowAbi,
      },
      MockUSDC: {
        address: addresses.mockUsdc,
        explorerUrl: `${EXPLORER}/address/${addresses.mockUsdc}`,
        abi: usdcAbi,
      },
      SponsorPool: {
        address: addresses.sponsorPool,
        explorerUrl: `${EXPLORER}/address/${addresses.sponsorPool}`,
        abi: poolAbi,
      },
      HelpAttestations: {
        address: addresses.helpAttestations,
        explorerUrl: `${EXPLORER}/address/${addresses.helpAttestations}`,
        abi: attestationsAbi,
      },
      TipJar: {
        address: addresses.tipJar,
        explorerUrl: `${EXPLORER}/address/${addresses.tipJar}`,
        abi: tipJarAbi,
      },
      ERC2771Forwarder: {
        address: addresses.forwarder,
        explorerUrl: `${EXPLORER}/address/${addresses.forwarder}`,
        abi: forwarderAbi,
      },
    },
  }

  if (contract && contract in registry.contracts) {
    const selected = registry.contracts[contract as keyof typeof registry.contracts]
    return NextResponse.json({
      ok: true,
      contract,
      ...selected,
    })
  }

  return NextResponse.json({
    ok: true,
    ...registry,
  })
}
