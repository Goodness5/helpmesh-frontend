"use client"

import { useState } from "react"
import Link from "next/link"
import { useAccountAbstraction } from "@/components/providers/privy-provider"
import { ConnectionsPanel } from "@/components/connections-panel"
import { MyHelps } from "@/components/my-helps"
import { PageTitle } from "@/components/page-title"
import {
  User,
  Users,
  HandHelping,
  Settings,
  ArrowRight,
} from "lucide-react"

type Tab = "helps" | "connections"

export function ProfileContent() {
  const { authenticated, user } = useAccountAbstraction()
  const [activeTab, setActiveTab] = useState<Tab>("helps")

  const displayName = user?.email?.address?.split("@")[0] || "Guest"

  return (
    <div className="w-full max-w-5xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497] animate-pulse" aria-hidden="true" />
          <span>Your Profile</span>
        </div>
        <PageTitle>Profile & History</PageTitle>
        <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
          Manage your help requests, connections, and account settings.
        </p>
      </div>

      {/* User Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <User className="size-7" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-mono font-medium text-white">
                {authenticated ? displayName : "Welcome, Guest"}
              </h2>
              <p className="text-sm font-mono text-zinc-500">
                {authenticated ? user?.email?.address : "Sign in to save your data across devices"}
              </p>
            </div>
          </div>
          <Link
            href="/settings/accessibility"
            className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono font-medium px-4 py-2 rounded-full text-xs transition-colors min-h-[44px]"
            aria-label="Go to settings"
          >
            <Settings className="size-4" aria-hidden="true" />
            <span>Settings</span>
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-zinc-800 pb-2" role="tablist" aria-label="Profile sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "helps"}
          aria-controls="helps-panel"
          onClick={() => setActiveTab("helps")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-sm transition-colors min-h-[44px] ${
            activeTab === "helps"
              ? "bg-zinc-800 text-white border border-zinc-700 border-b-0"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <HandHelping className="size-4" aria-hidden="true" />
          <span>My Helps</span>
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === "connections"}
          aria-controls="connections-panel"
          onClick={() => setActiveTab("connections")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-sm transition-colors min-h-[44px] ${
            activeTab === "connections"
              ? "bg-zinc-800 text-white border border-zinc-700 border-b-0"
              : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
          }`}
        >
          <Users className="size-4" aria-hidden="true" />
          <span>Connections</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div id="helps-panel" role="tabpanel" aria-labelledby="helps-tab" hidden={activeTab !== "helps"}>
        {activeTab === "helps" && <MyHelps />}
      </div>
      <div id="connections-panel" role="tabpanel" aria-labelledby="connections-tab" hidden={activeTab !== "connections"}>
        {activeTab === "connections" && <ConnectionsPanel />}
      </div>
    </div>
  )
}
