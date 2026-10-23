"use client"

/**
 * Connections - Local storage backed system for tracking:
 * - Friends (people you've added)
 * - People you've helped
 * - People who've helped you
 */

export type ConnectionType = "friend" | "helped" | "helper"

export interface Connection {
  id: string
  name: string
  type: ConnectionType
  addedAt: number
  helpCount: number
  lastInteraction: number | null
  notes: string
  email?: string
}

export interface ConnectionsState {
  connections: Connection[]
}

const STORAGE_KEY = "helpmesh.connections.v1"
const listeners = new Set<() => void>()
let cachedState: ConnectionsState = { connections: [] }
let loaded = false

function emit() {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cachedState))
  }
  listeners.forEach((listener) => listener())
}

export function subscribeConnections(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function getConnectionsSnapshot(): ConnectionsState {
  if (!loaded && typeof window !== "undefined") {
    loaded = true
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        cachedState = JSON.parse(raw)
      }
    } catch {
      cachedState = { connections: [] }
    }
  }
  return cachedState
}

export function addConnection(data: Omit<Connection, "id" | "addedAt" | "helpCount" | "lastInteraction">): Connection {
  const connection: Connection = {
    ...data,
    id: `conn_${crypto.randomUUID().slice(0, 8)}`,
    addedAt: Date.now(),
    helpCount: data.type === "helped" || data.type === "helper" ? 1 : 0,
    lastInteraction: data.type === "helped" || data.type === "helper" ? Date.now() : null,
  }
  cachedState = {
    ...cachedState,
    connections: [connection, ...cachedState.connections],
  }
  emit()
  return connection
}

export function updateConnection(id: string, updates: Partial<Connection>): boolean {
  const index = cachedState.connections.findIndex((c) => c.id === id)
  if (index === -1) return false

  cachedState = {
    ...cachedState,
    connections: cachedState.connections.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  }
  emit()
  return true
}

export function removeConnection(id: string): boolean {
  const before = cachedState.connections.length
  cachedState = {
    ...cachedState,
    connections: cachedState.connections.filter((c) => c.id !== id),
  }
  if (cachedState.connections.length !== before) {
    emit()
    return true
  }
  return false
}

export function incrementHelpCount(id: string): void {
  updateConnection(id, {
    helpCount: (cachedState.connections.find((c) => c.id === id)?.helpCount ?? 0) + 1,
    lastInteraction: Date.now(),
  })
}

export function getConnectionsByType(type: ConnectionType): Connection[] {
  return cachedState.connections.filter((c) => c.type === type)
}

export function getRecentConnections(limit = 5): Connection[] {
  return [...cachedState.connections]
    .sort((a, b) => (b.lastInteraction ?? b.addedAt) - (a.lastInteraction ?? a.addedAt))
    .slice(0, limit)
}

export function searchConnections(query: string): Connection[] {
  const lower = query.toLowerCase()
  return cachedState.connections.filter(
    (c) =>
      c.name.toLowerCase().includes(lower) ||
      c.notes.toLowerCase().includes(lower) ||
      c.email?.toLowerCase().includes(lower)
  )
}

export function getTotalStats() {
  const connections = cachedState.connections
  return {
    totalFriends: connections.filter((c) => c.type === "friend").length,
    peopleHelped: connections.filter((c) => c.type === "helped").length,
    helpersUsed: connections.filter((c) => c.type === "helper").length,
    totalHelpGiven: connections
      .filter((c) => c.type === "helped")
      .reduce((sum, c) => sum + c.helpCount, 0),
    totalHelpReceived: connections
      .filter((c) => c.type === "helper")
      .reduce((sum, c) => sum + c.helpCount, 0),
  }
}
