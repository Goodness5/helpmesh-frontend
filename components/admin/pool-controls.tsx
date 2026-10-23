"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import {
  createPool,
  setPoolMaxPerRequest,
  setPoolPaused,
  setPoolRulesHash,
} from "@/lib/admin-actions"
import { addresses, EXPLORER } from "@/lib/chain/addresses"
import type { PoolInfo } from "@/lib/admin"
import {
  Plus,
  DollarSign,
  FileText,
  PauseCircle,
  PlayCircle,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Settings,
} from "lucide-react"
import type { Hex } from "viem"

interface ActionButtonProps {
  onClick: () => Promise<void>
  loading: boolean
  disabled?: boolean
  variant?: "primary" | "danger" | "secondary"
  children: React.ReactNode
}

function ActionButton({ onClick, loading, disabled, variant = "primary", children }: ActionButtonProps) {
  const baseClasses = "inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-mono text-xs font-medium transition-all min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
  const variantClasses = {
    primary: "bg-[#25f497] hover:bg-[#1ee088] text-black",
    danger: "bg-red-500 hover:bg-red-600 text-white",
    secondary: "border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white",
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading || disabled}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  )
}

interface TransactionResultProps {
  result: { success: boolean; hash?: Hex; error?: string } | null
}

function TransactionResult({ result }: TransactionResultProps) {
  if (!result) return null

  return (
    <div className={`mt-3 p-3 rounded-xl text-xs font-mono ${
      result.success 
        ? "bg-[#25f497]/10 border border-[#25f497]/30 text-[#25f497]" 
        : "bg-red-500/10 border border-red-500/30 text-red-400"
    }`}>
      <div className="flex items-center gap-2">
        {result.success ? (
          <CheckCircle2 className="size-4" aria-hidden="true" />
        ) : (
          <XCircle className="size-4" aria-hidden="true" />
        )}
        <span>{result.success ? "Transaction successful" : result.error || "Transaction failed"}</span>
      </div>
      {result.hash && (
        <a
          href={`${EXPLORER}/tx/${result.hash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 mt-2 text-zinc-400 hover:text-white"
        >
          <span>View on Explorer</span>
          <ExternalLink className="size-3" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

interface PoolControlsProps {
  pools: PoolInfo[]
  onRefresh: () => void
}

export function PoolControls({ pools, onRefresh }: PoolControlsProps) {
  const announce = useAnnounce()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; hash?: Hex; error?: string } | null>(null)
  const [expandedPool, setExpandedPool] = useState<number | null>(null)

  // Create pool form
  const [newPoolToken, setNewPoolToken] = useState<`0x${string}`>(addresses.mockUsdc)
  const [newPoolRulesHash, setNewPoolRulesHash] = useState("0x0000000000000000000000000000000000000000000000000000000000000000")
  const [newPoolMaxPerRequest, setNewPoolMaxPerRequest] = useState("25")

  // Edit pool forms
  const [editMaxPerRequest, setEditMaxPerRequest] = useState<Record<number, string>>({})
  const [editRulesHash, setEditRulesHash] = useState<Record<number, string>>({})

  async function handleAction(action: string, fn: () => Promise<{ success: boolean; hash?: Hex; error?: string }>) {
    setLoading(action)
    setResult(null)
    try {
      const res = await fn()
      setResult(res)
      if (res.success) {
        announce(`${action} completed successfully`)
        onRefresh()
      } else {
        announce(`${action} failed: ${res.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setResult({ success: false, error: message })
      announce(`${action} failed: ${message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Create New Pool */}
      <div className="rounded-2xl border border-[#25f497]/30 bg-[#25f497]/5 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Plus className="size-5 text-[#25f497]" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Create New Pool</h4>
            <p className="text-xs text-zinc-500">Create a new sponsor pool for community funding</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="new-pool-token" className="block text-xs text-zinc-500 mb-1">Token Address</label>
            <input
              id="new-pool-token"
              type="text"
              value={newPoolToken}
              onChange={(e) => setNewPoolToken(e.target.value as `0x${string}`)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="new-pool-rules" className="block text-xs text-zinc-500 mb-1">Rules Hash (bytes32)</label>
            <input
              id="new-pool-rules"
              type="text"
              value={newPoolRulesHash}
              onChange={(e) => setNewPoolRulesHash(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="new-pool-max" className="block text-xs text-zinc-500 mb-1">Max Per Request (USD)</label>
            <input
              id="new-pool-max"
              type="number"
              value={newPoolMaxPerRequest}
              onChange={(e) => setNewPoolMaxPerRequest(e.target.value)}
              placeholder="25"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <ActionButton
            onClick={() => handleAction("Create Pool", () => createPool(
              newPoolToken as `0x${string}`,
              newPoolRulesHash as Hex,
              Number(newPoolMaxPerRequest)
            ))}
            loading={loading === "Create Pool"}
            disabled={!newPoolToken || !newPoolRulesHash || !newPoolMaxPerRequest}
          >
            <Plus className="size-4" aria-hidden="true" />
            Create Pool
          </ActionButton>
        </div>
        {loading === "Create Pool" && <TransactionResult result={result} />}
      </div>

      {/* Existing Pools */}
      {pools.length === 0 ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-8 text-center">
          <p className="text-sm font-mono text-zinc-500">No pools found. Create one above.</p>
        </div>
      ) : (
        pools.map((pool) => (
          <div
            key={pool.id}
            className={`rounded-2xl border p-5 space-y-4 ${
              pool.paused ? "border-red-500/30 bg-red-950/10" : "border-zinc-800 bg-zinc-900/60"
            }`}
          >
            {/* Pool Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-[#25f497] font-mono font-bold">
                  {pool.id}
                </div>
                <div>
                  <h4 className="text-sm font-mono font-medium text-white">Pool #{pool.id}</h4>
                  <p className="text-xs font-mono text-zinc-500">Balance: ${pool.balance}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {pool.paused ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono bg-red-500/20 text-red-400">
                    <PauseCircle className="size-3" aria-hidden="true" />
                    Paused
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-mono bg-[#25f497]/20 text-[#25f497]">
                    <PlayCircle className="size-3" aria-hidden="true" />
                    Active
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setExpandedPool(expandedPool === pool.id ? null : pool.id)}
                  className="p-2 rounded-lg border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
                  aria-label={expandedPool === pool.id ? "Collapse pool settings" : "Expand pool settings"}
                >
                  <Settings className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Pool Actions */}
            {expandedPool === pool.id && (
              <div className="space-y-4 pt-4 border-t border-zinc-800">
                {/* Pause/Unpause */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-zinc-400">Pool Status</span>
                  {pool.paused ? (
                    <ActionButton
                      onClick={() => handleAction(`Unpause Pool ${pool.id}`, () => setPoolPaused(pool.id, false))}
                      loading={loading === `Unpause Pool ${pool.id}`}
                      variant="primary"
                    >
                      <PlayCircle className="size-4" aria-hidden="true" />
                      Unpause
                    </ActionButton>
                  ) : (
                    <ActionButton
                      onClick={() => handleAction(`Pause Pool ${pool.id}`, () => setPoolPaused(pool.id, true))}
                      loading={loading === `Pause Pool ${pool.id}`}
                      variant="danger"
                    >
                      <PauseCircle className="size-4" aria-hidden="true" />
                      Pause
                    </ActionButton>
                  )}
                </div>
                {(loading === `Pause Pool ${pool.id}` || loading === `Unpause Pool ${pool.id}`) && (
                  <TransactionResult result={result} />
                )}

                {/* Set Max Per Request */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">Max Per Request (USD)</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      value={editMaxPerRequest[pool.id] ?? pool.maxPerRequest}
                      onChange={(e) => setEditMaxPerRequest({ ...editMaxPerRequest, [pool.id]: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
                    />
                    <ActionButton
                      onClick={() => handleAction(`Set Max ${pool.id}`, () => setPoolMaxPerRequest(
                        pool.id,
                        Number(editMaxPerRequest[pool.id] ?? pool.maxPerRequest)
                      ))}
                      loading={loading === `Set Max ${pool.id}`}
                      variant="secondary"
                    >
                      <DollarSign className="size-4" aria-hidden="true" />
                      Update
                    </ActionButton>
                  </div>
                </div>
                {loading === `Set Max ${pool.id}` && <TransactionResult result={result} />}

                {/* Set Rules Hash */}
                <div className="space-y-2">
                  <label className="text-xs font-mono text-zinc-400">Rules Hash (bytes32)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editRulesHash[pool.id] ?? pool.rulesHash}
                      onChange={(e) => setEditRulesHash({ ...editRulesHash, [pool.id]: e.target.value })}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
                    />
                    <ActionButton
                      onClick={() => handleAction(`Set Rules ${pool.id}`, () => setPoolRulesHash(
                        pool.id,
                        (editRulesHash[pool.id] ?? pool.rulesHash) as Hex
                      ))}
                      loading={loading === `Set Rules ${pool.id}`}
                      variant="secondary"
                    >
                      <FileText className="size-4" aria-hidden="true" />
                      Update
                    </ActionButton>
                  </div>
                </div>
                {loading === `Set Rules ${pool.id}` && <TransactionResult result={result} />}
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
