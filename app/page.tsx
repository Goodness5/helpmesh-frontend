import type { Metadata } from "next"
import Link from "next/link"
import { Reach } from "@/components/reach"
import { VectorMesh } from "@/components/vector-mesh"
import { HeartHandshake, ShieldCheck, Sparkles, ArrowUpRight, ArrowRight, Activity, Users, Lock, EyeOff, Mic, Video } from "lucide-react"

export const metadata: Metadata = {
  title: { absolute: "HelpMesh · Peer-to-Peer Assistance Network" },
  description: "Ask someone nearby for help, offer help, or fund it with decentralized escrow.",
}

export default function HomePage() {
  return (
    <div className="relative w-full space-y-16 sm:space-y-24 py-6 sm:py-10">
      {/* Hero Section with Vector Mesh Background */}
      <section className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-black/60 backdrop-blur-xl p-6 sm:p-10 md:p-14 shadow-2xl">
        <VectorMesh />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-8 items-center">
          <div className="lg:col-span-7 space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
              <span className="relative flex size-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25f497] opacity-75" />
                <span className="relative inline-flex rounded-full size-2.5 bg-[#25f497]" />
              </span>
              <span className="text-xs font-mono tracking-wider uppercase text-zinc-300">
                Registered Assistance Mesh
              </span>
            </div>

            <h1 className="text-4xl sm:text-6xl md:text-7xl font-mono font-medium tracking-tight text-white leading-[1.08]">
              A person nearby <br className="hidden sm:inline" />
              can help.
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 font-mono max-w-2xl leading-relaxed">
              Need a guide, a hand with stairs, or escort for a short journey? Post what you need in seconds.
              Someone close can accept. Escrow locks the reward until help is confirmed.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/request/new"
                className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_28px_rgba(37,244,151,0.22)]"
              >
                <span>Ask for help</span>
                <span className="flex items-center justify-center size-6 rounded-full bg-black text-[#25f497] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
                  <ArrowUpRight className="size-3.5 stroke-[2.5]" />
                </span>
              </Link>

              <Link
                href="/helper"
                className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800/80 text-zinc-200 hover:text-white font-mono font-medium px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] hover:border-zinc-700"
              >
                <span>Offer help</span>
              </Link>
            </div>

            <div className="pt-2">
              <Link
                href="/onboarding"
                className="group inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-[#25f497] transition-colors"
              >
                <span>Personalize how HelpMesh works for you</span>
                <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1 text-[#25f497]" />
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <Reach />
          </div>
        </div>
      </section>

      {/* Protocol Payment Modes with Huge Icons */}
      <section className="space-y-6 sm:space-y-8" aria-label="How help is paid">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="size-4 text-[#25f497]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#25f497]">
                Settlement Protocols
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-medium text-white tracking-tight">
              Three ways help is coordinated.
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-zinc-500 max-w-sm">
            Autonomous smart contract escrows on Base Sepolia guarantee verified release with zero intermediary fees.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mode 01: Volunteer */}
          <article className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/40 hover:scale-[1.01]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#25f497] bg-[#25f497]/10 px-3 py-1 rounded-full border border-[#25f497]/20">
                  Mode 01
                </span>
                <Users className="size-6 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>

              {/* Huge Icon */}
              <div className="size-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-[#25f497] transition-transform duration-200 group-hover:scale-105 group-hover:border-[#25f497]/40">
                <HeartHandshake className="size-9 stroke-[1.6]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-mono font-medium text-white tracking-tight">
                  Volunteer
                </h3>
                <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                  Zero payment. Pure mutual assistance from a verified neighbor who has a few minutes to spare.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>Cost: $0.00</span>
              <span className="text-[#25f497]">100% Free</span>
            </div>
          </article>

          {/* Mode 02: Reward Escrow */}
          <article className="group relative flex flex-col justify-between rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-sm transition-all duration-200 hover:border-zinc-700 hover:bg-zinc-900/40 hover:scale-[1.01]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#25f497] bg-[#25f497]/10 px-3 py-1 rounded-full border border-[#25f497]/20">
                  Mode 02
                </span>
                <Lock className="size-6 text-zinc-600 group-hover:text-zinc-400 transition-colors" />
              </div>

              {/* Huge Icon */}
              <div className="size-16 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center text-[#25f497] transition-transform duration-200 group-hover:scale-105 group-hover:border-[#25f497]/40">
                <ShieldCheck className="size-9 stroke-[1.6]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-mono font-medium text-white tracking-tight">
                  Reward Escrow
                </h3>
                <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                  You lock test USDC into an autonomous escrow contract. Released only when you confirm completion.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex items-center justify-between text-xs font-mono text-zinc-500">
              <span>Security: On-Chain Escrow</span>
              <span className="text-[#25f497]">Non-Custodial</span>
            </div>
          </article>

          {/* Mode 03: Accessibility Fund */}
          <article className="group relative flex flex-col justify-between rounded-2xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-8 backdrop-blur-sm transition-all duration-200 hover:border-[#25f497]/60 hover:bg-zinc-900/40 hover:scale-[1.01] shadow-[0_0_30px_rgba(37,244,151,0.06)]">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="inline-block text-xs font-mono uppercase tracking-widest text-[#25f497] bg-[#25f497]/15 px-3 py-1 rounded-full border border-[#25f497]/30">
                  Mode 03
                </span>
                <Sparkles className="size-6 text-[#25f497] animate-pulse" />
              </div>

              {/* Huge Icon */}
              <div className="size-16 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497] transition-transform duration-200 group-hover:scale-105">
                <Sparkles className="size-9 stroke-[1.6]" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-mono font-medium text-white tracking-tight">
                  Accessibility Fund
                </h3>
                <p className="text-sm font-mono text-zinc-400 leading-relaxed">
                  Community sponsorship pool pays up to $25 for verified mobility, vision, or hearing assistance.
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-zinc-900 flex items-center justify-between text-xs font-mono">
              <Link
                href="/fund"
                className="group/link inline-flex items-center gap-1.5 text-[#25f497] hover:underline font-medium"
              >
                <span>View treasury pool</span>
                <ArrowRight className="size-3.5 transition-transform group-hover/link:translate-x-0.5" />
              </Link>
              <span className="text-zinc-500">Max $25 / req</span>
            </div>
          </article>
        </div>
      </section>

      {/* Cryptographic Privacy & Zero-Data Collection Section */}
      <section className="space-y-6 sm:space-y-8" aria-label="Privacy and Architecture">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800/80 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <EyeOff className="size-4 text-[#25f497]" />
              <span className="text-xs font-mono uppercase tracking-widest text-[#25f497]">
                Zero Centralized Data Collection
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-mono font-medium text-white tracking-tight">
              Privacy by Design · On-Chain Sovereignty
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-mono text-zinc-500 max-w-sm">
            HelpMesh requires no account signup, collects no personal telemetry, and runs autonomously on Base Sepolia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-sm space-y-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <Lock className="size-7 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-mono font-medium text-white tracking-tight">
              100% Private Blockchain State
            </h3>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed">
              Your assistance requests and escrow allocations execute through open smart contracts. There is no corporate tracking database, no user monetization, and no data harvesting.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-sm space-y-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <Video className="size-7 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-mono font-medium text-white tracking-tight">
              Direct P2P Call Mode &amp; Live GPS
            </h3>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed">
              In-app video and audio calls use peer-to-peer WebRTC connections. Packets stream directly between you and your helper with real-time GPS telemetry and zero central recording.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-8 backdrop-blur-sm space-y-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <Mic className="size-7 stroke-[1.8]" />
            </div>
            <h3 className="text-lg font-mono font-medium text-white tracking-tight">
              Voice Controls for Blind &amp; Low Vision
            </h3>
            <p className="text-xs sm:text-sm font-mono text-zinc-400 leading-relaxed">
              Built-in speech recognition assistant (Press Alt+V) and speech synthesis (TTS) provide total hands-free navigation and instant screen announcements for visually impaired users.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
