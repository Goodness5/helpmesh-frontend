"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { mintTestUSDC } from "@/lib/admin-actions"
import { addresses, EXPLORER } from "@/lib/chain/addresses"
import {
  Coins,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from "lucide-react"
import type { Hex } from "viem"

export function USDCFaucet() {
  const announce = useAnnounce()
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; hash?: Hex; error?: string } | null>(null)

  async function handleMint() {
    setLoading(true)
    setResult(null)
    try {
      const res = await mintTestUSDC()
      setResult(res)
      if (res.success) {
        announce("Test USDC minted successfully")
      } else {
        announce(`Failed to mint USDC: ${res.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setResult({ success: false, error: message })
      announce(`Failed to mint USDC: ${message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-2xl border border-[#25f497]/30 bg-[#25f497]/5 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Coins className="size-5 text-[#25f497]" aria-hidden="true" />
        <div>
          <h4 className="text-sm font-mono font-medium text-white">Test USDC Faucet</h4>
          <p className="text-xs text-zinc-500">Mint test USDC tokens for development</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start">
        <div className="text-xs font-mono text-zinc-400 space-y-1">
          <p>Token Address:</p>
          <a
            href={`${EXPLORER}/address/${addresses.mockUsdc}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[#25f497] hover:underline break-all"
          >
            {addresses.mockUsdc}
            <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
          </a>
        </div>

        <button
          type="button"
          onClick={handleMint}
          disabled={loading}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#25f497] hover:bg-[#1ee088] text-black font-mono text-sm font-semibold transition-all min-h-[48px] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="size-5 animate-spin" aria-hidden="true" />
          ) : (
            <Coins className="size-5" aria-hidden="true" />
          )}
          Mint 100 USDC
        </button>
      </div>

      {result && (
        <div className={`p-4 rounded-xl text-xs font-mono ${
          result.success 
            ? "bg-[#25f497]/10 border border-[#25f497]/30 text-[#25f497]" 
            : "bg-red-500/10 border border-red-500/30 text-red-400"
        }`}>
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            ) : (
              <XCircle className="size-4" aria-hidden="true" />
            )}
            <span>{result.success ? "100 USDC minted to your wallet!" : result.error || "Transaction failed"}</span>
          </div>
          {result.hash && (
            <a
              href={`${EXPLORER}/tx/${result.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 mt-2 text-zinc-400 hover:text-white"
            >
              <span>View on Explorer</span>
              <ExternalLink className="size-3" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  )
}
