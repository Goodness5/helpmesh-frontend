"use client"

import Link from "next/link"
import { useDemo } from "@/components/demo"
import { PageTitle } from "@/components/page-title"
import { headline, modeLabel, type HelpRequest } from "@/lib/model"
import {
  Clock,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus,
  MessageSquare,
} from "lucide-react"

function statusBadge(status: HelpRequest["status"]) {
  switch (status) {
    case "open":
      return { label: "Looking for helper", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" }
    case "assigned":
      return { label: "Helper assigned", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" }
    case "started":
      return { label: "In progress", color: "bg-[#25f497]/20 text-[#25f497] border-[#25f497]/30" }
    case "awaiting_confirm":
      return { label: "Awaiting confirmation", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" }
    case "done":
      return { label: "Completed", color: "bg-[#25f497]/20 text-[#25f497] border-[#25f497]/30" }
    case "cancelled":
    case "refunded":
      return { label: "Cancelled", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" }
    case "disputed":
      return { label: "Under review", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" }
    case "resolved":
      return { label: "Resolved", color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" }
    default:
      return { label: status, color: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30" }
  }
}

export function MyHelps() {
  const demo = useDemo()

  // Get all requests where the user is the owner (requester)
  const myRequests = demo.requests.filter((r) => r.owner === "me")
  const activeRequests = myRequests.filter((r) => !["done", "cancelled", "refunded", "resolved"].includes(r.status))
  const completedRequests = myRequests.filter((r) => ["done", "cancelled", "refunded", "resolved"].includes(r.status))

  // Get requests where the user is the helper
  const helpingOthers = demo.requests.filter((r) => r.helperId === "me" && r.owner !== "me")

  if (!demo.ready) {
    return (
      <div className="flex items-center justify-center py-12" role="status" aria-label="Loading">
        <Loader2 className="size-8 text-[#25f497] animate-spin" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" aria-hidden="true" />
          <span>My Help Requests</span>
        </div>
        <PageTitle>Your Helps</PageTitle>
        <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
          Track all your help requests - both ones you&apos;ve made and ones you&apos;re helping with.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Active</span>
          <p className="text-2xl font-mono font-bold text-white">{activeRequests.length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Completed</span>
          <p className="text-2xl font-mono font-bold text-[#25f497]">{completedRequests.filter((r) => r.status === "done").length}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
          <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Helping Others</span>
          <p className="text-2xl font-mono font-bold text-blue-400">{helpingOthers.length}</p>
        </div>
        <Link
          href="/request/new"
          className="rounded-2xl border border-[#25f497]/30 bg-[#25f497]/5 hover:bg-[#25f497]/10 p-4 flex items-center gap-3 transition-colors group"
          aria-label="Create a new help request"
        >
          <div className="size-10 rounded-xl bg-[#25f497]/20 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
            <Plus className="size-5" aria-hidden="true" />
          </div>
          <div>
            <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">New Request</span>
            <p className="text-sm font-mono font-medium text-[#25f497] group-hover:underline">Ask for Help</p>
          </div>
        </Link>
      </div>

      {/* Active Requests */}
      {activeRequests.length > 0 && (
        <section className="space-y-4" aria-labelledby="active-heading">
          <h2 id="active-heading" className="text-lg font-mono font-medium text-white flex items-center gap-2">
            <Loader2 className="size-4 text-[#25f497] animate-spin" aria-hidden="true" />
            Active Requests
          </h2>
          <div className="space-y-4">
            {activeRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      {/* Helping Others */}
      {helpingOthers.length > 0 && (
        <section className="space-y-4" aria-labelledby="helping-heading">
          <h2 id="helping-heading" className="text-lg font-mono font-medium text-white flex items-center gap-2">
            <CheckCircle2 className="size-4 text-blue-400" aria-hidden="true" />
            People You&apos;re Helping
          </h2>
          <div className="space-y-4">
            {helpingOthers.map((request) => (
              <RequestCard key={request.id} request={request} asHelper />
            ))}
          </div>
        </section>
      )}

      {/* Completed Requests */}
      {completedRequests.length > 0 && (
        <section className="space-y-4" aria-labelledby="completed-heading">
          <h2 id="completed-heading" className="text-lg font-mono font-medium text-white flex items-center gap-2">
            <CheckCircle2 className="size-4 text-zinc-500" aria-hidden="true" />
            Past Requests
          </h2>
          <div className="space-y-4">
            {completedRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {myRequests.length === 0 && helpingOthers.length === 0 && (
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-12 text-center font-mono space-y-4">
          <div className="size-16 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-zinc-500">
            <AlertCircle className="size-8" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-medium text-white tracking-tight">No help requests yet</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            You haven&apos;t created any help requests or accepted any requests to help others.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href="/request/new"
              className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-colors min-h-[48px]"
            >
              <Plus className="size-4" aria-hidden="true" />
              Ask for Help
            </Link>
            <Link
              href="/helper"
              className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono font-medium px-6 py-3 rounded-full transition-colors min-h-[48px]"
            >
              Offer Help
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

function RequestCard({ request, asHelper = false }: { request: HelpRequest; asHelper?: boolean }) {
  const status = statusBadge(request.status)

  return (
    <Link
      href={`/request/${request.id}`}
      className="group block rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 hover:border-zinc-700 hover:bg-zinc-900/40 transition-all"
      aria-label={`View request: ${request.title}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono border ${status.color}`}>
              {status.label}
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
              {modeLabel(request.mode, request.amount)}
            </span>
          </div>
          <h3 className="text-base font-mono font-medium text-white group-hover:text-[#25f497] transition-colors">
            {request.title}
          </h3>
          <p className="text-sm font-mono text-zinc-400 line-clamp-2">{request.description}</p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-500">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3" aria-hidden="true" />
              {request.place || "Location not specified"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3" aria-hidden="true" />
              ~{request.minutes}m
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MessageSquare className="size-3" aria-hidden="true" />
              {request.communicate}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-mono text-zinc-500 group-hover:text-[#25f497]">
            {headline(request, asHelper)}
          </span>
          <ArrowRight className="size-4 text-zinc-600 group-hover:text-[#25f497] transition-colors" aria-hidden="true" />
        </div>
      </div>
    </Link>
  )
}
