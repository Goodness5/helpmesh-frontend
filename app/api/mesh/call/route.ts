import { NextResponse } from "next/server"

interface CallState {
  requestId: string
  status: "idle" | "calling" | "connected" | "ended"
  callType: "audio" | "video"
  initiator: "requester" | "helper"
  startedAt?: number
  offer?: RTCSessionDescriptionInit | null
  answer?: RTCSessionDescriptionInit | null
  candidates: { sender: string; candidate: RTCIceCandidateInit }[]
  requesterMuted?: boolean
  helperMuted?: boolean
  requesterVideoOff?: boolean
  helperVideoOff?: boolean
}

const callSessions = new Map<string, CallState>()

// Clean up calls older than 2 hours
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 60 * 1000
  for (const [id, state] of callSessions.entries()) {
    if ((state.startedAt ?? 0) < cutoff) {
      callSessions.delete(id)
    }
  }
}, 20 * 60 * 1000)

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get("requestId")

  if (!requestId) {
    return NextResponse.json({ ok: false, message: "Missing requestId parameter" }, { status: 400 })
  }

  const session = callSessions.get(requestId) || {
    requestId,
    status: "idle",
    callType: "video",
    initiator: "requester",
    candidates: [],
  }

  if (session.status === "ended" && session.startedAt && Date.now() - session.startedAt > 15000) {
    session.status = "idle"
  }

  return NextResponse.json({
    ok: true,
    call: session,
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requestId, action, sender, callType, offer, answer, candidate, muted, videoOff } = body

    if (!requestId || !action) {
      return NextResponse.json(
        { ok: false, message: "Missing required parameters (requestId, action)" },
        { status: 400 }
      )
    }

    let session = callSessions.get(requestId)
    if (!session) {
      session = {
        requestId,
        status: "idle",
        callType: callType || "video",
        initiator: sender || "requester",
        candidates: [],
      }
      callSessions.set(requestId, session)
    }

    switch (action) {
      case "initiate":
        session.status = "calling"
        session.callType = callType || "video"
        session.initiator = sender || "requester"
        session.startedAt = Date.now()
        session.candidates = []
        if (offer) session.offer = offer
        break

      case "answer":
        session.status = "connected"
        if (answer) session.answer = answer
        break

      case "candidate":
        if (candidate) {
          session.candidates.push({ sender: sender || "unknown", candidate })
        }
        break

      case "toggle-audio":
        if (sender === "requester") session.requesterMuted = muted
        if (sender === "helper") session.helperMuted = muted
        break

      case "toggle-video":
        if (sender === "requester") session.requesterVideoOff = videoOff
        if (sender === "helper") session.helperVideoOff = videoOff
        break

      case "terminate":
      case "end":
      case "decline":
        session.status = "ended"
        session.offer = null
        session.answer = null
        session.candidates = []
        break

      case "reset":
        session.status = "idle"
        session.offer = null
        session.answer = null
        session.candidates = []
        break

      default:
        break
    }

    return NextResponse.json({
      ok: true,
      action,
      call: session,
    })
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON payload" }, { status: 400 })
  }
}
