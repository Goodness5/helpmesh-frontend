import { NextResponse } from "next/server"
import prisma from "@/lib/db"

interface StoredMessage {
  id: string
  requestId: string
  senderId: string
  senderName: string
  content: string
  createdAt: number
}

// In-memory fallback map keyed by requestId for zero-configuration and offline resilience
const inMemoryMessages = new Map<string, StoredMessage[]>()

// GET: Fetch messages for a request
export async function GET(request: Request) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get("requestId")
  
  if (!requestId) {
    return NextResponse.json({ ok: false, message: "Missing requestId" }, { status: 400 })
  }
  
  if (prisma) {
    try {
      const messages = await prisma.message.findMany({
        where: { requestId },
        orderBy: { createdAt: "asc" },
        include: {
          sender: {
            select: { id: true, name: true },
          },
        },
      })
      
      const dbList: StoredMessage[] = messages.map((m) => ({
        id: m.id,
        requestId: m.requestId,
        senderId: m.senderId,
        senderName: m.sender.name || "Anonymous",
        content: m.body, // Schema uses 'body' not 'content'
        createdAt: m.createdAt.getTime(),
      }))

      // Merge any local in-memory messages sent during temporary offline periods
      const localList = inMemoryMessages.get(requestId) || []
      const dbIds = new Set(dbList.map((m) => m.id))
      const combined = [...dbList, ...localList.filter((m) => !dbIds.has(m.id))]

      return NextResponse.json({
        ok: true,
        messages: combined,
      })
    } catch (error) {
      console.warn("[API] DB message fetch failed, falling back to in-memory:", error)
    }
  }

  // Resilient in-memory fallback
  const fallbackList = inMemoryMessages.get(requestId) || []
  return NextResponse.json({
    ok: true,
    messages: fallbackList,
  })
}

// POST: Send a new message
export async function POST(request: Request) {
  try {
    const reqBody = await request.json()
    const { requestId, senderId, senderName, content } = reqBody
    
    if (!requestId || !content) {
      return NextResponse.json(
        { ok: false, message: "Missing requestId or content" },
        { status: 400 }
      )
    }

    const fallbackMsg: StoredMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      requestId,
      senderId: senderId || "anonymous",
      senderName: senderName || "Peer",
      content: content.trim(),
      createdAt: Date.now(),
    }

    // Always append to inMemoryMessages for immediate synchronous availability
    const currentList = inMemoryMessages.get(requestId) || []
    currentList.push(fallbackMsg)
    inMemoryMessages.set(requestId, currentList)
    
    if (prisma) {
      try {
        // Find or create sender
        let sender = senderId ? await prisma.user.findFirst({
          where: {
            OR: [
              { id: senderId },
              { walletAddress: senderId },
            ],
          },
        }) : null
        
        if (!sender) {
          sender = await prisma.user.create({
            data: {
              name: senderName || "Helper",
            },
          })
        }
        
        // Create message (schema uses 'body' not 'content')
        const message = await prisma.message.create({
          data: {
            requestId,
            senderId: sender.id,
            body: content.trim(),
          },
          include: {
            sender: {
              select: { id: true, name: true },
            },
          },
        })
        
        return NextResponse.json({
          ok: true,
          message: {
            id: message.id,
            requestId: message.requestId,
            senderId: message.senderId,
            senderName: message.sender.name || senderName || "Peer",
            content: message.body,
            createdAt: message.createdAt.getTime(),
          },
        })
      } catch (dbError) {
        console.warn("[API] DB message create failed, kept in-memory:", dbError)
      }
    }
    
    return NextResponse.json({
      ok: true,
      message: fallbackMsg,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error"
    console.error("[API] Failed to send message:", errorMessage)
    return NextResponse.json(
      { ok: false, message: `Failed to send message: ${errorMessage}` },
      { status: 500 }
    )
  }
}
