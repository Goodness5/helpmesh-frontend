"use client"

import { useState, useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import {
  addConnection,
  getConnectionsSnapshot,
  getConnectionsByType,
  getTotalStats,
  removeConnection,
  subscribeConnections,
  type Connection,
  type ConnectionType,
} from "@/lib/connections"
import {
  Users,
  UserPlus,
  Heart,
  HandHelping,
  Trash2,
  Search,
  X,
  Mail,
  StickyNote,
} from "lucide-react"

function useConnections() {
  return useSyncExternalStore(
    subscribeConnections,
    getConnectionsSnapshot,
    () => ({ connections: [] })
  )
}

const typeLabels: Record<ConnectionType, { label: string; icon: typeof Users; color: string }> = {
  friend: { label: "Friends", icon: Users, color: "text-blue-400" },
  helped: { label: "People I've Helped", icon: HandHelping, color: "text-[#25f497]" },
  helper: { label: "People Who Helped Me", icon: Heart, color: "text-pink-400" },
}

export function ConnectionsPanel() {
  const state = useConnections()
  const announce = useAnnounce()
  const [activeTab, setActiveTab] = useState<ConnectionType>("friend")
  const [showAdd, setShowAdd] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [newConnection, setNewConnection] = useState({
    name: "",
    email: "",
    notes: "",
    type: "friend" as ConnectionType,
  })

  const stats = getTotalStats()
  const filteredConnections = searchQuery
    ? state.connections.filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.notes.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : getConnectionsByType(activeTab)

  function handleAdd() {
    if (!newConnection.name.trim()) {
      announce("Please enter a name")
      return
    }
    addConnection({
      name: newConnection.name.trim(),
      email: newConnection.email.trim() || undefined,
      notes: newConnection.notes.trim(),
      type: newConnection.type,
    })
    announce(`Added ${newConnection.name} to your ${typeLabels[newConnection.type].label.toLowerCase()}`)
    setNewConnection({ name: "", email: "", notes: "", type: "friend" })
    setShowAdd(false)
  }

  function handleRemove(connection: Connection) {
    removeConnection(connection.id)
    announce(`Removed ${connection.name} from your connections`)
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
          <div className="flex items-center gap-2 text-blue-400">
            <Users className="size-4" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-wider">Friends</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.totalFriends}</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[#25f497]">
            <HandHelping className="size-4" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-wider">Helped</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.peopleHelped}</p>
          <p className="text-xs text-zinc-500">{stats.totalHelpGiven} times</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 space-y-1">
          <div className="flex items-center gap-2 text-pink-400">
            <Heart className="size-4" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-wider">Helpers</span>
          </div>
          <p className="text-2xl font-mono font-bold text-white">{stats.helpersUsed}</p>
          <p className="text-xs text-zinc-500">{stats.totalHelpReceived} times</p>
        </div>
        <div className="rounded-2xl border border-[#25f497]/30 bg-[#25f497]/5 p-4 space-y-1">
          <div className="flex items-center gap-2 text-[#25f497]">
            <UserPlus className="size-4" aria-hidden="true" />
            <span className="text-xs font-mono uppercase tracking-wider">Add New</span>
          </div>
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className="text-sm font-mono text-[#25f497] hover:underline"
            aria-label="Add a new connection"
          >
            + Add Connection
          </button>
        </div>
      </div>

      {/* Add Connection Modal */}
      {showAdd && (
        <div className="rounded-2xl border border-[#25f497]/30 bg-zinc-950/80 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-mono font-medium text-white">Add Connection</h3>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              aria-label="Cancel adding connection"
              className="size-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white min-h-[44px]"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="conn-name" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Name *
              </label>
              <input
                id="conn-name"
                type="text"
                value={newConnection.name}
                onChange={(e) => setNewConnection({ ...newConnection, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[48px]"
                placeholder="Enter name"
                required
              />
            </div>

            <div>
              <label htmlFor="conn-email" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Email (optional)
              </label>
              <input
                id="conn-email"
                type="email"
                value={newConnection.email}
                onChange={(e) => setNewConnection({ ...newConnection, email: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[48px]"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label htmlFor="conn-type" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Connection Type
              </label>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Connection type">
                {(Object.keys(typeLabels) as ConnectionType[]).map((type) => {
                  const { label, icon: Icon, color } = typeLabels[type]
                  const active = newConnection.type === type
                  return (
                    <button
                      key={type}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setNewConnection({ ...newConnection, type })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs min-h-[44px] ${
                        active
                          ? "bg-[#25f497] text-black font-semibold"
                          : "border border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800"
                      }`}
                    >
                      <Icon className={`size-4 ${active ? "text-black" : color}`} aria-hidden="true" />
                      <span>{label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label htmlFor="conn-notes" className="block text-xs font-mono text-zinc-400 mb-1.5">
                Notes (optional)
              </label>
              <textarea
                id="conn-notes"
                value={newConnection.notes}
                onChange={(e) => setNewConnection({ ...newConnection, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-zinc-800 bg-zinc-900/60 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[80px] resize-none"
                placeholder="Add any notes about this person..."
                rows={3}
              />
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="w-full bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
            >
              Add Connection
            </button>
          </div>
        </div>
      )}

      {/* Tabs and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Connection types">
          {(Object.keys(typeLabels) as ConnectionType[]).map((type) => {
            const { label, icon: Icon, color } = typeLabels[type]
            const active = activeTab === type && !searchQuery
            const count = getConnectionsByType(type).length
            return (
              <button
                key={type}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setActiveTab(type)
                  setSearchQuery("")
                }}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xs min-h-[44px] ${
                  active
                    ? "bg-zinc-800 text-white border border-zinc-700"
                    : "border border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
                }`}
              >
                <Icon className={`size-4 ${color}`} aria-hidden="true" />
                <span>{label}</span>
                <span className="text-zinc-500">({count})</span>
              </button>
            )
          })}
        </div>

        <div className="relative w-full sm:w-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-zinc-500" aria-hidden="true" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search connections..."
            aria-label="Search connections"
            className="w-full sm:w-64 pl-10 pr-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/60 text-white font-mono text-xs focus:border-[#25f497] focus:outline-none min-h-[44px]"
          />
        </div>
      </div>

      {/* Connections List */}
      <div className="space-y-3" role="list" aria-label={searchQuery ? "Search results" : `${typeLabels[activeTab].label} list`}>
        {filteredConnections.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-8 text-center font-mono">
            <p className="text-zinc-400">
              {searchQuery
                ? "No connections match your search."
                : `No ${typeLabels[activeTab].label.toLowerCase()} yet.`}
            </p>
            <button
              type="button"
              onClick={() => setShowAdd(true)}
              className="mt-4 text-[#25f497] hover:underline text-sm"
            >
              + Add your first connection
            </button>
          </div>
        ) : (
          filteredConnections.map((connection) => {
            const { icon: Icon, color } = typeLabels[connection.type]
            return (
              <div
                key={connection.id}
                role="listitem"
                className="group rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`size-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center ${color}`}>
                      <Icon className="size-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-base font-mono font-medium text-white">{connection.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                        <span className={`${color}`}>{typeLabels[connection.type].label}</span>
                        {connection.helpCount > 0 && (
                          <span className="text-zinc-500">• {connection.helpCount} help session{connection.helpCount !== 1 ? "s" : ""}</span>
                        )}
                      </div>
                      {connection.email && (
                        <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Mail className="size-3" aria-hidden="true" />
                          <span>{connection.email}</span>
                        </div>
                      )}
                      {connection.notes && (
                        <div className="flex items-start gap-1.5 text-xs text-zinc-500 mt-2">
                          <StickyNote className="size-3 shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{connection.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemove(connection)}
                    aria-label={`Remove ${connection.name} from connections`}
                    className="opacity-0 group-hover:opacity-100 size-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition-all min-h-[44px]"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
