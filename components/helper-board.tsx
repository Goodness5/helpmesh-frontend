"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useCallback, useEffect } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { Dialog } from "@/components/dialog"
import { LocationMap, useMyLocation, parseCoordinates } from "@/components/location-map"
import { useMesh, humanStory, type HelpRequest } from "@/lib/mesh-context"
import { Heart, ShieldCheck, Users, Phone, Video } from "lucide-react"
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
  Send,
} from "lucide-react"

function modeLabel(mode: string, amount: number): string {
  if (mode === "volunteer") return "Volunteer"
  if (mode === "reward") return amount > 0 ? `$${(amount / 1_000_000).toFixed(2)} Reward` : "Reward"
  if (mode === "sponsored") return "Sponsored"
  return mode
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
  const { openRequests, loading, refresh, acceptRequest, sendMessage: meshSendMessage, userName } = useMesh()
  const announce = useAnnounce()
  const router = useRouter()
  const [acceptId, setAcceptId] = useState<string | null>(null)
  const [messageId, setMessageId] = useState<string | null>(null)
  const [messageText, setMessageText] = useState("")
  const [refreshing, setRefreshing] = useState(false)
  const { location: myLocation } = useMyLocation()
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; senderName: string; content: string; createdAt: number }>>([])
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Fetch messages for a request
  const fetchMessages = useCallback(async (requestId: string) => {
    setLoadingMessages(true)
    try {
      const res = await fetch(`/api/mesh/messages?requestId=${requestId}`)
      const data = await res.json()
      if (data.ok) {
        setChatMessages(data.messages || [])
      }
    } catch {
      // Silent fail
    } finally {
      setLoadingMessages(false)
    }
  }, [])

  // When message dialog opens, fetch messages
  useEffect(() => {
    if (messageId) {
      fetchMessages(messageId)
      // Poll for new messages
      const interval = setInterval(() => fetchMessages(messageId), 3000)
      return () => clearInterval(interval)
    } else {
      setChatMessages([])
    }
  }, [messageId, fetchMessages])

  // Manual refresh function
  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  // Send message to requester
  const sendMessageToRequester = useCallback(async (requestId: string, requesterName: string) => {
    if (!messageText.trim()) return
    
    const result = await meshSendMessage(requestId, messageText.trim())
    
    if (result.ok) {
      announce(`Message sent to ${requesterName}`)
      setMessageText("")
      // Refresh messages to show the sent message
      await fetchMessages(requestId)
    } else {
      announce(`Failed to send: ${result.message}`)
    }
  }, [messageText, meshSendMessage, announce, fetchMessages])

  // Handle accept
  const handleAccept = useCallback(async (request: HelpRequest) => {
    announce(`Accepting help request from ${request.requesterName}`)
    const result = await acceptRequest(request.id)
    
    if (result.ok) {
      setAcceptId(null)
      announce(result.message)
      router.push(`/request/${request.id}`)
    } else {
      announce(result.message)
    }
  }, [acceptRequest, announce, router])

  const open = openRequests
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

              {/* Human Story */}
              <div className="rounded-2xl bg-gradient-to-r from-zinc-900/80 to-zinc-900/40 border border-zinc-800/50 p-4 space-y-3">
                <p className="text-base font-mono text-zinc-200 leading-relaxed">
                  {humanStory(request)}
                </p>
                
                {request.requesterBio && (
                  <p className="text-sm font-mono text-zinc-400 italic">
                    &ldquo;{request.requesterBio}&rdquo;
                  </p>
                )}
                
                {/* Trust indicators */}
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {request.requesterVerified && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#25f497]">
                      <ShieldCheck className="size-3.5" />
                      Verified identity
                    </span>
                  )}
                  {(request.requesterHelpedCount ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                      <Heart className="size-3.5" />
                      Helped {request.requesterHelpedCount} time{(request.requesterHelpedCount ?? 0) > 1 ? "s" : ""} before
                    </span>
                  )}
                  {(request.requesterCompletions ?? 0) > 0 && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400">
                      <Users className="size-3.5" />
                      Helped others {request.requesterCompletions} time{(request.requesterCompletions ?? 0) > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-sm font-mono text-zinc-300 leading-relaxed">
                {request.description}
              </p>

              {/* Location Map */}
              {parseCoordinates(request.place) && (
                <LocationMap 
                  place={request.place} 
                  requesterName={request.requesterName}
                  helperLocation={myLocation}
                  height="180px"
                />
              )}

              {/* Telemetry and Specs */}
              <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs font-mono">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
                  <MapPin className="size-3.5 text-[#25f497]" />
                  {parseCoordinates(request.place) 
                    ? `GPS Location` 
                    : (request.place || "Nearby")}
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
              <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center gap-3">
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
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setMessageId(request.id)
                        announce(`Opening chat with ${request.requesterName}`)
                      }}
                      aria-label={`Message ${request.requesterName} before accepting`}
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono font-medium transition-all min-h-[48px]"
                    >
                      <MessageSquare className="size-4" aria-hidden="true" />
                      <span>Message first</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAcceptId(request.id)
                        announce(`Opening confirmation to help ${request.requesterName}`)
                      }}
                      aria-label={`Accept ${request.requesterName}'s request for ${request.title}`}
                      className="group/btn inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_20px_rgba(37,244,151,0.2)] min-h-[48px]"
                    >
                      <span>Accept request</span>
                      <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]" aria-hidden="true">
                        <ArrowUpRight className="size-3 stroke-[2.5]" />
                      </span>
                    </button>
                  </>
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
            onClick={() => chosen && handleAccept(chosen)}
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

      {/* Pre-Accept Messaging Dialog */}
      <Dialog
        open={Boolean(messageId)}
        title={messageId ? `Chat with ${open.find(r => r.id === messageId)?.requesterName || "requester"}` : "Send message"}
        description="Send a message or call before accepting."
        onClose={() => {
          setMessageId(null)
          setMessageText("")
        }}
      >
        {(() => {
          const msgRequest = open.find(r => r.id === messageId)
          if (!msgRequest) return null
          
          return (
            <div className="space-y-4">
              {/* Location - Map or Text */}
              {msgRequest.place && (
                parseCoordinates(msgRequest.place) ? (
                  <LocationMap 
                    place={msgRequest.place} 
                    requesterName={msgRequest.requesterName}
                    helperLocation={myLocation}
                    height="150px"
                  />
                ) : (
                  <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 flex items-center gap-3">
                    <MapPin className="size-5 text-[#25f497] shrink-0" />
                    <div>
                      <p className="text-sm font-mono text-white">{msgRequest.place}</p>
                      <p className="text-xs font-mono text-zinc-500">Location provided by requester</p>
                    </div>
                  </div>
                )
              )}
              
              {/* Communication options */}
              <div className="flex flex-wrap gap-2">
                <a
                  href={`tel:+1234567890`} // TODO: Get actual phone from user profile
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-sm transition-colors"
                >
                  <Phone className="size-4 text-[#25f497]" />
                  Call
                </a>
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement video call
                    announce("Video call coming soon!")
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-sm transition-colors"
                >
                  <Video className="size-4 text-[#25f497]" />
                  Video Call
                </button>
              </div>
              
              {/* Message history */}
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-3 max-h-48 overflow-y-auto">
                {loadingMessages ? (
                  <p className="text-xs font-mono text-zinc-500 text-center py-4">Loading messages...</p>
                ) : chatMessages.length === 0 ? (
                  <p className="text-xs font-mono text-zinc-500 text-center py-4">No messages yet. Start the conversation!</p>
                ) : (
                  <div className="space-y-2">
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-2.5 rounded-xl text-xs font-mono max-w-[85%] ${
                          msg.senderName === "Helper" || msg.senderName === userName
                            ? "ml-auto bg-[#25f497]/15 border border-[#25f497]/30 text-zinc-100"
                            : "mr-auto bg-zinc-800 border border-zinc-700 text-zinc-200"
                        }`}
                      >
                        <strong className={msg.senderName === "Helper" || msg.senderName === userName ? "text-[#25f497]" : "text-zinc-400"}>
                          {msg.senderName}:
                        </strong>{" "}
                        {msg.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Quick message buttons */}
              <div className="flex flex-wrap gap-2">
                {[
                  "I can help!",
                  "On my way",
                  "5 min away",
                  "More details?",
                ].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => setMessageText(quick)}
                    className="px-3 py-1.5 text-xs font-mono rounded-full border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 transition-colors"
                  >
                    {quick}
                  </button>
                ))}
              </div>
              
              {/* Message input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-mono text-sm placeholder:text-zinc-600 focus:outline-none focus:border-[#25f497]/50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && messageText.trim()) {
                      e.preventDefault()
                      void sendMessageToRequester(msgRequest.id, msgRequest.requesterName)
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => void sendMessageToRequester(msgRequest.id, msgRequest.requesterName)}
                  disabled={!messageText.trim()}
                  className="px-4 py-3 rounded-xl bg-[#25f497] hover:bg-[#1ee088] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-mono font-semibold transition-colors"
                >
                  <Send className="size-5" />
                </button>
              </div>
              
              {/* Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => {
                    setMessageId(null)
                    setMessageText("")
                    setAcceptId(msgRequest.id)
                  }}
                  className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-all min-h-[48px]"
                >
                  Accept &amp; Help
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMessageId(null)
                    setMessageText("")
                  }}
                  className="inline-flex items-center px-6 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-sm transition-colors min-h-[48px]"
                >
                  Close
                </button>
              </div>
            </div>
          )
        })()}
      </Dialog>
    </div>
  )
}
