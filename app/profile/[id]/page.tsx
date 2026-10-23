import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"
import { ArrowLeft, User } from "lucide-react"

// Return a placeholder path to satisfy Next.js build requirements
// Real profiles will be looked up dynamically at runtime
export function generateStaticParams() {
  return [{ id: "_placeholder" }]
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  return {
    title: `Helper ${id} · Profile`,
    description: "View helper profile and reputation on HelpMesh.",
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // TODO: Fetch helper profile from database once helper registration is implemented
  // For now, show a placeholder since we removed mock data

  return (
    <div className="w-full space-y-8 sm:space-y-10 py-6 font-mono">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs uppercase tracking-widest text-zinc-400">
          <span className="size-2 rounded-full bg-zinc-500" />
          <span>Helper Profile</span>
        </div>
        <PageTitle>Helper {id.slice(0, 8)}...</PageTitle>
      </div>

      {/* Placeholder Card */}
      <div className="rounded-3xl border border-zinc-800/80 border-dashed bg-zinc-950/50 p-10 sm:p-14 text-center space-y-6">
        <div className="size-20 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
          <User className="size-10" />
        </div>
        <div className="space-y-3 max-w-md mx-auto">
          <h2 className="text-xl font-medium text-zinc-300">
            Profile Not Found
          </h2>
          <p className="text-sm text-zinc-500">
            This helper hasn&apos;t registered on the mesh yet, or the profile is still loading from the network.
          </p>
        </div>
      </div>

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
