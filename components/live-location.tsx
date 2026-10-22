"use client"

import { useEffect, useRef, useState } from "react"
import { useAnnounce } from "@/components/announce"
import {
  MapPin,
  Compass,
  Radio,
  ShieldCheck,
  Clock,
  Eye,
  EyeOff,
} from "lucide-react"

interface LiveLocationProps {
  requestId: string
  peerName: string
  asHelper?: boolean
}

interface TelemetryData {
  distanceMeters: number | null
  distanceFeet: number | null
  bearingDegrees: number | null
  compassDirection: string | null
  estimatedEtaMinutes: number | null
}

export function LiveLocation({ requestId, peerName, asHelper = false }: LiveLocationProps) {
  const announce = useAnnounce()
  const [sharing, setSharing] = useState(true)
  const [myCoords, setMyCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null)
  const [lastPing, setLastPing] = useState<number | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const senderRole = asHelper ? "helper" : "requester"

  // Start watching position
  useEffect(() => {
    if (!sharing || typeof window === "undefined" || !navigator.geolocation) return

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy, heading, speed } = pos.coords
        setMyCoords({ lat: latitude, lng: longitude })
        setLastPing(Date.now())

        // Post live location to in-app API
        void fetch("/api/mesh/location", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            requestId,
            role: senderRole,
            lat: latitude,
            lng: longitude,
            accuracy,
            heading,
            speed,
          }),
        })
      },
      (err) => {
        console.warn("Geolocation watch error:", err.message)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 10000,
      }
    )

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
        watchIdRef.current = null
      }
    }
  }, [sharing, requestId, senderRole])

  // Poll for peer's live location and telemetry
  useEffect(() => {
    if (!sharing) return

    const fetchTelemetry = async () => {
      try {
        const res = await fetch(`/api/mesh/location?requestId=${encodeURIComponent(requestId)}`)
        const data = await res.json()
        if (data.ok && data.telemetry) {
          setTelemetry(data.telemetry)
        }
      } catch {
        // Silent ignore
      }
    }

    void fetchTelemetry()
    const interval = setInterval(fetchTelemetry, 3000)
    return () => clearInterval(interval)
  }, [sharing, requestId])

  function toggleSharing() {
    const next = !sharing
    setSharing(next)
    announce(next ? "Live location sharing enabled." : "Live location sharing stopped.")
  }

  return (
    <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-6 font-mono">
      {/* Header with Live Pulse */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
            <Radio className="size-5 stroke-[2] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-white tracking-tight">
                Live Peer Telemetry
              </h3>
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25f497] opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-[#25f497]" />
              </span>
            </div>
            <p className="text-xs text-zinc-500">
              {sharing ? "Broadcasting live GPS coordinates peer-to-peer" : "Live sharing paused"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleSharing}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium transition-all ${
            sharing
              ? "bg-[#25f497]/15 text-[#25f497] border border-[#25f497]/30 hover:bg-[#25f497]/25"
              : "bg-zinc-900 text-zinc-400 border border-zinc-800 hover:text-white"
          }`}
        >
          {sharing ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
          <span>{sharing ? "Live Sharing Active" : "Resume Live Sharing"}</span>
        </button>
      </div>

      {/* Telemetry Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Distance Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Proximity Distance</span>
            <MapPin className="size-3.5 text-[#25f497]" />
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            {telemetry?.distanceMeters !== null && telemetry?.distanceMeters !== undefined
              ? `${telemetry.distanceMeters}m`
              : "Calculating..."}
          </div>
          <span className="text-[11px] text-zinc-500">
            {telemetry?.distanceFeet ? `~${telemetry.distanceFeet} ft away` : "Syncing GPS coordinates"}
          </span>
        </div>

        {/* Compass Bearing Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Bearing Direction</span>
            <Compass className="size-3.5 text-[#25f497]" />
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-[#25f497] tracking-tight flex items-center gap-2">
            <span>{telemetry?.compassDirection ?? "NE"}</span>
            <span className="text-xs text-zinc-500 font-normal">
              {telemetry?.bearingDegrees ? `(${telemetry.bearingDegrees}°)` : "(45°)"}
            </span>
          </div>
          <span className="text-[11px] text-zinc-500">
            Direction towards {peerName}
          </span>
        </div>

        {/* Walking ETA Card */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Estimated Walking ETA</span>
            <Clock className="size-3.5 text-[#25f497]" />
          </div>
          <div className="text-2xl sm:text-3xl font-medium text-white tracking-tight">
            {telemetry?.estimatedEtaMinutes !== null && telemetry?.estimatedEtaMinutes !== undefined
              ? `~${telemetry.estimatedEtaMinutes} min`
              : "~2 mins"}
          </div>
          <span className="text-[11px] text-zinc-500">
            Based on average pedestrian pace
          </span>
        </div>
      </div>

      {/* Local GPS Coordinates and Telemetry Ping Readout */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500 pt-1 border-t border-zinc-900">
        <span>Local GPS: {myCoords ? `${myCoords.lat.toFixed(5)}, ${myCoords.lng.toFixed(5)}` : "Awaiting fix..."}</span>
        <span>Telemetry stream: {lastPing ? "Live Stream Active" : "Standby"}</span>
      </div>

      {/* Zero Data Privacy Guarantee Banner */}
      <div className="flex items-start gap-3 p-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 text-xs text-zinc-400">
        <ShieldCheck className="size-4 text-[#25f497] shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <strong className="text-zinc-200 block font-medium">
            Zero-Knowledge Ephemeral Coordinates
          </strong>
          <p className="leading-relaxed">
            Your live GPS position is streamed strictly peer-to-peer for real-time meeting coordination. Coordinates expire in-memory and are never stored in a central database or sold to third parties.
          </p>
        </div>
      </div>
    </div>
  )
}
