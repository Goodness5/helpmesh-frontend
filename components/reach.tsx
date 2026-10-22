export function Reach() {
  return (
    <div className="reach-box">
      <svg className="reach" viewBox="0 0 360 360" aria-hidden="true">
        <defs>
          <radialGradient id="reachGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--signal)" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="pathGradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--signal)" stopOpacity="0.8" />
            <stop offset="100%" stopColor="var(--ink)" stopOpacity="1" />
          </linearGradient>
        </defs>

        {/* Panel background with sleek border */}
        <rect className="reach-panel" x="8" y="8" width="344" height="344" rx="28" />

        {/* Tactical radar rings */}
        <circle className="reach-range" cx="128" cy="214" r="130" strokeOpacity="0.1" strokeDasharray="4 6" />
        <circle className="reach-range" cx="128" cy="214" r="92" strokeOpacity="0.25" />
        <circle className="reach-range" cx="128" cy="214" r="50" strokeOpacity="0.35" strokeDasharray="2 4" />

        {/* Subtle grid crosshairs */}
        <line x1="40" y1="214" x2="216" y2="214" stroke="var(--line)" strokeDasharray="3 3" />
        <line x1="128" y1="126" x2="128" y2="302" stroke="var(--line)" strokeDasharray="3 3" />

        {/* Pulsing glow aura around requester */}
        <circle cx="128" cy="214" r="45" fill="url(#reachGlow)" />

        {/* Connection path between requester and peer */}
        <path
          className="reach-path"
          pathLength="1"
          d="M128 214 C 168 150 214 118 252 96"
          stroke="url(#pathGradient)"
        />

        {/* Peer beacon */}
        <circle cx="252" cy="96" r="18" fill="url(#reachGlow)" />
        <circle className="reach-them" cx="252" cy="96" r="8" />

        {/* Requester beacon */}
        <circle className="reach-you" cx="128" cy="214" r="12" />

        {/* Coordinate / Distance telemetry badge */}
        <g transform="translate(190, 68)">
          <rect
            x="0"
            y="0"
            width="120"
            height="22"
            rx="11"
            fill="var(--surface-raised)"
            stroke="var(--line-strong)"
            strokeWidth="1"
          />
          <circle cx="12" cy="11" r="3" fill="var(--signal)" />
          <text
            x="22"
            y="14"
            fill="var(--muted)"
            fontSize="9.5"
            fontFamily="ui-monospace, monospace"
            fontWeight="500"
          >
            300m · 4m away
          </text>
        </g>
      </svg>
    </div>
  )
}
