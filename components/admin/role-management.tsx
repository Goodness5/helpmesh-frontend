"use client"

import { useState, useEffect } from "react"
import { useAnnounce } from "@/components/announce"
import {
  grantEscrowRole,
  revokeEscrowRole,
  grantPoolRole,
  revokePoolRole,
  fetchEscrowRoles,
  hasEscrowRole,
  hasPoolRole,
} from "@/lib/admin-actions"
import { EXPLORER } from "@/lib/chain/addresses"
import {
  Shield,
  UserPlus,
  UserMinus,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Check,
  X,
} from "lucide-react"
import type { Hex, Address } from "viem"

interface RoleInfo {
  name: string
  hash: Hex
  description: string
}

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

export function RoleManagement() {
  const announce = useAnnounce()
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<{ success: boolean; hash?: Hex; error?: string } | null>(null)
  const [roles, setRoles] = useState<Record<string, Hex>>({})
  const [loadingRoles, setLoadingRoles] = useState(true)

  // Form states
  const [selectedContract, setSelectedContract] = useState<"escrow" | "pool">("escrow")
  const [selectedRole, setSelectedRole] = useState("")
  const [targetAddress, setTargetAddress] = useState("")
  const [action, setAction] = useState<"grant" | "revoke">("grant")

  // Role check
  const [checkAddress, setCheckAddress] = useState("")
  const [checkRole, setCheckRole] = useState("")
  const [checkContract, setCheckContract] = useState<"escrow" | "pool">("escrow")
  const [roleCheckResult, setRoleCheckResult] = useState<boolean | null>(null)
  const [checkingRole, setCheckingRole] = useState(false)

  useEffect(() => {
    async function loadRoles() {
      try {
        const escrowRoles = await fetchEscrowRoles()
        setRoles(escrowRoles)
      } catch (error) {
        console.error("Failed to fetch roles:", error)
      } finally {
        setLoadingRoles(false)
      }
    }
    loadRoles()
  }, [])

  const escrowRoles: RoleInfo[] = [
    { name: "DEFAULT_ADMIN", hash: roles.DEFAULT_ADMIN || "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, description: "Full admin access" },
    { name: "ARBITER", hash: roles.ARBITER || "0x" as Hex, description: "Can resolve disputes" },
    { name: "ELIGIBILITY_SIGNER", hash: roles.ELIGIBILITY_SIGNER || "0x" as Hex, description: "Can sign eligibility vouchers" },
    { name: "OPERATOR", hash: roles.OPERATOR || "0x" as Hex, description: "Can perform operational tasks" },
    { name: "PAUSER", hash: roles.PAUSER || "0x" as Hex, description: "Can pause/unpause contract" },
  ]

  const poolRoles: RoleInfo[] = [
    { name: "DEFAULT_ADMIN", hash: "0x0000000000000000000000000000000000000000000000000000000000000000" as Hex, description: "Full admin access" },
  ]

  const currentRoles = selectedContract === "escrow" ? escrowRoles : poolRoles

  async function handleAction(actionName: string, fn: () => Promise<{ success: boolean; hash?: Hex; error?: string }>) {
    setLoading(actionName)
    setResult(null)
    try {
      const res = await fn()
      setResult(res)
      if (res.success) {
        announce(`${actionName} completed successfully`)
      } else {
        announce(`${actionName} failed: ${res.error}`)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      setResult({ success: false, error: message })
      announce(`${actionName} failed: ${message}`)
    } finally {
      setLoading(null)
    }
  }

  async function handleRoleAction() {
    if (!selectedRole || !targetAddress) return

    const roleHash = currentRoles.find(r => r.name === selectedRole)?.hash
    if (!roleHash || roleHash === "0x") {
      setResult({ success: false, error: "Invalid role selected" })
      return
    }

    const actionFn = action === "grant"
      ? (selectedContract === "escrow" 
          ? () => grantEscrowRole(roleHash, targetAddress as Address)
          : () => grantPoolRole(roleHash, targetAddress as Address))
      : (selectedContract === "escrow"
          ? () => revokeEscrowRole(roleHash, targetAddress as Address)
          : () => revokePoolRole(roleHash, targetAddress as Address))

    await handleAction(`${action === "grant" ? "Grant" : "Revoke"} ${selectedRole}`, actionFn)
  }

  async function handleCheckRole() {
    if (!checkAddress || !checkRole) return

    setCheckingRole(true)
    setRoleCheckResult(null)

    try {
      const roleHash = (checkContract === "escrow" ? escrowRoles : poolRoles)
        .find(r => r.name === checkRole)?.hash

      if (!roleHash || roleHash === "0x") {
        announce("Invalid role selected")
        return
      }

      const hasRole = checkContract === "escrow"
        ? await hasEscrowRole(roleHash, checkAddress as Address)
        : await hasPoolRole(roleHash, checkAddress as Address)

      setRoleCheckResult(hasRole)
      announce(hasRole ? `Address has ${checkRole} role` : `Address does not have ${checkRole} role`)
    } catch (error) {
      console.error("Role check failed:", error)
      announce("Failed to check role")
    } finally {
      setCheckingRole(false)
    }
  }

  if (loadingRoles) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="size-8 text-[#25f497] animate-spin" aria-hidden="true" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Grant/Revoke Role */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-[#25f497]" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Grant or Revoke Role</h4>
            <p className="text-xs text-zinc-500">Manage access control roles on contracts</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Contract Selection */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Contract</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedContract("escrow")}
                className={`flex-1 px-4 py-2.5 rounded-xl font-mono text-xs transition-colors min-h-[44px] ${
                  selectedContract === "escrow"
                    ? "bg-[#25f497] text-black font-semibold"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                HelpEscrow
              </button>
              <button
                type="button"
                onClick={() => setSelectedContract("pool")}
                className={`flex-1 px-4 py-2.5 rounded-xl font-mono text-xs transition-colors min-h-[44px] ${
                  selectedContract === "pool"
                    ? "bg-[#25f497] text-black font-semibold"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                SponsorPool
              </button>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Action</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAction("grant")}
                className={`flex-1 px-4 py-2.5 rounded-xl font-mono text-xs transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
                  action === "grant"
                    ? "bg-[#25f497] text-black font-semibold"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <UserPlus className="size-4" aria-hidden="true" />
                Grant
              </button>
              <button
                type="button"
                onClick={() => setAction("revoke")}
                className={`flex-1 px-4 py-2.5 rounded-xl font-mono text-xs transition-colors min-h-[44px] flex items-center justify-center gap-2 ${
                  action === "revoke"
                    ? "bg-red-500 text-white font-semibold"
                    : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <UserMinus className="size-4" aria-hidden="true" />
                Revoke
              </button>
            </div>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-xs text-zinc-500 mb-2">Role</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {currentRoles.map((role) => (
              <button
                key={role.name}
                type="button"
                onClick={() => setSelectedRole(role.name)}
                disabled={role.hash === "0x"}
                className={`px-3 py-2 rounded-xl font-mono text-xs transition-colors min-h-[44px] text-left ${
                  selectedRole === role.name
                    ? "bg-zinc-700 text-white border border-zinc-600"
                    : role.hash === "0x"
                      ? "border border-zinc-800 bg-zinc-900 text-zinc-600 cursor-not-allowed"
                      : "border border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                }`}
              >
                <span className="block font-medium">{role.name}</span>
                <span className="block text-[10px] text-zinc-500 mt-0.5">{role.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Target Address */}
        <div>
          <label htmlFor="target-address" className="block text-xs text-zinc-500 mb-2">Target Address</label>
          <input
            id="target-address"
            type="text"
            value={targetAddress}
            onChange={(e) => setTargetAddress(e.target.value)}
            placeholder="0x..."
            className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
          />
        </div>

        <ActionButton
          onClick={handleRoleAction}
          loading={loading !== null}
          disabled={!selectedRole || !targetAddress}
          variant={action === "grant" ? "primary" : "danger"}
        >
          {action === "grant" ? (
            <>
              <UserPlus className="size-4" aria-hidden="true" />
              Grant {selectedRole || "Role"}
            </>
          ) : (
            <>
              <UserMinus className="size-4" aria-hidden="true" />
              Revoke {selectedRole || "Role"}
            </>
          )}
        </ActionButton>

        <TransactionResult result={result} />
      </div>

      {/* Check Role */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-4">
        <div className="flex items-center gap-3">
          <Shield className="size-5 text-blue-400" aria-hidden="true" />
          <div>
            <h4 className="text-sm font-mono font-medium text-white">Check Role</h4>
            <p className="text-xs text-zinc-500">Verify if an address has a specific role</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Contract</label>
            <select
              value={checkContract}
              onChange={(e) => setCheckContract(e.target.value as "escrow" | "pool")}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            >
              <option value="escrow">HelpEscrow</option>
              <option value="pool">SponsorPool</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Role</label>
            <select
              value={checkRole}
              onChange={(e) => setCheckRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            >
              <option value="">Select role...</option>
              {(checkContract === "escrow" ? escrowRoles : poolRoles).map((role) => (
                <option key={role.name} value={role.name} disabled={role.hash === "0x"}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Address</label>
            <input
              type="text"
              value={checkAddress}
              onChange={(e) => setCheckAddress(e.target.value)}
              placeholder="0x..."
              className="w-full px-4 py-2.5 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono text-sm focus:border-[#25f497] focus:outline-none min-h-[44px]"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <ActionButton
            onClick={handleCheckRole}
            loading={checkingRole}
            disabled={!checkAddress || !checkRole}
            variant="secondary"
          >
            Check Role
          </ActionButton>

          {roleCheckResult !== null && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${
              roleCheckResult 
                ? "bg-[#25f497]/10 text-[#25f497]" 
                : "bg-red-500/10 text-red-400"
            }`}>
              {roleCheckResult ? (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  <span className="text-xs font-mono">Has Role</span>
                </>
              ) : (
                <>
                  <X className="size-4" aria-hidden="true" />
                  <span className="text-xs font-mono">No Role</span>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Role Hashes Reference */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 space-y-3">
        <h4 className="text-sm font-mono font-medium text-white">Role Hashes (Reference)</h4>
        <div className="space-y-2 text-xs font-mono">
          {escrowRoles.map((role) => (
            <div key={role.name} className="flex items-center justify-between py-1 border-b border-zinc-800 last:border-0">
              <span className="text-zinc-400">{role.name}</span>
              <span className="text-zinc-600 break-all max-w-[300px] text-right">
                {role.hash === "0x" ? "Loading..." : `${role.hash.slice(0, 10)}...${role.hash.slice(-8)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
