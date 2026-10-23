"use client"

import { useState, useSyncExternalStore } from "react"
import { useAccountAbstraction } from "@/components/providers/privy-provider"
import { useAnnounce } from "@/components/announce"
import {
  Mail,
  LogOut,
  Copy,
  Check,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react"

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function getProviderName(walletClientType?: string, isWeb3?: boolean, user?: ReturnType<typeof useAccountAbstraction>["user"]) {
  if (user?.email?.address) return "Email Account"
  if (!walletClientType) return isWeb3 ? "Web3 Wallet" : "Smart Account"
  const type = walletClientType.toLowerCase()
  if (type.includes("privy")) return "Smart Account"
  return "Email Account"
}

export function PrivyAuthButton() {
  const { ready, authenticated, login, wallets, primaryWallet, user } = useAccountAbstraction()
  const announce = useAnnounce()
  const mounted = useIsMounted()

  if (!mounted || !ready) {
    return (
      <div className="h-8 w-28 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" aria-label="Loading authentication" />
    )
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => {
          announce("Opening email sign-in.")
          login()
        }}
        aria-label="Sign in with email"
        className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-4 py-1.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] shadow-[0_0_16px_rgba(37,244,151,0.2)]"
      >
        <Mail className="size-3.5" aria-hidden="true" />
        <span>Sign In</span>
      </button>
    )
  }

  const active = primaryWallet ?? wallets[0]
  const address = active?.address
  const displayEmail = user?.email?.address ? user.email.address.split("@")[0] : null
  const displayAddress = displayEmail || (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected")

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/80 font-mono text-xs" role="status" aria-label={`Signed in as ${displayAddress}`}>
      <span className="size-2 rounded-full bg-[#25f497] animate-pulse" aria-hidden="true" />
      <span className="text-[#25f497] text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#25f497]/10">
        Signed In
      </span>
      <span className="text-zinc-200">{displayAddress}</span>
    </div>
  )
}

export function PrivyAccountCard() {
  const {
    ready,
    authenticated,
    login,
    logout,
    user,
    wallets,
    primaryWallet,
    connectionType,
  } = useAccountAbstraction()
  const announce = useAnnounce()
  const [copied, setCopied] = useState(false)
  const mounted = useIsMounted()

  const active = primaryWallet ?? wallets[0]
  const address = active?.address
  const isWeb3 = connectionType === "web3_wallet"
  const providerLabel = getProviderName(active?.walletClientType, isWeb3, user)

  const userIdentifier =
    user?.email?.address ??
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected")

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    announce("Copied wallet address to clipboard.")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!mounted || !ready) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7 sm:p-9 font-mono animate-pulse" role="status" aria-label="Loading account information">
        <p className="text-sm text-zinc-500">Initializing secure wallet...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md font-mono space-y-7 shadow-2xl">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497] shrink-0" aria-hidden="true">
              <Mail className="size-7 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                  Sign In with Email
                </h2>
                <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest font-semibold">
                  Secure
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Enter your email to sign in. We&apos;ll create a secure wallet for you automatically.
              </p>
            </div>
          </div>
        </div>

        {/* Sign In Button */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => {
              announce("Opening email sign-in dialog.")
              login()
            }}
            aria-label="Sign in with your email address"
            className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl border border-[#25f497]/40 bg-[#25f497]/10 hover:bg-[#25f497]/20 text-[#25f497] font-semibold text-base transition-all duration-150 hover:scale-[1.01] focus:ring-2 focus:ring-[#25f497] focus:ring-offset-2 focus:ring-offset-black"
          >
            <Mail className="size-5" aria-hidden="true" />
            <span>Continue with Email</span>
          </button>

          <p className="text-xs text-zinc-500 text-center">
            No password required. We&apos;ll send you a secure login link.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Mail className="size-4 text-[#25f497]" aria-hidden="true" />
              <span>Email Login</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Sign in with any email address. No passwords, no complexity.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Sparkles className="size-4 text-[#25f497]" aria-hidden="true" />
              <span>Auto Wallet</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              A secure blockchain wallet is created for you automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="size-4 text-[#25f497]" aria-hidden="true" />
              <span>Zero Fees</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              All transactions are gasless. No crypto knowledge needed.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md font-mono space-y-6 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-[#25f497]/15 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <ShieldCheck className="size-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white tracking-tight">
                {providerLabel}
              </h2>
              <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest flex items-center gap-1 font-semibold">
                <Sparkles className="size-2.5" aria-hidden="true" />
                <span>Active</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Signed in as: <span className="text-white font-medium">{userIdentifier}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            announce("Signed out successfully.")
            void logout()
          }}
          aria-label="Sign out of your account"
          className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-medium px-4 py-2 rounded-full text-xs transition-colors self-start sm:self-auto min-h-[44px] min-w-[44px]"
        >
          <LogOut className="size-3.5 text-red-400" aria-hidden="true" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Account Details Box */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest block">
              Your Wallet Address (Base)
            </span>
            <span className="text-[11px] text-[#25f497] font-semibold bg-[#25f497]/10 px-2 py-0.5 rounded">
              Chain ID 84532
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-zinc-200 break-all select-all font-mono" aria-label={`Wallet address: ${address}`}>
              {address ?? "Loading address..."}
            </span>

            {address && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyAddress}
                  aria-label={copied ? "Address copied" : "Copy wallet address"}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors min-h-[44px]"
                >
                  {copied ? <Check className="size-3.5 text-[#25f497]" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <a
                  href={`https://sepolia.basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="View address on BaseScan (opens in new tab)"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors min-h-[44px]"
                >
                  <span>BaseScan</span>
                  <ArrowUpRight className="size-3.5" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <User className="size-3 text-[#25f497]" aria-hidden="true" />
            <span>ID: {user?.id.slice(0, 16)}...</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#25f497]">
            <span>Gasless Transactions</span>
          </span>
        </div>
      </div>
    </div>
  )
}

