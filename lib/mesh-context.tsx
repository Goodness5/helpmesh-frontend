"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { Hex } from "viem"
import { chainEscrow, chainAssign, chainFundReward, chainVolunteer } from "@/lib/chain/calls"
import { liveChain } from "@/lib/chain/plain"
import { helperRole } from "@/lib/chain/session"

// Types
export type Mode = "volunteer" | "reward" | "sponsored"
export type Status = "open" | "assigned" | "started" | "awaiting_confirm" | "done" | "cancelled" | "disputed" | "refunded"

export interface HelpRequest {
  id: string
  owner: string
  requesterName: string
  requesterAge?: number | null
  requesterBio?: string | null
  requesterPronouns?: string | null
  requesterCity?: string | null
  requesterCompletions?: number
  requesterHelpedCount?: number
  requesterVerified?: boolean
  title: string
  description: string
  category: string
  mode: Mode
  amount: number
  place: string
  minutes: number
  status: Status
  helperId: string | null
  helperName: string | null
  communicate: string
  needsSummary: string
  shareNeeds: boolean
  createdAt: number
  expiresAt: number | null
}

// Generate a human story from request data
export function humanStory(request: HelpRequest): string {
  const name = request.requesterName || "Someone"
  const age = request.requesterAge
  const city = request.requesterCity
  const pronouns = request.requesterPronouns
  
  // Determine pronoun usage
  let pronoun = "they"
  let possessive = "their"
  if (pronouns === "he/him") {
    pronoun = "he"
    possessive = "his"
  } else if (pronouns === "she/her") {
    pronoun = "she"
    possessive = "her"
  }
  
  // Build the story
  let story = name
  if (age) story += `, ${age} years old`
  if (city) story += ` from ${city}`
  
  // Add the need
  const category = request.category?.toLowerCase() || ""
  if (category.includes("mobility") || category.includes("stair")) {
    story += `, needs help with mobility`
  } else if (category.includes("vision") || category.includes("read")) {
    story += `, needs help seeing or reading something`
  } else if (category.includes("carry") || category.includes("errand")) {
    story += `, needs help carrying something`
  } else if (category.includes("companion")) {
    story += `, would like some company`
  } else {
    story += `, needs a helping hand`
  }
  
  // Add history
  const helpedCount = request.requesterHelpedCount || 0
  if (helpedCount > 0) {
    story += `. Has been helped ${helpedCount} time${helpedCount > 1 ? "s" : ""} before`
  }
  
  return story
}

export interface Message {
  id: string
  requestId: string
  senderId: string
  senderName: string
  content: string
  createdAt: number
}

interface MeshContextType {
  // User
  userId: string | null
  userName: string | null
  setUser: (id: string | null, name: string | null) => void
  
  // Requests
  myRequests: HelpRequest[]
  openRequests: HelpRequest[] // Requests from others I can help with
  currentRequest: HelpRequest | null
  loading: boolean
  error: string | null
  
  // Basic Actions (DB only)
  createRequest: (data: CreateRequestData) => Promise<{ ok: boolean; id?: string; message: string }>
  acceptRequest: (requestId: string) => Promise<{ ok: boolean; message: string }>
  startHelp: (requestId: string, chainKey?: string | null) => Promise<{ ok: boolean; message: string }>
  completeHelp: (requestId: string, chainKey?: string | null) => Promise<{ ok: boolean; message: string }>
  cancelRequest: (requestId: string, reason?: string, chainKey?: string | null) => Promise<{ ok: boolean; message: string }>
  
  // Blockchain + DB Actions
  confirmHelp: (requestId: string, chainKey?: string | null) => Promise<{ ok: boolean; message: string }>
  disputeRequest: (requestId: string, chainKey?: string | null) => Promise<{ ok: boolean; message: string }>
  holdReward: (requestId: string, amount: number, chainKey: string) => Promise<{ ok: boolean; message: string }>
  
  // Messages
  messages: Message[]
  sendMessage: (requestId: string, content: string) => Promise<{ ok: boolean; message: string }>
  
  // Refresh
  refresh: () => Promise<void>
  refreshRequest: (id: string) => Promise<void>
}

interface CreateRequestData {
  title: string
  description: string
  category: string
  mode: Mode
  amount: number
  place: string
  minutes: number
  communicate: string
  needsSummary?: string
  shareNeeds?: boolean
}

const MeshContext = createContext<MeshContextType | null>(null)

export function MeshProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [myRequests, setMyRequests] = useState<HelpRequest[]>([])
  const [openRequests, setOpenRequests] = useState<HelpRequest[]>([])
  const [currentRequest, setCurrentRequest] = useState<HelpRequest | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set user
  const setUser = useCallback((id: string | null, name: string | null) => {
    setUserId(id)
    setUserName(name)
    if (typeof window !== "undefined") {
      if (id) {
        localStorage.setItem("mesh.userId", id)
        localStorage.setItem("mesh.userName", name || "")
      } else {
        localStorage.removeItem("mesh.userId")
        localStorage.removeItem("mesh.userName")
      }
    }
  }, [])

  // Load user from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedId = localStorage.getItem("mesh.userId")
      const savedName = localStorage.getItem("mesh.userName")
      if (savedId) {
        setUserId(savedId)
        setUserName(savedName)
      }
    }
  }, [])

  // Fetch all requests
  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      // Fetch open requests from others
      const openRes = await fetch(`/api/mesh/requests?excludeOwner=${userId || "anonymous"}`)
      const openData = await openRes.json()
      
      if (openData.ok) {
        setOpenRequests(openData.requests || [])
      }
      
      // Fetch my requests (if logged in)
      if (userId) {
        const myRes = await fetch(`/api/mesh/requests?owner=${userId}`)
        const myData = await myRes.json()
        
        if (myData.ok) {
          setMyRequests(myData.requests || [])
        }
      }
    } catch (err) {
      console.error("[Mesh] Failed to fetch requests:", err)
      setError("Failed to load requests")
    } finally {
      setLoading(false)
    }
  }, [userId])

  // Fetch a specific request
  const refreshRequest = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/mesh/requests/${id}`)
      const data = await res.json()
      
      if (data.ok && data.request) {
        setCurrentRequest(data.request)
        
        // Also fetch messages for this request
        const msgRes = await fetch(`/api/mesh/messages?requestId=${id}`)
        const msgData = await msgRes.json()
        if (msgData.ok) {
          setMessages(msgData.messages || [])
        }
      }
    } catch (err) {
      console.error("[Mesh] Failed to fetch request:", err)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    refresh()
  }, [refresh])

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(refresh, 10000)
    return () => clearInterval(interval)
  }, [refresh])

  // Create a new request
  const createRequest = useCallback(async (data: CreateRequestData) => {
    try {
      const res = await fetch("/api/mesh/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          owner: userId || "anonymous",
          requesterName: userName || "Someone",
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refresh()
        return { ok: true, id: result.request?.id, message: "Request created!" }
      }
      
      return { ok: false, message: result.message || "Failed to create request" }
    } catch (err) {
      console.error("[Mesh] Create request error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [userId, userName, refresh])

  // Accept a request (as helper)
  const acceptRequest = useCallback(async (requestId: string) => {
    console.log("[Mesh] Accepting request:", requestId, "as user:", userId, userName)
    
    try {
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "assigned",
          helperId: userId || "helper",
          helperName: userName || "A helper",
        }),
      })
      
      const result = await res.json()
      console.log("[Mesh] Accept response:", result)
      
      if (result.ok) {
        await refresh()
        return { ok: true, message: "You accepted the request!" }
      }
      
      return { ok: false, message: result.message || "Failed to accept" }
    } catch (err) {
      console.error("[Mesh] Accept error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [userId, userName, refresh])

  // Start help session (with optional blockchain)
  const startHelp = useCallback(async (requestId: string, chainKey?: string | null) => {
    try {
      // Call blockchain if chain key provided
      if (liveChain && chainKey) {
        const chainResult = await chainEscrow(helperRole(userId || "helper"), chainKey as Hex, "start")
        if (!chainResult.ok) {
          return { ok: false, message: chainResult.message }
        }
      }
      
      // Update database
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "started",
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refreshRequest(requestId)
        return { ok: true, message: "Help session started!" }
      }
      
      return { ok: false, message: result.message || "Failed to start" }
    } catch (err) {
      console.error("[Mesh] Start help error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [refreshRequest, userId])

  // Complete help (with optional blockchain)
  const completeHelp = useCallback(async (requestId: string, chainKey?: string | null) => {
    try {
      // Call blockchain if chain key provided
      if (liveChain && chainKey) {
        const chainResult = await chainEscrow(helperRole(userId || "helper"), chainKey as Hex, "complete")
        if (!chainResult.ok) {
          return { ok: false, message: chainResult.message }
        }
      }
      
      // Update database
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "done",
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refresh()
        return { ok: true, message: "Help completed! Thank you." }
      }
      
      return { ok: false, message: result.message || "Failed to complete" }
    } catch (err) {
      console.error("[Mesh] Complete help error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [refresh, userId])

  // Cancel request (with optional blockchain)
  const cancelRequest = useCallback(async (requestId: string, reason?: string, chainKey?: string | null) => {
    try {
      // Call blockchain if chain key provided
      if (liveChain && chainKey) {
        const chainResult = await chainEscrow("you", chainKey as Hex, "cancel")
        if (!chainResult.ok) {
          return { ok: false, message: chainResult.message }
        }
      }
      
      // Update database
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "cancelled",
          reason,
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refresh()
        return { ok: true, message: "Request cancelled" }
      }
      
      return { ok: false, message: result.message || "Failed to cancel" }
    } catch (err) {
      console.error("[Mesh] Cancel error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [refresh])

  // Confirm help received and release payment (blockchain + DB)
  const confirmHelp = useCallback(async (requestId: string, chainKey?: string | null) => {
    try {
      // Call blockchain to release payment
      if (liveChain && chainKey) {
        const chainResult = await chainEscrow("you", chainKey as Hex, "confirm")
        if (!chainResult.ok) {
          return { ok: false, message: chainResult.message }
        }
      }
      
      // Update database
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "done",
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refresh()
        return { ok: true, message: "Help confirmed! Payment released." }
      }
      
      return { ok: false, message: result.message || "Failed to confirm" }
    } catch (err) {
      console.error("[Mesh] Confirm help error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [refresh])

  // Open a dispute (blockchain + DB)
  const disputeRequest = useCallback(async (requestId: string, chainKey?: string | null) => {
    try {
      // Call blockchain to open dispute
      if (liveChain && chainKey) {
        const chainResult = await chainEscrow("you", chainKey as Hex, "dispute")
        if (!chainResult.ok) {
          return { ok: false, message: chainResult.message }
        }
      }
      
      // Update database
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          status: "disputed",
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refresh()
        return { ok: true, message: "Dispute opened. A moderator will review." }
      }
      
      return { ok: false, message: result.message || "Failed to open dispute" }
    } catch (err) {
      console.error("[Mesh] Dispute error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [refresh])

  // Hold reward in escrow (blockchain + DB)
  const holdReward = useCallback(async (requestId: string, amount: number, chainKey: string) => {
    try {
      // Call blockchain to lock funds
      if (liveChain) {
        const chainResult = await chainFundReward(chainKey as Hex, BigInt(amount))
        if (!chainResult.ok) {
          return { ok: false, message: chainResult.message }
        }
      }
      
      // Update database with escrow state
      const res = await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: requestId,
          escrowState: 1, // Funds locked
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        await refreshRequest(requestId)
        return { ok: true, message: "Funds locked in escrow!" }
      }
      
      return { ok: false, message: result.message || "Failed to lock funds" }
    } catch (err) {
      console.error("[Mesh] Hold reward error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [refreshRequest])

  // Send message
  const sendMessage = useCallback(async (requestId: string, content: string) => {
    try {
      const res = await fetch("/api/mesh/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          senderId: userId,
          senderName: userName || "Someone",
          content,
        }),
      })
      
      const result = await res.json()
      
      if (result.ok) {
        // Add message to local state immediately
        setMessages((prev) => [...prev, result.message])
        return { ok: true, message: "Sent!" }
      }
      
      return { ok: false, message: result.message || "Failed to send" }
    } catch (err) {
      return { ok: false, message: "Network error" }
    }
  }, [userId, userName])

  return (
    <MeshContext.Provider
      value={{
        userId,
        userName,
        setUser,
        myRequests,
        openRequests,
        currentRequest,
        loading,
        error,
        createRequest,
        acceptRequest,
        startHelp,
        completeHelp,
        cancelRequest,
        confirmHelp,
        disputeRequest,
        holdReward,
        messages,
        sendMessage,
        refresh,
        refreshRequest,
      }}
    >
      {children}
    </MeshContext.Provider>
  )
}

export function useMesh() {
  const context = useContext(MeshContext)
  if (!context) {
    throw new Error("useMesh must be used within a MeshProvider")
  }
  return context
}
