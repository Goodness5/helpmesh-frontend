"use client"

import { useState, useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { faucet, useDemo } from "@/components/demo"
import { PageTitle } from "@/components/page-title"
import { addresses, EXPLORER } from "@/lib/chain/addresses"
import { liveChain } from "@/lib/chain/plain"
import { accountFor } from "@/lib/chain/session"
import { formatTestMoney } from "@/lib/model"
import { PrivyAccountCard } from "@/components/privy-auth"
import { Wallet, Plus, Copy, Check, ExternalLink, History, Cpu } from "lucide-react"

function yourAddress() {
  if (!liveChain || typeof window === "undefined") return ""
  return accountFor("you").address
}

export function WalletScreen() {
  const demo = useDemo()
  const announce = useAnnounce()
  const address = useSyncExternalStore(() => () => {}, yourAddress, () => "")
  const [copied, setCopied] = useState(false)

  const loading = !demo.ready || (liveChain && !demo.funded)

  function copyAddress() {
    if (!address) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(() => {
        setCopied(true)
        announce("Address copied to clipboard.")
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 py-6">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
          <span>Base Network · Smart Contract Escrow</span>
        </div>
        <PageTitle>Escrow Balance</PageTitle>
        <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
          Manage your decentralized USDC escrow collateral on Base. Committed funds remain locked in autonomous smart contracts until verified mutual completion.
        </p>
      </div>

      {/* Account Abstraction & Embedded Wallet Card */}
      <PrivyAccountCard />

      {/* Main Balance Card with Huge Icon */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-10 backdrop-blur-md shadow-2xl transition-all duration-200 hover:border-zinc-700">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-900">
          <div className="space-y-3">
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
              Available Collateral Balance
            </span>
            {loading ? (
              <p className="text-4xl sm:text-6xl font-mono text-zinc-600 animate-pulse">
                Loading...
              </p>
            ) : (
              <div className="text-5xl sm:text-7xl font-mono font-medium text-white tracking-tight">
                {formatTestMoney(demo.balance)}
              </div>
            )}
          </div>

          {/* Huge Wallet Icon Badge */}
          <div className="size-16 sm:size-20 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497] shrink-0 self-start">
            <Wallet className="size-9 sm:size-11 stroke-[1.6]" />
          </div>
        </div>

        <div className="py-6 space-y-6">
          <p className="text-sm font-mono text-zinc-400 leading-relaxed max-w-2xl">
            USDC Escrow Collateral on Base. Amounts you commit are held in an autonomous, non-custodial smart contract escrow until you confirm assistance is complete.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => {
                announce("Depositing USDC collateral...")
                void faucet().then((message) => announce(message))
              }}
              className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
            >
              <span>Deposit Collateral</span>
              <span className="flex items-center justify-center size-6 rounded-full bg-black text-[#25f497]">
                <Plus className="size-3.5 stroke-[2.5]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => announce("Collateral withdrawal transfers available USDC back to your connected wallet.")}
              className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white font-mono font-medium px-6 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-zinc-700"
            >
              <span>Withdraw</span>
            </button>
          </div>
        </div>
      </div>

      {/* Activity & Escrow History Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-9 backdrop-blur-sm space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
              <History className="size-5" />
            </div>
            <h2 className="text-xl font-mono font-medium text-white tracking-tight">
              Activity &amp; Escrow History
            </h2>
          </div>
          <span className="text-xs font-mono text-zinc-500">
            {demo.activity.length} {demo.activity.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {demo.activity.length === 0 ? (
          <div className="py-12 text-center text-zinc-500 font-mono text-sm space-y-2">
            <p>No transaction activity recorded yet.</p>
            <p className="text-xs text-zinc-600">Transactions appear here when requests are published or fulfilled.</p>
          </div>
        ) : (
          <ul className="divide-y divide-zinc-900/80 font-mono text-sm">
            {demo.activity.map((item, index) => (
              <li
                key={`${item}-${index}`}
                className="py-3.5 flex items-center justify-between gap-4 text-zinc-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="size-1.5 rounded-full bg-[#25f497]" />
                  <span>{item}</span>
                </div>
                <span className="text-xs text-zinc-600 shrink-0 font-mono">Confirmed</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Advanced Web3 Details Collapsible */}
      <details className="group rounded-3xl border border-zinc-800/80 bg-zinc-950/40 p-6 sm:p-7 transition-all duration-200 open:border-zinc-700">
        <summary className="flex items-center justify-between cursor-pointer list-none font-mono text-sm font-medium text-zinc-300 hover:text-white">
          <div className="flex items-center gap-3">
            <Cpu className="size-4 text-[#25f497]" />
            <span>Advanced Web3 Details</span>
          </div>
          <span className="text-xs font-mono text-zinc-500 group-open:rotate-180 transition-transform">
            ▼
          </span>
        </summary>

        <div className="pt-6 mt-6 border-t border-zinc-900/80 space-y-4 font-mono text-xs sm:text-sm">
          {liveChain ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 py-2 border-b border-zinc-900/50">
                <span className="text-zinc-500">Network:</span>
                <span className="text-zinc-200">Base Network (Chain ID: 84532)</span>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-2 border-b border-zinc-900/50">
                <span className="text-zinc-500">Wallet Account:</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono bg-zinc-900 text-[#25f497] px-3 py-1.5 rounded-lg border border-zinc-800 break-all">
                    {address || "Loading..."}
                  </code>
                  {address && (
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors text-xs font-mono"
                      aria-label="Copy wallet address"
                    >
                      {copied ? <Check className="size-3.5 text-[#25f497]" /> : <Copy className="size-3.5" />}
                      <span>{copied ? "Copied" : "Copy"}</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`${EXPLORER}/address/${addresses.mockUsdc}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-[#25f497] hover:underline text-xs font-mono"
                >
                  <span>View USDC Escrow Token on BaseScan</span>
                  <ExternalLink className="size-3.5" />
                </a>
              </div>
            </>
          ) : (
            <p className="text-zinc-500 font-mono text-xs">
              Autonomous mode active. Transactions are secured on-chain with zero gas fees.
            </p>
          )}
        </div>
      </details>
    </div>
  )
}
