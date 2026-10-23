"use client"

import { useState } from "react"
import { useAccountAbstraction } from "@/components/providers/privy-provider"
import { useAnnounce } from "@/components/announce"
import {
  Wallet,
  LogOut,
  Copy,
  Check,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  User,
  KeyRound,
} from "lucide-react"

export function PrivyAuthButton() {
  const { ready, authenticated, login, user, wallets } = useAccountAbstraction()
  const announce = useAnnounce()

  if (!ready) {
    return (
      <div className="h-8 w-24 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
    )
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => {
          announce("Opening Privy account abstraction login.")
          login()
        }}
        className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-3.5 py-1.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] shadow-[0_0_16px_rgba(37,244,151,0.2)]"
      >
        <Wallet className="size-3.5" />
        <span>Connect (Privy)</span>
      </button>
    )
  }

  const primaryWallet = wallets[0] ?? user?.wallet
  const address = primaryWallet?.address
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected"

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/80 font-mono text-xs">
      <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
      <span className="text-zinc-200">{displayAddress}</span>
    </div>
  )
}

export function PrivyAccountCard() {
  const { ready, authenticated, login, logout, user, wallets, isLivePrivy } = useAccountAbstraction()
  const announce = useAnnounce()
  const [copied, setCopied] = useState(false)

  const primaryWallet = wallets[0] ?? user?.wallet
  const address = primaryWallet?.address
  const userIdentifier =
    user?.email?.address ??
    user?.phone?.number ??
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Guest")

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    announce("Copied wallet address.")
    setTimeout(() => setCopied(false), 2000)
  }

  if (!ready) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7 sm:p-9 font-mono animate-pulse">
        <p className="text-sm text-zinc-500">Initializing Privy Account Abstraction...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md font-mono space-y-6 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-900 pb-5">
          <div className="flex items-center gap-3">
            <div className="size-12 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <Wallet className="size-6 stroke-[1.8]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-medium text-white tracking-tight">
                  Account Abstraction (Privy)
                </h2>
                <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest">
                  {isLivePrivy ? "Privy Live" : "Embedded AA"}
                </span>
              </div>
              <p className="text-xs text-zinc-500">
                Embedded smart wallets · No browser extensions or seed phrases
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              announce("Opening Privy embedded wallet connect flow.")
              login()
            }}
            className="inline-flex items-center gap-2.5 bg-[#25f497] hover:bg-[#1ee088] text-black font-semibold px-6 py-3 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] shadow-[0_0_24px_rgba(37,244,151,0.25)] self-start sm:self-auto"
          >
            <KeyRound className="size-4" />
            <span>Login / Connect Wallet</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1.5">
            <strong className="text-white block font-medium">1. Instant Passkey &amp; Email</strong>
            <p className="text-zinc-400">
              Sign in with biometric FaceID/TouchID or an email magic link. An embedded wallet is provisioned automatically.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1.5">
            <strong className="text-white block font-medium">2. Gasless Execution</strong>
            <p className="text-zinc-400">
              Transactions are signed via ERC-712 and relayed through the Base Sepolia forwarder with zero gas token requirements.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-1.5">
            <strong className="text-white block font-medium">3. Full Self-Custody</strong>
            <p className="text-zinc-400">
              You own your embedded wallet keys. Export or connect an existing Web3 wallet at any time.
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
          <div className="size-12 rounded-2xl bg-[#25f497]/15 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
            <ShieldCheck className="size-6 stroke-[1.8]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-medium text-white tracking-tight">
                Privy Embedded Wallet
              </h2>
              <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="size-2.5" />
                <span>Connected</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Authenticated via <span className="text-white font-medium">{userIdentifier}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            announce("Disconnected Privy wallet.")
            void logout()
          }}
          className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-300 font-medium px-4 py-2 rounded-full text-xs transition-colors self-start sm:self-auto"
        >
          <LogOut className="size-3.5 text-red-400" />
          <span>Disconnect</span>
        </button>
      </div>

      {/* Account Details Box */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 space-y-3">
          <span className="text-xs text-zinc-500 uppercase tracking-widest block">
            Embedded Account Address (Base Sepolia)
          </span>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs sm:text-sm text-zinc-200 break-all select-all font-mono">
              {address ?? "Loading address..."}
            </span>

            {address && (
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={copyAddress}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                >
                  {copied ? <Check className="size-3.5 text-[#25f497]" /> : <Copy className="size-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <a
                  href={`https://sepolia.basescan.org/address/${address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs transition-colors"
                >
                  <span>BaseScan</span>
                  <ArrowUpRight className="size-3.5" />
                </a>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <User className="size-3 text-[#25f497]" />
            <span>ID: {user?.id.slice(0, 16)}...</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[#25f497]">
            <span>Base Sepolia (84532)</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800">
            <span>Non-Custodial Account Abstraction</span>
          </span>
        </div>
      </div>
    </div>
  )
}
