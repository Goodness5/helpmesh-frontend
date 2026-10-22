"use client"

import { Shield, Wifi } from "lucide-react"

export function Reach() {
  return (
    <div className="relative w-full max-w-md mx-auto aspect-square flex items-center justify-center p-6 rounded-3xl bg-zinc-950/90 border border-zinc-800/90 shadow-[0_0_50px_-15px_rgba(37,244,151,0.15)] overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(37,244,151,0.08)_0%,transparent_70%)] pointer-events-none" />

      {/* Outer Tactical Corner Marks */}
      <div className="absolute top-4 left-4 size-3 border-t-2 border-l-2 border-zinc-700 pointer-events-none" />
      <div className="absolute top-4 right-4 size-3 border-t-2 border-r-2 border-zinc-700 pointer-events-none" />
      <div className="absolute bottom-4 left-4 size-3 border-b-2 border-l-2 border-zinc-700 pointer-events-none" />
      <div className="absolute bottom-4 right-4 size-3 border-b-2 border-r-2 border-zinc-700 pointer-events-none" />

      {/* SVG Radar Visualizer with huge stroke telemetry */}
      <svg className="w-full h-full relative z-10" viewBox="0 0 360 360" aria-hidden="true">
        <defs>
          <radialGradient id="reachGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#25f497" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#25f497" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#25f497" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Concentric distance range rings */}
        <circle cx="180" cy="180" r="145" fill="none" stroke="currentColor" className="text-zinc-800" strokeWidth="1" strokeDasharray="4 6" />
        <circle cx="180" cy="180" r="105" fill="none" stroke="currentColor" className="text-zinc-800/80" strokeWidth="1" />
        <circle cx="180" cy="180" r="65" fill="none" stroke="currentColor" className="text-zinc-800/60" strokeWidth="1" strokeDasharray="2 4" />
        <circle cx="180" cy="180" r="25" fill="none" stroke="currentColor" className="text-zinc-800/40" strokeWidth="1" />

        {/* Crosshair grid */}
        <line x1="30" y1="180" x2="330" y2="180" stroke="currentColor" className="text-zinc-800/60" strokeWidth="1" strokeDasharray="3 4" />
        <line x1="180" y1="30" x2="180" y2="330" stroke="currentColor" className="text-zinc-800/60" strokeWidth="1" strokeDasharray="3 4" />

        {/* Animated radar scanning beam */}
        <g className="origin-[180px_180px] animate-[spin_8s_linear_infinite]">
          <line x1="180" y1="180" x2="325" y2="180" stroke="#25f497" strokeWidth="1.5" strokeOpacity="0.4" />
          <polygon points="180,180 325,180 310,135" fill="url(#reachGlow)" opacity="0.5" />
        </g>

        {/* Dynamic mesh connection vector */}
        <path
          className="reach-path"
          pathLength="1"
          d="M135 225 C 160 160 210 130 245 105"
          fill="none"
          stroke="url(#pathGradient)"
          strokeWidth="3"
          strokeLinecap="round"
        />

        {/* Requester beacon ('You') */}
        <circle cx="135" cy="225" r="32" fill="url(#reachGlow)" />
        <circle cx="135" cy="225" r="14" fill="#25f497" className="shadow-lg" />
        <circle cx="135" cy="225" r="6" fill="#000000" />

        {/* Matched peer beacon ('Helper') */}
        <circle cx="245" cy="105" r="24" fill="url(#reachGlow)" />
        <circle cx="245" cy="105" r="10" fill="#ffffff" stroke="#25f497" strokeWidth="3.5" />

        {/* Real-time Telemetry readouts */}
        <g transform="translate(195, 65)">
          <rect x="0" y="0" width="135" height="26" rx="13" fill="#141418" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <circle cx="14" cy="13" r="3.5" fill="#25f497" />
          <text x="26" y="17" fill="#a1a1aa" fontSize="10.5" fontFamily="var(--font-geist-mono), monospace" fontWeight="600">
            300m · 4m away
          </text>
        </g>
      </svg>

      {/* Floating HUD Badges with huge icons */}
      <div className="absolute bottom-5 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-zinc-400 bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-full border border-zinc-800/80">
        <div className="flex items-center gap-2">
          <Wifi className="size-4 text-[#25f497]" />
          <span>MESH PEER LOCK</span>
        </div>
        <div className="flex items-center gap-1.5 font-semibold text-white">
          <Shield className="size-3.5 text-[#25f497]" />
          <span>VERIFIED</span>
        </div>
      </div>
    </div>
  )
}
