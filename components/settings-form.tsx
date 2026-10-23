"use client"

import Link from "next/link"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { resetDemo } from "@/components/demo"
import { PrefsFields, usePrefs } from "@/components/prefs-fields"
import { applyPrefs } from "@/lib/prefs"
import { UserCheck, Trash2, ArrowRight } from "lucide-react"

export function SettingsForm() {
  const announce = useAnnounce()
  const prefs = usePrefs()

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 sm:space-y-10 py-6 font-mono">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
          <span>Accessibility &amp; Environment</span>
        </div>
        <PageTitle>Display &amp; Accessibility</PageTitle>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          Fine-tune visual contrast, typography, scaling, and feedback to suit your perceptual preferences. Changes persist locally.
        </p>
      </div>

      <PrefsFields
        prefs={prefs}
        onChange={(next) => {
          applyPrefs(next)
          announce("Display settings updated.")
        }}
      />

      {/* Profile & Needs Link Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <UserCheck className="size-5" />
          </div>
          <h2 className="text-xl font-medium text-white tracking-tight">
            Assistance Profile &amp; Needs
          </h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Configure what you share with peers, communication preferences, and radius settings.
        </p>
        <div className="pt-2">
          <Link
            href="/onboarding"
            className="group inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 hover:text-white px-6 py-3 rounded-full text-xs transition-colors"
          >
            <span>Configure Your Profile</span>
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Local Storage & Reset Card */}
      <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-7 sm:p-9 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
            <Trash2 className="size-5" />
          </div>
          <h2 className="text-xl font-medium text-red-300 tracking-tight">
            Local Storage &amp; Reset
          </h2>
        </div>
        <p className="text-sm text-zinc-400 leading-relaxed">
          Clears local browser requests and cached session state. Escrow collateral and transactions committed to Base remain intact on-chain.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              resetDemo()
              announce("Local storage cleared.")
            }}
            className="inline-flex items-center gap-2 bg-red-500/90 hover:bg-red-500 text-black font-semibold px-6 py-3 rounded-full text-xs transition-colors"
          >
            <Trash2 className="size-3.5" />
            <span>Reset Local Browser Cache</span>
          </button>
        </div>
      </div>
    </div>
  )
}
