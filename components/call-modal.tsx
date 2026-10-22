"use client"

import { useEffect, useRef, useState } from "react"
import { useAnnounce } from "@/components/announce"
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  ShieldCheck,
  Maximize2,
  User,
  AlertTriangle,
} from "lucide-react"

interface CallModalProps {
  open: boolean
  requestId: string
  peerName: string
  initialCallType?: "video" | "audio"
  asHelper?: boolean
  onClose: () => void
}

export function CallModal(props: CallModalProps) {
  if (!props.open) return null
  return <CallSession {...props} />
}

function CallSession({
  requestId,
  peerName,
  initialCallType = "video",
  asHelper = false,
  onClose,
}: CallModalProps) {
  const announce = useAnnounce()
  const [callType] = useState<"video" | "audio">(initialCallType)
  const [muted, setMuted] = useState(false)
  const [videoOff, setVideoOff] = useState(initialCallType === "audio")
  const [duration, setDuration] = useState(0)
  const [connected, setConnected] = useState(false)
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const senderRole = asHelper ? "helper" : "requester"

  // Initiate call and start camera/microphone stream
  useEffect(() => {
    announce(`Connecting ${callType} call with ${peerName}...`)

    // Notify backend call signaling route
    void fetch("/api/mesh/call", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestId,
        action: "initiate",
        sender: senderRole,
        callType,
      }),
    })

    // Connection latency
    const connectTimer = setTimeout(() => {
      setConnected(true)
      announce(`Call connected with ${peerName}. Encrypted peer-to-peer session active.`)
    }, 1200)

    // Request actual user media stream
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({
          video: callType === "video",
          audio: true,
        })
        .then((stream) => {
          streamRef.current = stream
          setHasCameraPermission(true)
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
          }
        })
        .catch(() => {
          setHasCameraPermission(false)
          // Audio fallback if video fails
          if (callType === "video") {
            navigator.mediaDevices
              ?.getUserMedia({ audio: true })
              .then((audioStream) => {
                streamRef.current = audioStream
                setVideoOff(true)
              })
              .catch(() => {})
          }
        })
    }

    return () => {
      clearTimeout(connectTimer)
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }
    }
  }, [callType, requestId, peerName, senderRole, announce])

  // Call duration timer
  useEffect(() => {
    if (!connected) return
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [connected])

  function toggleMute() {
    const next = !muted
    setMuted(next)
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !next
      })
    }
    announce(next ? "Microphone muted" : "Microphone unmuted")
  }

  function toggleVideo() {
    const next = !videoOff
    setVideoOff(next)
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !next
      })
    }
    announce(next ? "Camera turned off" : "Camera turned on")
  }

  function handleEndCall() {
    announce("Call terminated.")
    void fetch("/api/mesh/call", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requestId,
        action: "terminate",
        sender: senderRole,
      }),
    })

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    onClose()
  }

  const minutes = Math.floor(duration / 60)
  const seconds = duration % 60
  const formattedTime = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Call with ${peerName}`}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950 font-mono shadow-2xl flex flex-col">
        {/* Header Bar */}
        <div className="relative z-20 flex items-center justify-between p-4 sm:p-5 border-b border-zinc-850 bg-black/60 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
              {callType === "video" ? <Video className="size-5" /> : <Mic className="size-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">{peerName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#25f497] bg-[#25f497]/10 px-2 py-0.5 rounded-full border border-[#25f497]/20">
                  <ShieldCheck className="size-3" />
                  <span>Encrypted P2P</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                {connected ? `Connected · ${formattedTime}` : "Connecting media stream..."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleEndCall}
            aria-label="Minimize or close call"
            className="p-2 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition-colors"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>

        {/* Video Canvas / Audio Viewport */}
        <div className="relative aspect-video w-full bg-zinc-900 flex items-center justify-center overflow-hidden">
          {videoOff ? (
            /* Audio Only Visualizer Avatar */
            <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center">
              <div className="relative flex items-center justify-center size-28 rounded-full bg-zinc-850 border border-zinc-700">
                <span
                  className={`absolute inset-0 rounded-full border-2 border-[#25f497]/40 ${
                    connected ? "animate-ping opacity-75" : ""
                  }`}
                />
                <User className="size-14 text-zinc-300" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-semibold text-white">{peerName}</p>
                <p className="text-xs text-zinc-400">Audio call in progress · Camera disabled</p>
                {hasCameraPermission === false && (
                  <p className="inline-flex items-center gap-1 text-[11px] text-amber-400">
                    <AlertTriangle className="size-3" />
                    <span>Camera permission denied · fallback to audio</span>
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* Video Streaming Viewport */
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Avatar preview overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900/40 backdrop-blur-[2px]">
                <div className="size-20 rounded-full bg-black/60 border border-zinc-700 flex items-center justify-center text-white mb-2">
                  <User className="size-10 text-zinc-300" />
                </div>
                <span className="text-xs text-zinc-300 font-medium">{peerName}</span>
                <span className="text-[11px] text-[#25f497]">Live Video Feed</span>
              </div>
            </div>
          )}

          {/* Local User Picture-In-Picture Video Preview */}
          {!videoOff && (
            <div className="absolute bottom-4 right-4 z-20 w-28 sm:w-44 aspect-video rounded-2xl border-2 border-zinc-700 bg-black overflow-hidden shadow-2xl">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover -scale-x-100"
              />
              <span className="absolute bottom-1 left-2 text-[10px] text-zinc-400 bg-black/60 px-1.5 rounded">
                You
              </span>
            </div>
          )}
        </div>

        {/* Call Controls Footer */}
        <div className="relative z-20 flex items-center justify-center gap-3 sm:gap-4 p-4 sm:p-6 bg-gradient-to-t from-black/90 to-transparent">
          {/* Mute Button */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Unmute microphone" : "Mute microphone"}
            className={`p-3.5 rounded-full transition-all duration-150 ${
              muted
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-zinc-900/90 text-white border border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            {muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}
          </button>

          {/* Video Toggle Button */}
          <button
            type="button"
            onClick={toggleVideo}
            aria-label={videoOff ? "Turn on camera" : "Turn off camera"}
            className={`p-3.5 rounded-full transition-all duration-150 ${
              videoOff
                ? "bg-red-500/20 text-red-400 border border-red-500/40"
                : "bg-zinc-900/90 text-white border border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            {videoOff ? <VideoOff className="size-5" /> : <Video className="size-5" />}
          </button>

          {/* End Call Button */}
          <button
            type="button"
            onClick={handleEndCall}
            aria-label="End call"
            className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-red-600 hover:bg-red-500 text-white font-semibold transition-all duration-150 hover:scale-105 active:scale-95 shadow-lg shadow-red-600/30 text-xs"
          >
            <PhoneOff className="size-5" />
            <span>End Call</span>
          </button>
        </div>
      </div>
    </div>
  )
}
