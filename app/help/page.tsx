import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"
import { BookOpen, ShieldCheck, Scale, AlertTriangle, PhoneCall, ArrowRight, MessageSquare } from "lucide-react"

export const metadata: Metadata = {
  title: "Assistance & Platform Manual",
  description: "How to ask for help, how autonomous escrow works, and safety guidelines.",
}

export default function HelpPage() {
  return (
    <div className="w-full space-y-8 sm:space-y-10 py-6 font-mono">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
          <span>Platform Guidelines &amp; Protocol Manual</span>
        </div>
        <PageTitle>Operating Principles</PageTitle>
        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl leading-relaxed">
          HelpMesh is engineered to operate reliably with screen readers, tactile keyboards, switch devices, or large-format text.
        </p>
      </div>

      {/* Principle Cards */}
      <div className="space-y-6">
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
              <BookOpen className="size-5" />
            </div>
            <h2 className="text-xl font-medium text-white tracking-tight">
              How Assistance Works
            </h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Start from a pre-configured template or write your custom requirements. You always review an immutable summary before broadcasting. Nearby peers receive distance and direction telemetry to locate you quickly.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
              <ShieldCheck className="size-5" />
            </div>
            <h2 className="text-xl font-medium text-white tracking-tight">
              Autonomous Escrow &amp; Funds
            </h2>
          </div>
          <p className="text-sm text-zinc-400 leading-relaxed">
            When requesting with a reward, test USDC is locked into a smart contract on Base Sepolia. The helper cannot claim tokens until you explicitly confirm completion in your session. Community donations to the Accessibility Fund are non-refundable and strictly disbursed for verified mobility, vision, or hearing assistance.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
            <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
              <Scale className="size-5" />
            </div>
            <h2 className="text-xl font-medium text-white tracking-tight">
              Glossary of Protocols
            </h2>
          </div>

          <div className="space-y-4 text-xs divide-y divide-zinc-900">
            <div className="pt-2 space-y-1">
              <strong className="text-[#25f497] text-sm">Locked in Escrow</strong>
              <p className="text-zinc-400 leading-relaxed">
                Tokens are held by the autonomous smart contract on Base Sepolia. Neither party can seize them without meeting completion conditions.
              </p>
            </div>

            <div className="pt-4 space-y-1">
              <strong className="text-[#25f497] text-sm">Accessibility Fund</strong>
              <p className="text-zinc-400 leading-relaxed">
                A community treasury pool that subsidizes assistance up to $25 for requesters who qualify under accessibility criteria.
              </p>
            </div>

            <div className="pt-4 space-y-1">
              <strong className="text-[#25f497] text-sm">Reputation Score</strong>
              <p className="text-zinc-400 leading-relaxed">
                Derived exclusively from verified, confirmed peer sessions minus disputes. Reputation can never be bought, tipped, or transferred.
              </p>
            </div>
          </div>
        </div>

        {/* Emergency Card */}
        <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-7 sm:p-9 backdrop-blur-md space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-red-950/50 border border-red-500/30 flex items-center justify-center text-red-400">
              <AlertTriangle className="size-5" />
            </div>
            <h2 className="text-xl font-medium text-red-300 tracking-tight">
              Emergency Situations
            </h2>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">
            HelpMesh is not an emergency dispatcher, paramedic, or police service. If you are in immediate personal or medical danger, immediately contact emergency responders.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <a
              href="tel:911"
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black font-bold px-6 py-3 rounded-full text-xs transition-colors"
            >
              <PhoneCall className="size-3.5" />
              <span>Call 911</span>
            </a>
            <a
              href="sms:911"
              className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 text-xs px-5 py-3 rounded-full transition-colors"
            >
              <MessageSquare className="size-3.5" />
              <span>Text 911</span>
            </a>
          </div>
        </div>
      </div>

      <div className="pt-2">
        <Link
          href="/settings/accessibility"
          className="group inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors"
        >
          <span>Display &amp; Sensory Settings</span>
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  )
}
