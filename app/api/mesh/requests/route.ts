import { NextResponse } from "next/server"

// Ephemeral in-memory store for requests (shared across all sessions)
// In production, this would be a database or blockchain
interface SharedRequest {
  id: string
  owner: string // wallet address or user ID
  requesterName: string
  title: string
  description: string
  category: string
  mode: "volunteer" | "reward" | "sponsored"
  amount: number
  place: string
  minutes: number
  status: string
  communicate: string
  needsSummary: string
  shareNeeds: boolean
  createdAt: number
  expiresAt: number
}

const sharedRequests = new Map<string, SharedRequest>()

// Clean up expired requests every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [id, request] of sharedRequests.entries()) {
    if (request.expiresAt < now) {
      sharedRequests.delete(id)
    }
  }
}, 5 * 60 * 1000)

// GET: Fetch all open requests (for helpers to see)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const excludeOwner = url.searchParams.get("excludeOwner") // Don't show own requests
  
  const now = Date.now()
  const openRequests: SharedRequest[] = []
  
  for (const req of sharedRequests.values()) {
    // Only return open, non-expired requests
    if (req.status === "open" && req.expiresAt > now) {
      if (excludeOwner && req.owner === excludeOwner) continue
      openRequests.push(req)
    }
  }
  
  // Sort by most recent first
  openRequests.sort((a, b) => b.createdAt - a.createdAt)
  
  return NextResponse.json({
    ok: true,
    requests: openRequests,
    count: openRequests.length,
  })
}

// POST: Publish a new request
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const { id, owner, requesterName, title, description, category, mode, amount, place, minutes, communicate, needsSummary, shareNeeds } = body
    
    if (!id || !owner || !title) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields (id, owner, title)" },
        { status: 400 }
      )
    }
    
    const now = Date.now()
    const expiresAt = now + 24 * 60 * 60 * 1000 // Expires in 24 hours
    
    const sharedRequest: SharedRequest = {
      id,
      owner,
      requesterName: requesterName || "Anonymous",
      title,
      description: description || "",
      category: category || "other",
      mode: mode || "volunteer",
      amount: amount || 0,
      place: place || "",
      minutes: minutes || 20,
      status: "open",
      communicate: communicate || "Text",
      needsSummary: needsSummary || "",
      shareNeeds: shareNeeds || false,
      createdAt: now,
      expiresAt,
    }
    
    sharedRequests.set(id, sharedRequest)
    
    return NextResponse.json({
      ok: true,
      message: "Request published to the mesh",
      request: sharedRequest,
    })
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request body" },
      { status: 400 }
    )
  }
}

// PATCH: Update request status (e.g., when accepted by a helper)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, status, helperId, helperName } = body
    
    if (!id) {
      return NextResponse.json(
        { ok: false, message: "Missing request ID" },
        { status: 400 }
      )
    }
    
    const existing = sharedRequests.get(id)
    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "Request not found" },
        { status: 404 }
      )
    }
    
    // Update the request
    const updated: SharedRequest = {
      ...existing,
      status: status || existing.status,
    }
    
    sharedRequests.set(id, updated)
    
    return NextResponse.json({
      ok: true,
      message: status === "assigned" ? `${helperName || "A helper"} accepted the request` : "Request updated",
      request: updated,
    })
  } catch {
    return NextResponse.json(
      { ok: false, message: "Invalid request body" },
      { status: 400 }
    )
  }
}

// DELETE: Remove a request (cancelled or completed)
export async function DELETE(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  
  if (!id) {
    return NextResponse.json(
      { ok: false, message: "Missing request ID" },
      { status: 400 }
    )
  }
  
  const existed = sharedRequests.delete(id)
  
  return NextResponse.json({
    ok: true,
    deleted: existed,
    message: existed ? "Request removed from mesh" : "Request not found",
  })
}
