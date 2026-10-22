"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { donate, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { liveChain } from "@/lib/chain/plain"
import { formatTestMoney, FUND_MAX, parseAmount } from "@/lib/model"
import { Sparkles, Award, ArrowUpRight, ShieldCheck, HeartHandshake } from "lucide-react"

const PRESETS = ["5", "10", "20", "50"]

export function FundScreen() {
  const demo = useDemo()
  const announce = useAnnounce()
  const [amountText, setAmountText] = useState("20")
  const [open, setOpen] = useState(false)
  const amount = parseAmount(amountText)
  const paid = demo.requests.filter(
    (request) => request.mode === "sponsored" && (request.status === "done" || request.status === "resolved")
  ).length

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 py-6">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
          <span>Community Sponsorship Treasury</span>
        </div>
        <PageTitle>Accessibility Fund</PageTitle>
        <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
          An autonomous smart contract treasury ensuring people who require assistance receive it without financial barriers.
        </p>
      </div>

      {/* Main Treasury Balance Card with Huge Sparkles Icon */}
      <div className="relative overflow-hidden rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-10 backdrop-blur-md shadow-2xl transition-all duration-200 hover:border-[#25f497]/50">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-6 border-b border-zinc-900">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                Treasury Reserve Pool
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-[#25f497]/15 text-[#25f497] border border-[#25f497]/30">
                {paid} {paid === 1 ? "grant disbursed" : "grants disbursed"}
              </span>
            </div>

            <div className="text-5xl sm:text-7xl font-mono font-medium text-white tracking-tight">
              {!demo.ready || (liveChain && !demo.funded) ? "Loading..." : formatTestMoney(demo.poolBalance)}
            </div>
          </div>

          {/* Huge Sparkles Icon Badge */}
          <div className="size-16 sm:size-20 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497] shrink-0 self-start">
            <Sparkles className="size-9 sm:size-11 stroke-[1.6]" />
          </div>
        </div>

        <div className="pt-6">
          <p className="text-sm font-mono text-zinc-400 leading-relaxed max-w-2xl">
            A transparent smart contract pool funding assistance for requesters who cannot pay. Donated tokens can only exit the fund through verified completion of eligible needs.
          </p>
        </div>
      </div>

      {/* Pool Coverage Rules Card with Huge Award Icon */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-9 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-zinc-900 pb-5">
          <div className="size-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <Award className="size-6 stroke-[1.8]" />
          </div>
          <div>
            <h2 className="text-xl font-mono font-medium text-white tracking-tight">
              Pool Coverage Rules
            </h2>
            <p className="text-xs font-mono text-zinc-500">
              Verified automated disbursements on Base Sepolia
            </p>
          </div>
        </div>

        <p className="text-sm font-mono text-zinc-400 leading-relaxed">
          Covers up to <strong className="text-white font-medium">{formatTestMoney(FUND_MAX)}</strong> for verified mobility, vision, or hearing assistance. Disbursements are autonomous and verifiable on-chain.
        </p>

        <div className="flex flex-wrap gap-2.5">
          {["Mobility & Transit", "Vision Guidance", "Hearing & Translation", "Max $25 / Request"].map((item) => (
            <span
              key={item}
              className="inline-flex items-center px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-xs font-mono text-zinc-300"
            >
              <ShieldCheck className="size-3 text-[#25f497] mr-1.5" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Contribution Form Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
          <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <HeartHandshake className="size-5" />
          </div>
          <h2 className="text-xl font-mono font-medium text-white tracking-tight">
            Contribute to the Fund
          </h2>
        </div>

        <div className="space-y-3">
          <label htmlFor="gift" className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
            Amount to contribute (USDC)
          </label>
          <div className="relative max-w-md">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500 font-mono text-lg">
              $
            </span>
            <input
              id="gift"
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="e.g. 20"
              className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl pl-9 pr-4 py-3.5 text-xl font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497] transition-colors"
            />
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
            Quick Presets
          </span>
          <div className="flex flex-wrap gap-2.5">
            {PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                aria-pressed={amountText === preset}
                onClick={() => setAmountText(preset)}
                className={`px-5 py-2 rounded-full font-mono text-sm transition-all duration-150 ${
                  amountText === preset
                    ? "bg-[#25f497] text-black font-semibold shadow-[0_0_16px_rgba(37,244,151,0.25)]"
                    : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:border-zinc-700"
                }`}
              >
                ${preset}
              </button>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              if (!amount) {
                announce("Enter an amount like 20 or 20.00.")
                return
              }
              setOpen(true)
            }}
            className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
          >
            <span>Contribute to the fund</span>
            <span className="flex items-center justify-center size-6 rounded-full bg-black text-[#25f497]">
              <ArrowUpRight className="size-3.5 stroke-[2.5]" />
            </span>
          </button>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog
        open={open}
        title={amount ? `Add ${formatTestMoney(amount)} to the Accessibility Fund` : "Add to the fund"}
        description="This contribution cannot be refunded. It is locked into the treasury and can only release to verified helpers who fulfill eligible requests. Press Escape to cancel."
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              if (!amount) return
              setOpen(false)
              announce("Sending contribution transaction...")
              void donate(amount).then(announce)
            }}
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            Confirm {amount ? formatTestMoney(amount) : "contribution"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </Dialog>
    </div>
  )
}
