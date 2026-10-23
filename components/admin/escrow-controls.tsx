"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import {
  pauseEscrow,
  unpauseEscrow,
  setMaxAmount,
  setMaxSessionDuration,
  setAutoReleaseWindow,
  setTokenAllowed,
  resolveDispute,
} from "@/lib/admin-actions"
import { addresses, EXPLORER } from "@/lib/chain/addresses"
import {
  PauseCircle,
  PlayCircle,
  DollarSign,
  Clock,
  Timer,
  Coins,
  Gavel,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
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

interface EscrowControlsProps {
  isPaused: boolean
  onRefresh: () => void
}

export function EscrowControls({ isPaused, onRefresh }: EscrowControlsProps) {
  const announce = useAnnounce()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; hash?: Hex; error?: string } | null>(null)

  // Form states
  const [maxAmount, setMaxAmountValue] = useState("")
  const [sessionDuration, setSessionDuration] = useState("")
  const [autoRelease, setAutoRelease] = useState("")
  const [tokenAddress, setTokenAddress] = useState<`0x${string}`>(addresses.mockUsdc)
  const [tokenAllowed, setTokenAllowedValue] = useState(true)
  const [disputeRequestId, setDisputeRequestId] = useState("")
  const [disputeHelperBps, setDisputeHelperBps] = useState("5000")

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
      {/* Pause/Unpause */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          {isPaused ? (
            <PauseCircle className="size-5 text-red-400" aria-hidden="true" />
          ) : (
            <PlayCircle className="size-5 text-[#25f497]" aria-hidden="true" />
          )}
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Contract Status</h4>
            <p className="text-xs text-zinc-500">
              {isPaused ? "Contract is paused - no new escrows can be created" : "Contract is active"}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {isPaused ? (
            <ActionButton
              onClick={() => handleAction("Unpause", unpauseEscrow)}
              loading={loading === "Unpause"}
              variant="primary"
            >
              <PlayCircle className="size-4" aria-hidden="true" />
              Unpause Contract
            </ActionButton>
          ) : (
            <ActionButton
              onClick={() => handleAction("Pause", pauseEscrow)}
              loading={loading === "Pause"}
              variant="danger"
            >
              <PauseCircle className="size-4" aria-hidden="true" />
              Pause Contract
            </ActionButton>
          )}
        </div>
        {(loading === "Pause" || loading === "Unpause") && <TransactionResult result={result} />}
      </div>

      {/* Set Max Amount */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <DollarSign className="size-5 text-[#25f497]" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Max Escrow Amount</h4>
            <p className="text-xs text-zinc-500">Maximum USDC that can be held in a single escrow</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="max-amount" className="sr-only">Max amount in USD</label>
            <input
              id="max-amount"
              type="number"
              value={maxAmount}
              onChange={(e) => setMaxAmountValue(e.target.value)}
              placeholder="e.g. 1000"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <ActionButton
            onClick={() => handleAction("Set Max Amount", () => setMaxAmount(Number(maxAmount)))}
            loading={loading === "Set Max Amount"}
            disabled={!maxAmount || Number(maxAmount) <= 0}
          >
            Set Max Amount
          </ActionButton>
        </div>
        {loading === "Set Max Amount" && <TransactionResult result={result} />}
      </div>

      {/* Set Max Session Duration */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Clock className="size-5 text-[#25f497]" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Max Session Duration</h4>
            <p className="text-xs text-zinc-500">Maximum time a help session can run (in hours)</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="session-duration" className="sr-only">Duration in hours</label>
            <input
              id="session-duration"
              type="number"
              value={sessionDuration}
              onChange={(e) => setSessionDuration(e.target.value)}
              placeholder="e.g. 24"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <ActionButton
            onClick={() => handleAction("Set Session Duration", () => setMaxSessionDuration(Number(sessionDuration)))}
            loading={loading === "Set Session Duration"}
            disabled={!sessionDuration || Number(sessionDuration) <= 0}
          >
            Set Duration
          </ActionButton>
        </div>
        {loading === "Set Session Duration" && <TransactionResult result={result} />}
      </div>

      {/* Set Auto Release Window */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Timer className="size-5 text-[#25f497]" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Auto Release Window</h4>
            <p className="text-xs text-zinc-500">Time after completion before auto-release to helper (in hours)</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label htmlFor="auto-release" className="sr-only">Auto release window in hours</label>
            <input
              id="auto-release"
              type="number"
              value={autoRelease}
              onChange={(e) => setAutoRelease(e.target.value)}
              placeholder="e.g. 48"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <ActionButton
            onClick={() => handleAction("Set Auto Release", () => setAutoReleaseWindow(Number(autoRelease)))}
            loading={loading === "Set Auto Release"}
            disabled={!autoRelease || Number(autoRelease) <= 0}
          >
            Set Window
          </ActionButton>
        </div>
        {loading === "Set Auto Release" && <TransactionResult result={result} />}
      </div>

      {/* Set Token Allowed */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Coins className="size-5 text-[#25f497]" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Token Allowlist</h4>
            <p className="text-xs text-zinc-500">Allow or disallow tokens for escrow payments</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="token-address" className="block text-xs text-zinc-500 mb-1">Token Address</label>
            <input
              id="token-address"
              type="text"
              value={tokenAddress}
              onChange={(e) => setTokenAddress(e.target.value as `0x${string}`)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={tokenAllowed}
                onChange={() => setTokenAllowedValue(true)}
                className="accent-[#25f497]"
              />
              <span className="text-sm text-zinc-300">Allow</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={!tokenAllowed}
                onChange={() => setTokenAllowedValue(false)}
                className="accent-[#25f497]"
              />
              <span className="text-sm text-zinc-300">Disallow</span>
            </label>
          </div>
          <ActionButton
            onClick={() => handleAction("Set Token", () => setTokenAllowed(tokenAddress, tokenAllowed))}
            loading={loading === "Set Token"}
            disabled={!tokenAddress}
          >
            {tokenAllowed ? "Allow Token" : "Disallow Token"}
          </ActionButton>
        </div>
        {loading === "Set Token" && <TransactionResult result={result} />}
      </div>

      {/* Resolve Dispute */}
      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-950/10 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Gavel className="size-5 text-yellow-400" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Resolve Dispute</h4>
            <p className="text-xs text-zinc-500">Arbitrate a disputed escrow (requires ARBITER role)</p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label htmlFor="dispute-request-id" className="block text-xs text-zinc-500 mb-1">Request ID (bytes32)</label>
            <input
              id="dispute-request-id"
              type="text"
              value={disputeRequestId}
              onChange={(e) => setDisputeRequestId(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <div>
            <label htmlFor="dispute-helper-bps" className="block text-xs text-zinc-500 mb-1">
              Helper Share (basis points, e.g. 5000 = 50%)
            </label>
            <input
              id="dispute-helper-bps"
              type="number"
              value={disputeHelperBps}
              onChange={(e) => setDisputeHelperBps(e.target.value)}
              placeholder="5000"
              min="0"
              max="10000"
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
          <ActionButton
            onClick={() => handleAction("Resolve Dispute", () => resolveDispute(disputeRequestId as Hex, Number(disputeHelperBps)))}
            loading={loading === "Resolve Dispute"}
            disabled={!disputeRequestId || !disputeHelperBps}
            variant="secondary"
          >
            <Gavel className="size-4" aria-hidden="true" />
            Resolve Dispute
          </ActionButton>
        </div>
        {loading === "Resolve Dispute" && <TransactionResult result={result} />}
      </div>
    </div>
  )
}
