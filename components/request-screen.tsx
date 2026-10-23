"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import {
  cancel,
  chat,
  choose,
  completeHelp,
  confirm,
  dispute,
  hold,
  saveTrusted,
  startHelp,
  tip,
  useDemo,
} from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { liveChain } from "@/lib/chain/plain"
import {
  distanceText,
  escrowSentence,
  formatTestMoney,
  headline,
  HELPERS,
  modeLabel,
  parseAmount,
  personName,
  rankHelpers,
} from "@/lib/model"
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldCheck,
  MapPin,
  MessageSquare,
  Volume2,
  PhoneCall,
  Phone,
  Video,
  ArrowUpRight,
  User,
  Heart,
  BadgeCheck,
  Check,
  Send,
  Lock,
} from "lucide-react"
import { CallModal } from "@/components/call-modal"
import { LiveLocation } from "@/components/live-location"

const replies = ["I'm here", "I'm at the entrance", "Please wait 2 minutes", "I can't hear you, I'll text"]
const reasons = ["I don't need help now", "I can't make it", "Something else"]

export function RequestScreen({ id }: { id: string }) {
  const announce = useAnnounce()
  const demo = useDemo()
  const request = demo.requests.find((item) => item.id === id)
  const [holdOpen, setHoldOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [callType, setCallType] = useState<"video" | "audio">("video")
  const [cardOpen, setCardOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [problemOpen, setProblemOpen] = useState(false)
  const [tipAmount, setTipAmount] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState("")
  const [reason, setReason] = useState(reasons[0])
  const [checkedIn, setCheckedIn] = useState(false)

  const asHelper = request?.owner !== "me"
  const title = request ? headline(request, asHelper) : ""
  const statusKey = `${request?.id ?? ""}:${request?.status ?? ""}:${request?.escrow?.state ?? ""}:${request?.helperId ?? ""}`
  const told = useRef("")

  useEffect(() => {
    if (!demo.ready) return
    const heading = document.querySelector("main h1")
    if (heading instanceof HTMLElement) heading.focus()
  }, [demo.ready, id])

  useEffect(() => {
    if (!demo.ready || !request) return
    const line = headline(request, request.owner !== "me")
    if (told.current === line) return
    const previous = told.current
    told.current = line
    if (previous) announce(line)
  }, [announce, demo.ready, request, statusKey])

  if (!demo.ready) {
    return (
      <div className="w-full space-y-4 py-8">
        <PageTitle>Loading this request</PageTitle>
        <p className="text-sm font-mono text-zinc-500 animate-pulse">Syncing on-chain session...</p>
      </div>
    )
  }

  if (!request) {
    return (
      <div className="w-full space-y-6 py-8">
        <PageTitle>We can&apos;t find that request</PageTitle>
        <p className="text-sm font-mono text-zinc-400">
          This session does not exist or may have expired from the active mesh.
        </p>
        <Link
          href="/helper"
          className="inline-flex items-center gap-2 bg-[#25f497] text-black font-mono font-semibold px-6 py-3 rounded-full hover:bg-[#1ee088] transition-colors"
        >
          <span>See open requests</span>
          <ArrowUpRight className="size-4" />
        </Link>
      </div>
    )
  }

  const helperName = personName(request.helperId, asHelper)
  const shownHelper = helperName.charAt(0).toUpperCase() + helperName.slice(1)
  const funds = request.escrow
    ? escrowSentence({
        state: request.escrow.state,
        amount: request.amount,
        helperName: shownHelper,
        source: request.escrow.source,
        helperAmount: request.escrow.helperAmount,
        refundAmount: request.escrow.refundAmount,
      })
    : ""
  const ranked = rankHelpers(HELPERS, request)
  const active = request.status === "assigned" || request.status === "started" || request.status === "awaiting_confirm"

  function run(result: string | Promise<string>, urgent = false) {
    if (liveChain && typeof result !== "string") announce("Sending this now.")
    void Promise.resolve(result).then((message) => announce(message, urgent ? "assertive" : "polite"))
  }

  function say(text: string) {
    if (!("speechSynthesis" in window)) {
      run("Speaking is not available. The words stay on screen.")
      return
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
    run(`Saying: ${text}`)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8 sm:space-y-10 py-6">
      {/* Header Eyebrow & Status Pill */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
            <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
            <span>Active Session · {request.id.slice(0, 10)}</span>
          </div>

          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#25f497]/10 text-[#25f497] border border-[#25f497]/30">
            {modeLabel(request.mode, request.amount)}
          </span>
        </div>

        <PageTitle>{title}</PageTitle>
      </div>

      {/* Main Request Summary Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-10 backdrop-blur-md shadow-2xl space-y-6">
        <p className="text-lg sm:text-xl font-mono text-zinc-200 leading-relaxed">
          {request.description}
        </p>

        {/* Telemetry Tags */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <MapPin className="size-3.5 text-[#25f497]" />
            {request.place || "Public location nearby"}
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <Clock className="size-3.5 text-[#25f497]" />
            ~{request.minutes} mins
          </span>

          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
            <MessageSquare className="size-3.5 text-[#25f497]" />
            {request.communicate}
          </span>

          {request.shareNeeds && request.needsSummary && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-300">
              <BadgeCheck className="size-3.5 text-[#25f497]" />
              {request.needsSummary}
            </span>
          )}
        </div>

        {/* Escrow Banner */}
        {funds && (
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-[#25f497]/30 bg-[#25f497]/5 text-xs sm:text-sm font-mono text-zinc-300">
            <ShieldCheck className="size-5 text-[#25f497] shrink-0" />
            <div>
              <strong className="text-white">Escrow: </strong>
              <span>{funds}</span>
            </div>
          </div>
        )}

        {!request.escrow && request.mode === "volunteer" && (
          <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-900/50 text-xs font-mono text-zinc-400">
            Volunteer request. Peer-to-peer assistance with zero smart contract locking.
          </div>
        )}
      </div>

      {/* Lock Escrow Prompt if needed */}
      {!asHelper && request.mode === "reward" && !request.escrow && request.status === "open" && (
        <div className="rounded-3xl border border-[#25f497]/40 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md shadow-2xl space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <Lock className="size-6 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                Lock Escrow to Begin Matching
              </h2>
              <p className="text-xs font-mono text-zinc-500">Autonomous non-custodial lock</p>
            </div>
          </div>

          <p className="text-sm font-mono text-zinc-400 leading-relaxed max-w-2xl">
            Commit {formatTestMoney(request.amount)} in the Base escrow contract. Released to your helper only after you confirm completion.
          </p>

          <button
            type="button"
            onClick={() => setHoldOpen(true)}
            className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
          >
            <span>Lock {formatTestMoney(request.amount)} into Escrow</span>
            <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
              <ArrowUpRight className="size-3 stroke-[2.5]" />
            </span>
          </button>
        </div>
      )}

      {/* Available Helpers List if open */}
      {!asHelper && request.status === "open" && (request.mode !== "reward" || request.escrow) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
            <h2 className="text-xl font-mono font-medium text-white tracking-tight">
              Available Helpers Nearby
            </h2>
            <span className="text-xs font-mono text-zinc-500">
              {ranked.length} {ranked.length === 1 ? "helper found" : "helpers found"}
            </span>
          </div>

          <p className="text-xs font-mono text-zinc-500">
            Your request is visible on the Offer Help feed. Real helpers nearby can accept it from their devices.
          </p>

          {ranked.length === 0 ? (
            <div className="rounded-3xl border border-zinc-800/80 border-dashed bg-zinc-950/50 p-8 sm:p-10 text-center space-y-4">
              <div className="size-16 mx-auto rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500">
                <User className="size-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-mono font-medium text-zinc-300">
                  Waiting for helpers
                </h3>
                <p className="text-sm font-mono text-zinc-500 max-w-md mx-auto">
                  Your request is live on the mesh. When a helper nearby sees it and accepts, they&apos;ll appear here.
                </p>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#25f497]/10 text-[#25f497] text-xs font-mono">
                <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
                Broadcasting to helpers
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {ranked.map(({ helper }) => (
                <div
                  key={helper.id}
                  className="rounded-3xl border border-zinc-800/80 bg-zinc-950/70 p-6 sm:p-7 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-5 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497] shrink-0">
                      <User className="size-7" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-mono font-medium text-white tracking-tight">
                        {helper.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-400">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                          {distanceText(helper)}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800 text-[#25f497]">
                          {helper.verified ? "✓ Verified" : "Unverified"}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                          {helper.completions} completed
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <Link
                      href={`/profile/${helper.id}`}
                      className="inline-flex items-center px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-colors"
                    >
                      <span>Profile</span>
                      <ArrowUpRight className="size-3 ml-1" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => run(choose(request.id, helper.id))}
                      className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-5 py-2.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <span>Choose {helper.name}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accept request as helper if open */}
      {asHelper && request.status === "open" && (
        <div className="pt-2">
          <button
            type="button"
            onClick={() => run(choose(request.id, "me"))}
            className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
          >
            <span>Accept this request</span>
            <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
              <ArrowUpRight className="size-3 stroke-[2.5]" />
            </span>
          </button>
        </div>
      )}

      {/* Primary Lifecycle Actions */}
      <div className="space-y-4">
        {asHelper && request.status === "assigned" && (
          <button
            type="button"
            onClick={() => run(startHelp(request.id))}
            className="inline-flex items-center gap-2.5 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-150 hover:scale-[1.02]"
          >
            <Activity className="size-4" />
            <span>Start helping now</span>
          </button>
        )}

        {asHelper && request.status === "started" && (
          <button
            type="button"
            onClick={() => run(completeHelp(request.id))}
            className="inline-flex items-center gap-2.5 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-150 hover:scale-[1.02]"
          >
            <Check className="size-4" />
            <span>Mark help completed</span>
          </button>
        )}

        {!asHelper && request.helperId && request.helperId !== "me" && request.status === "assigned" && (
          <button
            type="button"
            onClick={() => run(startHelp(request.id))}
            className="inline-flex items-center gap-2.5 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-150 hover:scale-[1.02]"
          >
            <Activity className="size-4" />
            <span>Confirm session started</span>
          </button>
        )}

        {!asHelper && request.status === "started" && request.helperId !== "me" && (
          <button
            type="button"
            onClick={() => run(completeHelp(request.id))}
            className="inline-flex items-center gap-2.5 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-150 hover:scale-[1.02]"
          >
            <Check className="size-4" />
            <span>Mark help completed</span>
          </button>
        )}

        {asHelper && request.status === "awaiting_confirm" && (
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 space-y-4">
            <p className="text-sm font-mono text-zinc-300">
              Waiting for {request.requesterName} to confirm. Escrow tokens stay held until verified completion.
            </p>
            <button
              type="button"
              onClick={() => run(confirm(request.id))}
              className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full text-xs"
            >
              <span>They confirmed in person</span>
            </button>
          </div>
        )}

        {!asHelper && request.status === "awaiting_confirm" && (
          <div className="rounded-3xl border border-[#25f497]/40 bg-zinc-950/90 p-7 sm:p-9 space-y-5 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-2xl bg-[#25f497]/15 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
                <CheckCircle2 className="size-7" />
              </div>
              <div>
                <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                  Did you receive the assistance needed?
                </h2>
                <p className="text-xs font-mono text-zinc-500">
                  Confirming will trigger autonomous escrow release of {formatTestMoney(request.amount)} to {shownHelper}.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full text-sm transition-all duration-150 hover:scale-[1.02]"
              >
                <span>Yes, release escrow</span>
              </button>
              <button
                type="button"
                onClick={() => setProblemOpen(true)}
                className="inline-flex items-center gap-2 border border-red-500/40 bg-red-950/30 hover:bg-red-950/60 text-red-300 font-mono text-sm px-6 py-3.5 rounded-full transition-colors"
              >
                <span>Report a problem</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Gratuity Section on Done */}
      {request.status === "done" && !asHelper && request.helperId && (
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
            <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
              <Heart className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                Send a Gratuity (Optional)
              </h2>
              <p className="text-xs font-mono text-zinc-500">
                Tips transfer directly to the helper&apos;s wallet balance.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {[2, 5, 10].map((dollars) => (
              <button
                key={dollars}
                type="button"
                onClick={() => setTipAmount(dollars * 1_000_000)}
                className="px-5 py-2.5 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-mono text-xs transition-colors"
              >
                ${dollars} tip
              </button>
            ))}
            <button
              type="button"
              onClick={() => run("No tip. That is fine.")}
              className="px-4 py-2 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              Skip
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 max-w-sm">
            <input
              id="custom-tip"
              inputMode="decimal"
              value={customTip}
              onChange={(event) => setCustomTip(event.target.value)}
              placeholder="Custom $"
              aria-label="Custom tip amount"
              className="w-36 bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497]"
            />
            <button
              type="button"
              onClick={() => {
                const amount = parseAmount(customTip)
                if (!amount) {
                  run("Enter an amount like 4 or 4.50.")
                  return
                }
                setTipAmount(amount)
              }}
              className="px-5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-mono text-xs transition-colors"
            >
              Send custom tip
            </button>
          </div>
        </div>
      )}

      {/* Dispute Notice if disputed */}
      {request.status === "disputed" && (
        <div className="rounded-3xl border border-red-500/40 bg-red-950/30 p-6 sm:p-7 flex items-start gap-4">
          <AlertTriangle className="size-6 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1 font-mono text-sm text-red-200">
            <strong className="block text-red-300">Dispute Under Review:</strong>
            <p>
              An independent community reviewer has been assigned. The escrow amount remains locked until resolved.
            </p>
          </div>
        </div>
      )}

      {/* Active Session Coordination Tools */}
      {active && (
        <div className="space-y-6">
          {/* Direct Peer Call Mode Card */}
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
                  <Video className="size-6 stroke-[1.8]" />
                </div>
                <div>
                  <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                    In-App Direct Call Mode
                  </h2>
                  <p className="text-xs font-mono text-zinc-500">
                    Encrypted WebRTC P2P stream · No recordings · 100% private
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCallType("video")
                    setCallOpen(true)
                  }}
                  className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-5 py-2.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] shadow-[0_0_20px_rgba(37,244,151,0.2)]"
                >
                  <Video className="size-4" />
                  <span>Start Video Call</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCallType("audio")
                    setCallOpen(true)
                  }}
                  className="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono font-medium px-5 py-2.5 rounded-full text-xs transition-colors"
                >
                  <Phone className="size-4 text-[#25f497]" />
                  <span>Voice Only</span>
                </button>
              </div>
            </div>

            <p className="text-xs font-mono text-zinc-400 leading-relaxed">
              Connect camera and microphone in real time with {shownHelper}. High-fidelity WebRTC signaling handled locally in-app without centralized recording servers.
            </p>
          </div>

          {/* Live GPS Telemetry and Proximity Stream */}
          <LiveLocation requestId={request.id} peerName={shownHelper} asHelper={asHelper} />

          {/* Messaging Card */}
          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-sm space-y-6">
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-5">
              <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
                <MessageSquare className="size-5" />
              </div>
              <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                Live Peer Messaging
              </h2>
            </div>

            {request.messages.length === 0 ? (
              <p className="text-xs font-mono text-zinc-500">
                No messages yet. Send a quick update below.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-64 overflow-y-auto">
                {request.messages.map((message, index) => (
                  <div
                    key={`${message.body}-${index}`}
                    className={`p-3.5 rounded-2xl font-mono text-xs sm:text-sm max-w-[85%] ${
                      message.from === "You"
                        ? "ml-auto bg-[#25f497]/15 border border-[#25f497]/30 text-zinc-100"
                        : "mr-auto bg-zinc-900 border border-zinc-800 text-zinc-200"
                    }`}
                  >
                    <strong className={message.from === "You" ? "text-[#25f497]" : "text-zinc-400"}>
                      {message.from}:{" "}
                    </strong>
                    <span>{message.body}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 pt-2">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Quick Responses
              </span>
              <div className="flex flex-wrap gap-2">
                {replies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => {
                      chat(request.id, asHelper ? "Helper" : "You", reply)
                      run(`Sent: ${reply}`)
                    }}
                    className="px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-colors"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-zinc-900">
              <button
                type="button"
                onClick={() => say(replies[0] ?? "I'm here")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-colors"
              >
                <Volume2 className="size-3.5 text-[#25f497]" />
                <span>Speak &ldquo;I&apos;m here&rdquo;</span>
              </button>

              <button
                type="button"
                onClick={() => setCardOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-colors"
              >
                <BadgeCheck className="size-3.5 text-[#25f497]" />
                <span>{asHelper ? "Show identification card" : "Show card to helper"}</span>
              </button>
            </div>
          </div>

          {/* Session Safety Check-in if started */}
          {request.status === "started" && (
            <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 space-y-4">
              <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                Session Safety Check-In
              </h2>
              <p className="text-xs font-mono text-zinc-400">
                Estimated duration ~{request.minutes} minutes. Tap to confirm your safety status.
              </p>
              <button
                type="button"
                onClick={() => {
                  setCheckedIn(true)
                  run("Checked in. Status is OK.")
                }}
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-mono text-xs transition-all ${
                  checkedIn
                    ? "bg-[#25f497] text-black font-semibold"
                    : "border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                {checkedIn ? <Check className="size-4" /> : null}
                <span>{checkedIn ? "Checked in: Status OK" : "I'm OK"}</span>
              </button>
            </div>
          )}

          {/* Emergency & SOS Card */}
          <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-7 sm:p-9 space-y-5">
            <div className="flex items-center gap-3">
              <AlertTriangle className="size-5 text-red-400" />
              <h2 className="text-xl font-mono font-medium text-red-300 tracking-tight">
                Emergency &amp; Safety SOS
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <a
                href="tel:911"
                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black font-mono font-bold px-6 py-3 rounded-full text-xs transition-colors"
              >
                <PhoneCall className="size-3.5" />
                <span>Call 911</span>
              </a>

              <a
                href={`sms:?&body=${encodeURIComponent(
                  `${demo.trustedName ? `${demo.trustedName}, ` : ""}I need help now. ${request.description}`
                )}`}
                className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 font-mono text-xs px-5 py-3 rounded-full transition-colors"
              >
                <Send className="size-3.5" />
                <span>Text trusted contact</span>
              </a>

              <Link
                href="/help"
                className="text-xs font-mono text-zinc-400 hover:text-white underline ml-2"
              >
                Safety Guidelines
              </Link>
            </div>

            <TrustedName />
          </div>
        </div>
      )}

      {/* Cancellation & Dispute Buttons */}
      <div className="flex flex-wrap items-center gap-3 pt-2">
        {(request.status === "open" || request.status === "assigned") && (
          <button
            type="button"
            onClick={() => setCancelOpen(true)}
            className="text-xs font-mono text-zinc-500 hover:text-red-400 underline transition-colors"
          >
            Cancel this request
          </button>
        )}
        {request.status === "started" && (
          <button
            type="button"
            onClick={() => setProblemOpen(true)}
            className="text-xs font-mono text-red-400 hover:text-red-300 underline transition-colors"
          >
            Report a problem
          </button>
        )}
      </div>

      {/* Audit Trail & Event Log */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-7 sm:p-9 space-y-4">
        <h2 className="text-lg font-mono font-medium text-white tracking-tight border-b border-zinc-900 pb-3">
          Audit Trail &amp; Events
        </h2>
        <ol className="space-y-2.5 font-mono text-xs text-zinc-400">
          {request.events.map((event, idx) => (
            <li key={`${event}-${idx}`} className="flex items-center gap-2.5">
              <span className="size-1.5 rounded-full bg-[#25f497]" />
              <span>{event}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Dialogs */}
      <Dialog
        open={holdOpen}
        title={`Lock ${formatTestMoney(request.amount)} in Escrow`}
        description={`This commits ${formatTestMoney(request.amount)} USDC to the autonomous escrow contract. It will be released to the helper upon mutual confirmation. Escape cancels.`}
        onClose={() => setHoldOpen(false)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              setHoldOpen(false)
              run(hold(request.id))
            }}
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full text-xs"
          >
            Confirm Escrow Lock
          </button>
          <button
            type="button"
            onClick={() => setHoldOpen(false)}
            className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-mono text-xs"
          >
            Go back
          </button>
        </div>
      </Dialog>

      <Dialog
        open={confirmOpen}
        title="Confirm assistance completed"
        description={
          request.escrow
            ? `${formatTestMoney(request.amount)} will be released from escrow to ${shownHelper}.`
            : "No tokens move. This records successful verified completion."
        }
        onClose={() => setConfirmOpen(false)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              setConfirmOpen(false)
              run(confirm(request.id))
            }}
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full text-xs"
          >
            {request.escrow ? "Yes, Release & Settle" : "Yes, Complete Session"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmOpen(false)}
            className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-mono text-xs"
          >
            Go back
          </button>
        </div>
      </Dialog>

      <Dialog
        open={problemOpen}
        title="Initiate dispute resolution"
        description="Tokens stay locked in escrow while an independent reviewer investigates the situation."
        onClose={() => setProblemOpen(false)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              setProblemOpen(false)
              run(dispute(request.id), true)
            }}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black font-mono font-bold px-6 py-3 rounded-full text-xs"
          >
            File dispute report
          </button>
          <button
            type="button"
            onClick={() => setProblemOpen(false)}
            className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-mono text-xs"
          >
            Go back
          </button>
        </div>
      </Dialog>

      <Dialog
        open={cancelOpen}
        title="Cancel request"
        description={
          request.escrow?.source === "pool"
            ? "The sponsored grant returns immediately to the Accessibility Fund pool."
            : request.escrow
            ? "The locked escrow tokens return immediately to your balance."
            : "No tokens are locked."
        }
        onClose={() => setCancelOpen(false)}
      >
        <div className="space-y-4 pt-2">
          <span className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
            Cancellation Reason
          </span>
          <div className="flex flex-wrap gap-2">
            {reasons.map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={reason === item}
                onClick={() => setReason(item)}
                className={`px-4 py-1.5 rounded-full font-mono text-xs transition-colors ${
                  reason === item
                    ? "bg-[#25f497] text-black font-semibold"
                    : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
            <button
              type="button"
              onClick={() => {
                setCancelOpen(false)
                run(cancel(request.id, reason))
              }}
              className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-400 text-black font-mono font-bold px-6 py-3 rounded-full text-xs"
            >
              Cancel request
            </button>
            <button
              type="button"
              onClick={() => setCancelOpen(false)}
              className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-mono text-xs"
            >
              Keep request
            </button>
          </div>
        </div>
      </Dialog>

      <Dialog
        open={cardOpen}
        title={asHelper ? "Identification Card" : "Assistance Card"}
        description="High-contrast display card to present to your peer in person."
        onClose={() => setCardOpen(false)}
      >
        <div className="p-6 rounded-2xl border border-[#25f497]/40 bg-black text-center space-y-4 my-4">
          <p className="text-xl font-mono text-white font-medium">{request.description}</p>
          <p className="text-lg font-mono text-[#25f497]">
            Communicate by: {request.communicate}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCardOpen(false)}
          className="w-full bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold py-3 rounded-full text-xs"
        >
          Close Card
        </button>
      </Dialog>

      <Dialog
        open={tipAmount !== null}
        title={tipAmount ? `Send ${formatTestMoney(tipAmount)} Gratuity to ${shownHelper}` : "Send a tip"}
        description="This gratuity transfers directly to the helper. It is independent of reputation scoring."
        onClose={() => setTipAmount(null)}
      >
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-900">
          <button
            type="button"
            onClick={() => {
              if (!tipAmount || !request.helperId) return
              const amount = tipAmount
              setTipAmount(null)
              run(tip(request.helperId, amount, request.id))
            }}
            className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full text-xs"
          >
            Confirm Gratuity
          </button>
          <button
            type="button"
            onClick={() => setTipAmount(null)}
            className="px-5 py-3 rounded-full border border-zinc-800 bg-zinc-900/60 text-zinc-300 font-mono text-xs"
          >
            Go back
          </button>
        </div>
      </Dialog>

      <CallModal
        open={callOpen}
        requestId={request.id}
        peerName={shownHelper}
        initialCallType={callType}
        asHelper={asHelper}
        onClose={() => setCallOpen(false)}
      />
    </div>
  )
}

function TrustedName() {
  const demo = useDemo()
  const announce = useAnnounce()

  return (
    <form
      className="space-y-2 pt-2 border-t border-red-500/20"
      onSubmit={(event) => {
        event.preventDefault()
        const name = demo.trustedName.trim()
        saveTrusted(name)
        announce(name ? `Saved ${name}.` : "Cleared the trusted person.")
      }}
    >
      <label htmlFor="trusted" className="block text-xs font-mono text-zinc-300">
        Trusted contact name (for quick emergency SMS)
      </label>
      <div className="flex flex-col sm:flex-row gap-2.5">
        <input
          id="trusted"
          autoComplete="name"
          value={demo.trustedName}
          onChange={(event) => saveTrusted(event.target.value)}
          placeholder="e.g. Maria or Alex"
          className="flex-1 bg-zinc-900/90 border border-zinc-800 rounded-xl px-4 py-2 font-mono text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497]"
        />
        <button
          type="submit"
          className="px-5 py-2 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-mono text-xs transition-colors shrink-0"
        >
          Save name
        </button>
      </div>
    </form>
  )
}
