import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET: Fetch all open requests (for helpers to see)
export async function GET(request: Request) {
  const url = new URL(request.url)
  const excludeOwner = url.searchParams.get("excludeOwner")
  const status = url.searchParams.get("status") || "open"
  const category = url.searchParams.get("category")
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100)
  
  try {
    const now = new Date()
    
    const where: Record<string, unknown> = {
      status,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: now } },
      ],
    }
    
    // Exclude requests from a specific user
    if (excludeOwner) {
      where.NOT = { requesterId: excludeOwner }
    }
    
    if (category) {
      where.category = category
    }
    
    const requests = await prisma.helpRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            walletAddress: true,
            verified: true,
            completions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })
    
    // Transform to match the expected format
    const formattedRequests = requests.map((req) => ({
      id: req.id,
      owner: req.requesterId,
      requesterName: req.requester.name || "Anonymous",
      requesterVerified: req.requester.verified,
      title: req.title,
      description: req.description,
      category: req.category,
      mode: req.mode,
      amount: req.amount,
      place: req.place || "",
      minutes: req.minutes,
      status: req.status,
      communicate: req.communicate,
      needsSummary: req.needsSummary || "",
      shareNeeds: req.shareNeeds,
      createdAt: req.createdAt.getTime(),
      expiresAt: req.expiresAt?.getTime() || null,
    }))
    
    return NextResponse.json({
      ok: true,
      requests: formattedRequests,
      count: formattedRequests.length,
    })
  } catch (error) {
    console.error("Failed to fetch requests:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to fetch requests", requests: [] },
      { status: 500 }
    )
  }
}

// POST: Publish a new request
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const {
      id,
      owner,
      requesterName,
      title,
      description,
      category,
      mode,
      amount,
      place,
      minutes,
      communicate,
      needsSummary,
      shareNeeds,
      chainKey,
      salt,
    } = body
    
    if (!title) {
      return NextResponse.json(
        { ok: false, message: "Missing required field: title" },
        { status: 400 }
      )
    }
    
    // Find or create user
    let user = owner ? await prisma.user.findFirst({
      where: {
        OR: [
          { id: owner },
          { walletAddress: owner },
        ],
      },
    }) : null
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress: owner || undefined,
          name: requesterName || "Anonymous",
        },
      })
    }
    
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    
    const helpRequest = await prisma.helpRequest.create({
      data: {
        id: id || undefined, // Use provided ID or let Prisma generate one
        requesterId: user.id,
        title,
        description: description || "",
        category: category || "other",
        mode: mode || "volunteer",
        amount: amount || 0,
        place: place || null,
        minutes: minutes || 20,
        communicate: communicate || "Text",
        needsSummary: needsSummary || null,
        shareNeeds: shareNeeds || false,
        chainKey: chainKey || null,
        salt: salt || null,
        expiresAt,
        events: {
          create: {
            event: "Request created",
          },
        },
      },
      include: {
        requester: {
          select: { name: true },
        },
      },
    })
    
    return NextResponse.json({
      ok: true,
      message: "Request published to the mesh",
      request: {
        id: helpRequest.id,
        owner: helpRequest.requesterId,
        requesterName: helpRequest.requester.name,
        title: helpRequest.title,
        status: helpRequest.status,
        createdAt: helpRequest.createdAt.getTime(),
      },
    })
  } catch (error) {
    console.error("Failed to create request:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to create request" },
      { status: 500 }
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
    
    const existing = await prisma.helpRequest.findUnique({
      where: { id },
    })
    
    if (!existing) {
      return NextResponse.json(
        { ok: false, message: "Request not found" },
        { status: 404 }
      )
    }
    
    const updateData: Record<string, unknown> = {}
    
    if (status) {
      updateData.status = status
      
      if (status === "started") {
        updateData.startedAt = new Date()
      } else if (status === "done" || status === "cancelled" || status === "refunded") {
        updateData.completedAt = new Date()
      }
    }
    
    if (helperId) {
      // Find or create helper user
      let helper = await prisma.user.findFirst({
        where: {
          OR: [
            { id: helperId },
            { walletAddress: helperId },
          ],
        },
      })
      
      if (!helper) {
        helper = await prisma.user.create({
          data: {
            walletAddress: helperId,
            name: helperName || "Helper",
          },
        })
      }
      
      updateData.helperId = helper.id
    }
    
    const updated = await prisma.helpRequest.update({
      where: { id },
      data: {
        ...updateData,
        events: {
          create: {
            event: status === "assigned" 
              ? `${helperName || "A helper"} accepted the request`
              : `Status changed to ${status}`,
          },
        },
      },
    })
    
    return NextResponse.json({
      ok: true,
      message: status === "assigned" 
        ? `${helperName || "A helper"} accepted the request` 
        : "Request updated",
      request: {
        id: updated.id,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error("Failed to update request:", error)
    return NextResponse.json(
      { ok: false, message: "Failed to update request" },
      { status: 500 }
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
  
  try {
    await prisma.helpRequest.delete({
      where: { id },
    })
    
    return NextResponse.json({
      ok: true,
      deleted: true,
      message: "Request removed from mesh",
    })
  } catch (error) {
    console.error("Failed to delete request:", error)
    return NextResponse.json({
      ok: true,
      deleted: false,
      message: "Request not found",
    })
  }
}
