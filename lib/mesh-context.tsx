"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"

// Types
export type Mode = "volunteer" | "reward" | "sponsored"
export type Status = "open" | "assigned" | "started" | "awaiting_confirm" | "done" | "cancelled" | "disputed" | "refunded"

export interface HelpRequest {
  id: string
  owner: string
  requesterName: string
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
  
  // Actions
  createRequest: (data: CreateRequestData) => Promise<{ ok: boolean; id?: string; message: string }>
  acceptRequest: (requestId: string) => Promise<{ ok: boolean; message: string }>
  startHelp: (requestId: string) => Promise<{ ok: boolean; message: string }>
  completeHelp: (requestId: string) => Promise<{ ok: boolean; message: string }>
  cancelRequest: (requestId: string, reason?: string) => Promise<{ ok: boolean; message: string }>
  
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
      
      if (result.ok) {
        await refresh()
        await refreshRequest(requestId)
        return { ok: true, message: "You accepted the request!" }
      }
      
      return { ok: false, message: result.message || "Failed to accept" }
    } catch (err) {
      console.error("[Mesh] Accept error:", err)
      return { ok: false, message: "Network error" }
    }
  }, [userId, userName, refresh, refreshRequest])

  // Start help session
  const startHelp = useCallback(async (requestId: string) => {
    try {
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
      return { ok: false, message: "Network error" }
    }
  }, [refreshRequest])

  // Complete help
  const completeHelp = useCallback(async (requestId: string) => {
    try {
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
      return { ok: false, message: "Network error" }
    }
  }, [refresh])

  // Cancel request
  const cancelRequest = useCallback(async (requestId: string, reason?: string) => {
    try {
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
      return { ok: false, message: "Network error" }
    }
  }, [refresh])

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
