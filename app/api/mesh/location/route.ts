import { NextResponse } from "next/server"

interface PeerLocation {
  lat: number
  lng: number
  accuracy?: number
  heading?: number | null
  speed?: number | null
  updatedAt: number
}

interface SessionLocationState {
  requester?: PeerLocation
  helper?: PeerLocation
}

// In-memory ephemeral storage for active live session locations
const sessionLocations = new Map<string, SessionLocationState>()

// Clean up stale sessions older than 3 hours to preserve zero-collection privacy
setInterval(() => {
  const cutoff = Date.now() - 3 * 60 * 60 * 1000
  for (const [id, state] of sessionLocations.entries()) {
    const reqTime = state.requester?.updatedAt ?? 0
    const helperTime = state.helper?.updatedAt ?? 0
    if (Math.max(reqTime, helperTime) < cutoff) {
      sessionLocations.delete(id)
    }
  }
}, 30 * 60 * 1000)

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3 // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return Math.round(R * c)
}

function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): { degrees: number; compass: string } {
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)
  const theta = Math.atan2(y, x)
  const degrees = Math.round(((theta * 180) / Math.PI + 360) % 360)

  const compassDirections = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  const index = Math.round(degrees / 45) % 8
  return { degrees, compass: compassDirections[index] }
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get("requestId")

  if (!requestId) {
    return NextResponse.json({ ok: false, message: "Missing requestId parameter" }, { status: 400 })
  }

  const session = sessionLocations.get(requestId)
  if (!session) {
    return NextResponse.json({
      ok: true,
      hasLiveTracking: false,
      message: "No live tracking data active for this session yet.",
    })
  }

  const { requester, helper } = session
  let distanceMeters: number | null = null
  let bearing: { degrees: number; compass: string } | null = null
  let estimatedEtaMinutes: number | null = null

  if (requester && helper) {
    distanceMeters = calculateDistanceMeters(requester.lat, requester.lng, helper.lat, helper.lng)
    bearing = calculateBearing(requester.lat, requester.lng, helper.lat, helper.lng)
    // Assume walking speed ~1.35 m/s (~81 m/min)
    estimatedEtaMinutes = Math.max(1, Math.round(distanceMeters / 81))
  }

  return NextResponse.json({
    ok: true,
    hasLiveTracking: Boolean(requester || helper),
    liveLocations: {
      requester: requester ?? null,
      helper: helper ?? null,
    },
    telemetry: {
      distanceMeters,
      distanceFeet: distanceMeters !== null ? Math.round(distanceMeters * 3.28084) : null,
      bearingDegrees: bearing?.degrees ?? null,
      compassDirection: bearing?.compass ?? null,
      estimatedEtaMinutes,
    },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { requestId, role, lat, lng, accuracy, heading, speed } = body

    if (!requestId || !role || typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json(
        { ok: false, message: "Missing required parameters (requestId, role, lat, lng)" },
        { status: 400 }
      )
    }

    if (role !== "requester" && role !== "helper") {
      return NextResponse.json(
        { ok: false, message: "Role must be 'requester' or 'helper'" },
        { status: 400 }
      )
    }

    const current = sessionLocations.get(requestId) || {}
    const loc: PeerLocation = {
      lat,
      lng,
      accuracy: typeof accuracy === "number" ? accuracy : undefined,
      heading: typeof heading === "number" ? heading : null,
      speed: typeof speed === "number" ? speed : null,
      updatedAt: Date.now(),
    }

    if (role === "requester") {
      current.requester = loc
    } else {
      current.helper = loc
    }

    sessionLocations.set(requestId, current)

    return NextResponse.json({
      ok: true,
      role,
      updatedAt: loc.updatedAt,
      message: "Live telemetry broadcasted to ephemeral mesh.",
    })
  } catch {
    return NextResponse.json({ ok: false, message: "Invalid JSON payload" }, { status: 400 })
  }
}
