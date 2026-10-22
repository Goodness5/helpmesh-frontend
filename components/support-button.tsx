"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { tip, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { formatTestMoney, HELPERS, helperStats, parseAmount } from "@/lib/model"
import { Heart, ArrowUpRight } from "lucide-react"

export function ProfileStats({ helperId }: { helperId: string }) {
  const demo = useDemo()
  const helper = HELPERS.find((item) => item.id === helperId)
  if (!helper) return null
  const stats = helperStats(helper, demo.records)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono">
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 backdrop-blur-md space-y-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">Completed</span>
        <div className="text-4xl sm:text-5xl font-medium text-white tracking-tight">
          {stats.helped}
        </div>
        <span className="text-xs text-zinc-500">Assistance sessions</span>
      </div>

      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 backdrop-blur-md space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#25f497]">Reputation</span>
        <div className="text-4xl sm:text-5xl font-medium text-[#25f497] tracking-tight flex items-center gap-2">
          <span>★</span>
          <span>{stats.score}</span>
        </div>
        <span className="text-xs text-zinc-500">Earned via completions</span>
      </div>

      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 backdrop-blur-md space-y-2">
        <span className="text-xs uppercase tracking-widest text-zinc-500">Identity</span>
        <div className="text-2xl sm:text-3xl font-medium text-white tracking-tight pt-2">
          {helper.verified ? "✓ Verified" : "Unverified"}
        </div>
        <span className="text-xs text-zinc-500">Platform screening</span>
      </div>
    </div>
  )
}

const PRESETS = ["2", "5", "10", "20"]

export function SupportButton({ helperId, helperName }: { helperId: string; helperName: string }) {
  const announce = useAnnounce()
  const [amountText, setAmountText] = useState("5")
  const [open, setOpen] = useState(false)
  const amount = parseAmount(amountText)

  return (
    <section className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-6 font-mono">
      <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
        <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
          <Heart className="size-5" />
        </div>
        <div>
          <h2 className="text-xl font-medium text-white tracking-tight">
            Support {helperName}
          </h2>
          <p className="text-xs text-zinc-500">
            Send an optional tip or gratitude grant directly to their wallet.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <span className="text-xs uppercase tracking-widest text-zinc-500">
          Tip Presets
        </span>
        <div className="flex flex-wrap gap-2.5">
          {PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              aria-pressed={amountText === preset}
              onClick={() => setAmountText(preset)}
              className={`px-4 py-2 rounded-full text-xs transition-colors ${
                amountText === preset
                  ? "bg-[#25f497] text-black font-semibold"
                  : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
              }`}
            >
              ${preset}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 max-w-sm">
        <label htmlFor="support" className="block text-xs uppercase tracking-widest text-zinc-400">
          Custom amount (USDC)
        </label>
        <input
          id="support"
          inputMode="decimal"
          autoComplete="off"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          placeholder="e.g. 5"
          className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497]"
        />
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => {
            if (!amount) {
              announce("Enter an amount like 5 or 5.00.")
              return
            }
            setOpen(true)
          }}
          className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
        >
          <span>Send {amount ? formatTestMoney(amount) : "support"} to {helperName}</span>
          <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
            <ArrowUpRight className="size-3 stroke-[2.5]" />
          </span>
        </button>
      </div>

      <Dialog
        open={open}
        title={amount ? `Send ${formatTestMoney(amount)} to ${helperName}` : `Support ${helperName}`}
        description="This gift does not confirm help and does not change reputation. Escape cancels."
        onClose={() => setOpen(false)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              if (!amount) return
              setOpen(false)
              announce("Sending support tokens...")
              void tip(helperId, amount).then(announce)
            }}
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-semibold px-6 py-3 rounded-full text-xs"
          >
            Confirm {amount ? formatTestMoney(amount) : "gift"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 text-xs"
          >
            Go back
          </button>
        </div>
      </Dialog>
    </section>
  )
}
