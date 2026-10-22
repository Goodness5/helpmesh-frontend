import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageTitle } from "@/components/page-title"
import { ProfileStats, SupportButton } from "@/components/support-button"
import { HELPERS } from "@/lib/model"
import { ArrowLeft, MapPin, ShieldCheck, HeartHandshake, Coins, MessageSquare } from "lucide-react"

export function generateStaticParams() {
  return HELPERS.map((helper) => ({ id: helper.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const helper = HELPERS.find((item) => item.id === id)
  if (!helper) return { title: "Helper" }
  return {
    title: `${helper.name} · Verified Peer Profile`,
    description: `${helper.name} helps nearby. Reputation is earned strictly through verified completions.`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const helper = HELPERS.find((item) => item.id === id)
  if (!helper) notFound()

  return (
    <div className="w-full space-y-8 sm:space-y-10 py-6 font-mono">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
          <span>Verified Helper Profile</span>
        </div>
        <PageTitle>{helper.name}</PageTitle>
      </div>

      <ProfileStats helperId={helper.id} />

      {/* Availability & Preferences */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-6">
        <h2 className="text-xl font-medium text-white tracking-tight border-b border-zinc-900 pb-4">
          Availability &amp; Preferences
        </h2>

        <div className="flex flex-wrap gap-2.5 text-xs">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <MapPin className="size-3.5 text-[#25f497]" />
            {helper.distanceM}m {helper.direction}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <ShieldCheck className="size-3.5 text-[#25f497]" />
            {helper.verified ? "Identity Screened" : "Unverified"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <HeartHandshake className="size-3.5 text-[#25f497]" />
            {helper.acceptsFree ? "Accepts Free Aid" : "Paid Only"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <Coins className="size-3.5 text-[#25f497]" />
            {helper.acceptsPaid ? "Accepts Rewards" : "Free Only"}
          </span>
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <MessageSquare className="size-3.5 text-[#25f497]" />
            {helper.communicate.join(" & ")}
          </span>
        </div>

        <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl">
          Reputation scores are calculated algorithmically based solely on confirmed sessions. Scores cannot be bought, rented, or transferred.
        </p>
      </div>

      <SupportButton helperId={helper.id} helperName={helper.name} />

      <div>
        <Link
          href="/helper"
          className="inline-flex items-center gap-2 text-xs text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Back to open requests</span>
        </Link>
      </div>
    </div>
  )
}
