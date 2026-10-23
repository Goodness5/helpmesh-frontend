import { NextResponse } from "next/server"
import prisma from "@/lib/db"

// GET: Fetch messages for a request
export async function GET(request: Request) {
  const url = new URL(request.url)
  const requestId = url.searchParams.get("requestId")
  
  if (!requestId) {
    return NextResponse.json({ ok: false, message: "Missing requestId" }, { status: 400 })
  }
  
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
    
    return NextResponse.json({
      ok: true,
      messages: messages.map((m) => ({
        id: m.id,
        requestId: m.requestId,
        senderId: m.senderId,
        senderName: m.sender.name || "Anonymous",
        content: m.body, // Schema uses 'body' not 'content'
        createdAt: m.createdAt.getTime(),
      })),
    })
  } catch (error) {
    console.error("[API] Failed to fetch messages:", error)
    return NextResponse.json({ ok: false, message: "Failed to fetch messages" }, { status: 500 })
  }
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
        body: content,
      },
      include: {
        sender: {
          select: { id: true, name: true },
        },
      },
    })
    
    console.log("[API] Message sent:", message.id, "for request:", requestId)
    
    return NextResponse.json({
      ok: true,
      message: {
        id: message.id,
        requestId: message.requestId,
        senderId: message.senderId,
        senderName: message.sender.name,
        content: message.body,
        createdAt: message.createdAt.getTime(),
      },
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
