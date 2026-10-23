"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useCallback } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { choose, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { modeLabel, type Mode } from "@/lib/model"
import {
  Compass,
  Eye,
  Ear,
  Radio,
  Clock,
  MapPin,
  MessageSquare,
  ArrowUpRight,
  CheckCircle2,
  Accessibility,
  RefreshCw,
  Loader2,
} from "lucide-react"

interface SharedRequest {
  id: string
  owner: string
  requesterName: string
  title: string
  description: string
  category: string
  mode: Mode
  amount: number
  place: string
  minutes: number
  status: string
  communicate: string
  needsSummary: string
  shareNeeds: boolean
  createdAt: number
}

function CategoryIcon({ category }: { category: string }) {
  const cat = category.toLowerCase()
  if (cat.includes("vision") || cat.includes("read") || cat.includes("see")) {
    return <Eye className="size-8 stroke-[1.8]" aria-hidden="true" />
  }
  if (cat.includes("hear") || cat.includes("sign") || cat.includes("audio")) {
    return <Ear className="size-8 stroke-[1.8]" aria-hidden="true" />
  }
  if (cat.includes("wheelchair") || cat.includes("mobility") || cat.includes("stair")) {
    return <Accessibility className="size-8 stroke-[1.8]" aria-hidden="true" />
  }
  if (cat.includes("walk") || cat.includes("escort") || cat.includes("transit")) {
    return <Compass className="size-8 stroke-[1.8]" aria-hidden="true" />
  }
  return <Radio className="size-8 stroke-[1.8]" aria-hidden="true" />
}

export function HelperBoard() {
  const demo = useDemo()
  const announce = useAnnounce()
  const router = useRouter()
  const [acceptId, setAcceptId] = useState<string | null>(null)
  const [sharedRequests, setSharedRequests] = useState<SharedRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Fetch shared requests from the mesh API
  useEffect(() => {
    let mounted = true
    
    async function fetchRequests() {
      try {
        const res = await fetch("/api/mesh/requests?excludeOwner=me")
        const data = await res.json()
        if (mounted && data.ok && Array.isArray(data.requests)) {
          setSharedRequests(data.requests)
        }
      } catch {
        // Silent fail
      } finally {
        if (mounted) setLoading(false)
      }
    }
    
    fetchRequests()
    // Refresh every 10 seconds
    const interval = setInterval(fetchRequests, 10000)
    
    return () => {
      mounted = false
      clearInterval(interval)
    }
  }, [])

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      const res = await fetch("/api/mesh/requests?excludeOwner=me")
      const data = await res.json()
      if (data.ok && Array.isArray(data.requests)) {
        setSharedRequests(data.requests)
      }
    } catch {
      // Silent fail
    } finally {
      setRefreshing(false)
    }
  }, [])

  // Combine local open requests (not owned by me) with shared requests
  const localOpen = demo.requests.filter((request) => request.status === "open" && request.owner !== "me")
  
  // Merge and dedupe by ID
  const allOpenIds = new Set<string>()
  const allOpen: Array<SharedRequest | typeof localOpen[0]> = []
  
  for (const req of sharedRequests) {
    if (!allOpenIds.has(req.id)) {
      allOpenIds.add(req.id)
      allOpen.push(req)
    }
  }
  for (const req of localOpen) {
    if (!allOpenIds.has(req.id)) {
      allOpenIds.add(req.id)
      allOpen.push(req as unknown as SharedRequest)
    }
  }
  
  const open = allOpen
  const chosen = open.find((request) => request.id === acceptId)

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 py-6">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
          <span>Peer Opportunity Feed</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <PageTitle>Help someone nearby</PageTitle>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-h-[36px]"
              aria-label="Refresh requests"
            >
              <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden="true" />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-300">
              {open.length} {open.length === 1 ? "request active" : "requests active"}
            </span>
          </div>
        </div>
        <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
          Review the requested assistance, proximity, and preferred communication. Accept to establish an end-to-end coordination session.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="size-8 text-[#25f497] animate-spin" aria-hidden="true" />
        </div>
      ) : open.length === 0 ? (
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-12 text-center font-mono space-y-4 backdrop-blur-sm" role="status">
          <div className="size-16 rounded-2xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <CheckCircle2 className="size-8" />
          </div>
          <h2 className="text-xl font-medium text-white tracking-tight">No help requests nearby</h2>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto">
            There are no open assistance requests in your vicinity right now. Check back shortly, or create your own request if you need help.
          </p>
          <Link
            href="/request/new"
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-colors mt-4 min-h-[48px]"
          >
            <span>Need Help Instead?</span>
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {open.map((request) => (
            <div
              key={request.id}
              className="group relative rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md shadow-xl transition-all duration-200 hover:border-zinc-700 hover:scale-[1.005] space-y-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
                <div className="flex items-start gap-5">
                  {/* Huge Category Icon */}
                  <div className="size-16 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-[#25f497] shrink-0 group-hover:border-[#25f497]/40 transition-colors">
                    <CategoryIcon category={request.category} />
                  </div>

                  <div className="space-y-1.5">
                    <span className="text-xs font-mono uppercase tracking-widest text-[#25f497]">
                      {request.category}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-mono font-medium text-white tracking-tight">
                      {request.title}
                    </h2>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 self-start">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#25f497]/10 text-[#25f497] border border-[#25f497]/30">
                    {modeLabel(request.mode, request.amount)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 border border-zinc-800 text-zinc-400">
                    <Clock className="size-3" />
                    ~{request.minutes}m
                  </span>
                </div>
              </div>

              <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                {request.description}
              </p>

              {/* Telemetry and Specs */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
                  <MapPin className="size-3.5 text-[#25f497]" />
                  {request.place || "Nearby"}
                </span>

                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
                  <MessageSquare className="size-3.5 text-[#25f497]" />
                  Communicate: {request.communicate}
                </span>

                {request.shareNeeds && request.needsSummary && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
                    <Accessibility className="size-3.5 text-[#25f497]" />
                    {request.needsSummary}
                  </span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-zinc-900">
                {request.owner === "me" ? (
                  <Link
                    href={`/request/${request.id}`}
                    className="inline-flex items-center gap-2 text-sm font-mono text-[#25f497] hover:underline min-h-[48px]"
                    aria-label={`View your request: ${request.title}`}
                  >
                    <span>View your active request</span>
                    <ArrowUpRight className="size-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setAcceptId(request.id)
                      announce(`Opening confirmation to help ${request.requesterName}`)
                    }}
                    aria-label={`Accept ${request.requesterName}'s request for ${request.title}`}
                    className="group/btn inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(37,244,151,0.2)] min-h-[48px]"
                  >
                    <span>Accept {request.requesterName}&apos;s request</span>
                    <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]" aria-hidden="true">
                      <ArrowUpRight className="size-3 stroke-[2.5]" />
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Acceptance Confirmation Dialog */}
      <Dialog
        open={Boolean(chosen)}
        title={chosen ? `Accept help for ${chosen.requesterName}` : "Accept request"}
        description={
          chosen
            ? `You are agreeing to assist ${chosen.requesterName}: "${chosen.description}". Preferred communication is by ${chosen.communicate}.`
            : ""
        }
        onClose={() => setAcceptId(null)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              void (async () => {
                if (!chosen) return
                const id = chosen.id
                announce(`Accepting help request from ${chosen.requesterName}`)
                const message = await choose(id, "me")
                setAcceptId(null)
                announce(message)
                router.push(`/request/${id}`)
              })()
            }}
            aria-label={`Confirm that you will help ${chosen?.requesterName}`}
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] min-h-[48px]"
          >
            Confirm Acceptance
          </button>
          <button
            type="button"
            onClick={() => {
              setAcceptId(null)
              announce("Cancelled")
            }}
            aria-label="Cancel and go back"
            className="inline-flex items-center px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-sm transition-colors min-h-[48px]"
          >
            Go back
          </button>
        </div>
      </Dialog>
    </div>
  )
}
