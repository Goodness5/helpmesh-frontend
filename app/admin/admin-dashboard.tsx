"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Link from "next/link"
import { useAccountAbstraction } from "@/components/providers/privy-provider"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import {
  fetchPlatformStats,
  fetchEscrowSettings,
  fetchAllPools,
  contracts,
  isAdminAddress,
  ADMIN_ADDRESS,
  EXPLORER,
  type PlatformStats,
  type EscrowStats,
  type PoolInfo,
} from "@/lib/admin"
import { EscrowControls } from "@/components/admin/escrow-controls"
import { PoolControls } from "@/components/admin/pool-controls"
import { RoleManagement } from "@/components/admin/role-management"
import { USDCFaucet } from "@/components/admin/usdc-faucet"
import {
  Shield,
  Activity,
  Settings,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  PauseCircle,
  PlayCircle,
  Database,
  Lock,
  DollarSign,
  TrendingUp,
  Copy,
  Check,
  Users,
  Coins,
  Wallet,
} from "lucide-react"

type Tab = "overview" | "escrow" | "pools" | "contracts" | "roles" | "tools"

export function AdminDashboard() {
  const { authenticated, user, primaryWallet } = useAccountAbstraction()
  const announce = useAnnounce()
  const [activeTab, setActiveTab] = useState<Tab>("overview")
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [escrowSettings, setEscrowSettings] = useState<EscrowStats | null>(null)
  const [pools, setPools] = useState<PoolInfo[]>([])
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null)

  const userAddress = primaryWallet?.address
  const isAdmin = isAdminAddress(userAddress)
  const initialLoadDone = useRef(false)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsData, escrowData, poolsData] = await Promise.all([
        fetchPlatformStats(),
        fetchEscrowSettings(),
        fetchAllPools(),
      ])
      setStats(statsData)
      setEscrowSettings(escrowData)
      setPools(poolsData)
    } catch (error) {
      console.error("Failed to load admin data:", error)
      announce("Failed to load platform data")
    } finally {
      setLoading(false)
    }
  }, [announce])

  // Initial load on mount
  useEffect(() => {
    if (!initialLoadDone.current) {
      initialLoadDone.current = true
      void loadData()
    }
  }, [loadData])

  function copyAddress(address: string) {
    navigator.clipboard.writeText(address)
    setCopiedAddress(address)
    announce("Address copied")
    setTimeout(() => setCopiedAddress(null), 2000)
  }

  // Unauthorized view
  if (!authenticated) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12">
        <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-12 text-center font-mono space-y-4">
          <div className="size-16 rounded-2xl bg-red-950/50 border border-red-500/30 mx-auto flex items-center justify-center text-red-400">
            <Lock className="size-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-medium text-white">Authentication Required</h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            Please sign in to access the admin dashboard.
          </p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12">
        <div className="rounded-3xl border border-yellow-500/30 bg-yellow-950/20 p-12 text-center font-mono space-y-4">
          <div className="size-16 rounded-2xl bg-yellow-950/50 border border-yellow-500/30 mx-auto flex items-center justify-center text-yellow-400">
            <AlertTriangle className="size-8" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-medium text-white">Access Denied</h1>
          <p className="text-sm text-zinc-400 max-w-md mx-auto">
            You don&apos;t have permission to access the admin dashboard.
            <br />
            Connected: {userAddress?.slice(0, 10)}...
          </p>
          <p className="text-xs text-zinc-500">
            Admin: {ADMIN_ADDRESS}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-[#25f497]/30 bg-[#25f497]/10 text-xs font-mono uppercase tracking-widest text-[#25f497]">
            <Shield className="size-3.5" aria-hidden="true" />
            <span>Admin Dashboard</span>
          </div>
          <PageTitle>Platform Control Center</PageTitle>
        </div>
        <button
          type="button"
          onClick={loadData}
          disabled={loading}
          className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono font-medium px-4 py-2 rounded-full text-xs transition-colors min-h-[44px] disabled:opacity-50"
          aria-label="Refresh data"
        >
          <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Admin Info Card */}
      <div className="rounded-2xl border border-[#25f497]/30 bg-zinc-950/80 p-5">
        <div className="flex items-center gap-4">
          <div className="size-12 rounded-xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
            <Shield className="size-6" aria-hidden="true" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-mono text-zinc-400">Signed in as Admin</p>
            <p className="text-sm font-mono text-white">{user?.email?.address || userAddress}</p>
          </div>
          <a
            href={`${EXPLORER}/address/${userAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-mono text-[#25f497] hover:underline"
          >
            <span>View on Explorer</span>
            <ExternalLink className="size-3" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-zinc-800 pb-2" role="tablist" aria-label="Admin sections">
        {[
          { id: "overview", label: "Overview", icon: Activity },
          { id: "escrow", label: "Escrow", icon: Lock },
          { id: "pools", label: "Pools", icon: Database },
          { id: "roles", label: "Roles", icon: Users },
          { id: "tools", label: "Tools", icon: Coins },
          { id: "contracts", label: "Contracts", icon: Settings },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            onClick={() => setActiveTab(id as Tab)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl font-mono text-xs transition-colors min-h-[44px] ${
              activeTab === id
                ? "bg-zinc-800 text-white border border-zinc-700 border-b-0"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
            }`}
          >
            <Icon className="size-4" aria-hidden="true" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <DollarSign className="size-4" aria-hidden="true" />
                <span className="text-xs font-mono uppercase tracking-wider">Pool Balance</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                ${loading ? "..." : stats?.poolBalance || "0"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <TrendingUp className="size-4" aria-hidden="true" />
                <span className="text-xs font-mono uppercase tracking-wider">Total Deposited</span>
              </div>
              <p className="text-2xl font-mono font-bold text-[#25f497]">
                ${loading ? "..." : stats?.totalDeposited || "0"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Wallet className="size-4" aria-hidden="true" />
                <span className="text-xs font-mono uppercase tracking-wider">Escrow USDC</span>
              </div>
              <p className="text-2xl font-mono font-bold text-blue-400">
                ${loading ? "..." : stats?.usdcBalance || "0"}
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-2">
              <div className="flex items-center gap-2 text-zinc-400">
                <Database className="size-4" aria-hidden="true" />
                <span className="text-xs font-mono uppercase tracking-wider">Total Pools</span>
              </div>
              <p className="text-2xl font-mono font-bold text-white">
                {loading ? "..." : (stats?.nextPoolId ? stats.nextPoolId - 1 : 0)}
              </p>
            </div>
          </div>

          {/* Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Escrow Status */}
            <div className={`rounded-2xl border p-5 space-y-3 ${
              stats?.escrowPaused 
                ? "border-red-500/30 bg-red-950/20" 
                : "border-[#25f497]/30 bg-[#25f497]/5"
            }`}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-medium text-white">Escrow Status</h3>
                {stats?.escrowPaused ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-red-500/20 text-red-400 border border-red-500/30">
                    <PauseCircle className="size-3" aria-hidden="true" />
                    Paused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-[#25f497]/20 text-[#25f497] border border-[#25f497]/30">
                    <PlayCircle className="size-3" aria-hidden="true" />
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-zinc-400">
                {stats?.escrowPaused 
                  ? "The escrow contract is paused. No new escrows can be created."
                  : "The escrow contract is operating normally."}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
              <h3 className="text-sm font-mono font-medium text-white">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <Link
                  href={`${EXPLORER}/address/${ADMIN_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
                >
                  <ExternalLink className="size-3" aria-hidden="true" />
                  View Admin Wallet
                </Link>
                <Link
                  href="/fund"
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
                >
                  <Database className="size-3" aria-hidden="true" />
                  View Fund Page
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "escrow" && (
        <div className="space-y-6">
          {/* Current Configuration */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <h3 className="text-lg font-mono font-medium text-white">Current Configuration</h3>
              <a
                href={`${EXPLORER}/address/${contracts[0].address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#25f497] hover:underline"
              >
                <span>View Contract</span>
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>

            {loading ? (
              <p className="text-sm font-mono text-zinc-500">Loading...</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Status</span>
                  <p className={`text-sm font-mono font-medium ${escrowSettings?.paused ? "text-red-400" : "text-[#25f497]"}`}>
                    {escrowSettings?.paused ? "Paused" : "Active"}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Max Amount</span>
                  <p className="text-sm font-mono text-white">${escrowSettings?.maxAmount}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Max Session</span>
                  <p className="text-sm font-mono text-white">{escrowSettings?.maxSessionDuration}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Auto-Release</span>
                  <p className="text-sm font-mono text-white">{escrowSettings?.autoReleaseWindow}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">USDC Allowed</span>
                  <p className={`text-sm font-mono font-medium ${escrowSettings?.tokenAllowed ? "text-[#25f497]" : "text-red-400"}`}>
                    {escrowSettings?.tokenAllowed ? "Yes" : "No"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Escrow Controls */}
          <div className="space-y-4">
            <h3 className="text-lg font-mono font-medium text-white">Escrow Controls</h3>
            <EscrowControls 
              isPaused={escrowSettings?.paused ?? false} 
              onRefresh={loadData}
            />
          </div>
        </div>
      )}

      {activeTab === "pools" && (
        <div className="space-y-6">
          {/* Pool Overview */}
          {loading ? (
            <p className="text-sm font-mono text-zinc-500">Loading pools...</p>
          ) : pools.length > 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 space-y-4">
              <h3 className="text-lg font-mono font-medium text-white border-b border-zinc-800 pb-4">
                Pool Overview ({pools.length} pool{pools.length !== 1 ? "s" : ""})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Total Balance</span>
                  <p className="text-lg font-mono font-bold text-white">
                    ${pools.reduce((acc, p) => acc + parseFloat(p.balance), 0).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Total Deposited</span>
                  <p className="text-lg font-mono font-bold text-[#25f497]">
                    ${pools.reduce((acc, p) => acc + parseFloat(p.totalDeposited), 0).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Total Disbursed</span>
                  <p className="text-lg font-mono font-bold text-blue-400">
                    ${pools.reduce((acc, p) => acc + parseFloat(p.totalDisbursed), 0).toFixed(2)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-mono text-zinc-500 uppercase">Active Pools</span>
                  <p className="text-lg font-mono font-bold text-white">
                    {pools.filter(p => !p.paused).length} / {pools.length}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pool Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-mono font-medium text-white">Pool Management</h3>
              <a
                href={`${EXPLORER}/address/${contracts[1].address}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-mono text-[#25f497] hover:underline"
              >
                <span>View Contract</span>
                <ExternalLink className="size-3" aria-hidden="true" />
              </a>
            </div>
            <PoolControls pools={pools} onRefresh={loadData} />
          </div>
        </div>
      )}

      {activeTab === "roles" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-mono font-medium text-white">Access Control</h3>
              <p className="text-xs font-mono text-zinc-500 mt-1">
                Manage roles for HelpEscrow and SponsorPool contracts
              </p>
            </div>
          </div>
          <RoleManagement />
        </div>
      )}

      {activeTab === "tools" && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-mono font-medium text-white">Developer Tools</h3>
            <p className="text-xs font-mono text-zinc-500 mt-1">
              Testing and development utilities
            </p>
          </div>

          {/* USDC Faucet */}
          <USDCFaucet />

          {/* Network Info */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
            <h4 className="text-sm font-mono font-medium text-white">Network Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-zinc-500">Network</span>
                <p className="text-white">Base Sepolia (Testnet)</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500">Chain ID</span>
                <p className="text-white">84532</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500">RPC URL</span>
                <p className="text-white break-all">https://sepolia.base.org</p>
              </div>
              <div className="space-y-1">
                <span className="text-zinc-500">Explorer</span>
                <a
                  href={EXPLORER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#25f497] hover:underline"
                >
                  {EXPLORER}
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-4">
            <h4 className="text-sm font-mono font-medium text-white">Quick Links</h4>
            <div className="flex flex-wrap gap-3">
              <a
                href="https://www.alchemy.com/faucets/base-sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
              >
                <ExternalLink className="size-3" aria-hidden="true" />
                Base Sepolia ETH Faucet
              </a>
              <a
                href={`${EXPLORER}/address/${ADMIN_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-mono transition-colors"
              >
                <ExternalLink className="size-3" aria-hidden="true" />
                Admin Wallet on Explorer
              </a>
              <Link
                href="/help"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#25f497]/30 bg-[#25f497]/10 hover:bg-[#25f497]/20 text-[#25f497] text-xs font-mono transition-colors"
              >
                View Help Board
              </Link>
            </div>
          </div>
        </div>
      )}

      {activeTab === "contracts" && (
        <div className="space-y-4">
          {contracts.map((contract) => (
            <div
              key={contract.address}
              className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
                    <Settings className="size-5" aria-hidden="true" />
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-medium text-white">{contract.name}</h3>
                    <button
                      type="button"
                      onClick={() => copyAddress(contract.address)}
                      className="flex items-center gap-1.5 text-xs font-mono text-zinc-400 hover:text-white transition-colors"
                    >
                      <span>{contract.address.slice(0, 10)}...{contract.address.slice(-8)}</span>
                      {copiedAddress === contract.address ? (
                        <Check className="size-3 text-[#25f497]" aria-hidden="true" />
                      ) : (
                        <Copy className="size-3" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={contract.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 text-xs font-mono transition-colors"
                  >
                    <span>View</span>
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                  <a
                    href={`${contract.explorerUrl}#writeContract`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#25f497]/30 bg-[#25f497]/10 hover:bg-[#25f497]/20 text-[#25f497] text-xs font-mono transition-colors"
                  >
                    <span>Write</span>
                    <ExternalLink className="size-3" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          ))}

          {/* API Endpoint */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 space-y-3">
            <h3 className="text-sm font-mono font-medium text-white">ABI API Endpoint</h3>
            <code className="block text-xs font-mono text-zinc-400 bg-zinc-900 p-3 rounded-xl break-all">
              GET /api/mesh/abi?contract=HelpEscrow
            </code>
            <p className="text-xs font-mono text-zinc-500">
              Available contracts: HelpEscrow, SponsorPool, HelpAttestations, MockUSDC, TipJar, ERC2771Forwarder
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
