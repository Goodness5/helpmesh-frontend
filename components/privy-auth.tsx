"use client"

import { useState, useSyncExternalStore } from "react"
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

function useIsMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function getProviderName(walletClientType?: string, isWeb3?: boolean) {
  if (!walletClientType) return isWeb3 ? "Web3 Wallet" : "Embedded Smart Account"
  const type = walletClientType.toLowerCase()
  if (type.includes("metamask")) return "MetaMask"
  if (type.includes("coinbase")) return "Coinbase Smart Wallet"
  if (type.includes("rainbow")) return "Rainbow"
  if (type.includes("wallet_connect") || type.includes("walletconnect")) return "WalletConnect"
  if (type.includes("privy")) return "Privy Embedded Account (AA)"
  return walletClientType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

export function PrivyAuthButton() {
  const { ready, authenticated, login, wallets, primaryWallet, connectionType } = useAccountAbstraction()
  const announce = useAnnounce()
  const mounted = useIsMounted()

  if (!mounted || !ready) {
    return (
      <div className="h-8 w-28 rounded-full bg-zinc-900 border border-zinc-800 animate-pulse" />
    )
  }

  if (!authenticated) {
    return (
      <button
        type="button"
        onClick={() => {
          announce("Opening Web3 wallet connect and account abstraction login.")
          login()
        }}
        className="inline-flex items-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-4 py-1.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] shadow-[0_0_16px_rgba(37,244,151,0.2)]"
      >
        <Wallet className="size-3.5" />
        <span>Connect Wallet</span>
      </button>
    )
  }

  const active = primaryWallet ?? wallets[0]
  const address = active?.address
  const displayAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected"
  const isWeb3 = connectionType === "web3_wallet"

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-950/80 font-mono text-xs">
      <span className="size-2 rounded-full bg-[#25f497] animate-pulse" />
      <span className="text-[#25f497] text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#25f497]/10">
        {isWeb3 ? "Web3" : "AA"}
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
    connectWallet,
    logout,
    user,
    wallets,
    primaryWallet,
    connectionType,
    isLivePrivy,
  } = useAccountAbstraction()
  const announce = useAnnounce()
  const [copied, setCopied] = useState(false)
  const mounted = useIsMounted()

  const active = primaryWallet ?? wallets[0]
  const address = active?.address
  const isWeb3 = connectionType === "web3_wallet"
  const providerLabel = getProviderName(active?.walletClientType, isWeb3)

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

  if (!mounted || !ready) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7 sm:p-9 font-mono animate-pulse">
        <p className="text-sm text-zinc-500">Initializing Web3 Wallet &amp; Account Abstraction...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md font-mono space-y-6 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497] shrink-0">
              <Wallet className="size-7 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                  Web3 Wallet &amp; Account Abstraction
                </h2>
                <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest font-semibold">
                  {isLivePrivy ? "Privy Live" : "Embedded AA"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Connect your existing Web3 wallet or log in with seedless Account Abstraction (passkey / email).
              </p>
            </div>
          </div>

          {/* Dual Action Buttons: Web3 Wallet Connect vs AA Passkey */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                announce("Opening Web3 wallet connector.")
                connectWallet()
              }}
              className="inline-flex items-center gap-2.5 bg-[#25f497] hover:bg-[#1ee088] text-black font-semibold px-5 py-2.5 rounded-full text-xs transition-all duration-150 hover:scale-[1.02] shadow-[0_0_20px_rgba(37,244,151,0.25)]"
            >
              <Wallet className="size-4" />
              <span>Connect Web3 Wallet</span>
            </button>

            <button
              type="button"
              onClick={() => {
                announce("Opening Account Abstraction passkey & email login.")
                login()
              }}
              className="inline-flex items-center gap-2 border border-zinc-700 bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-medium px-5 py-2.5 rounded-full text-xs transition-colors"
            >
              <KeyRound className="size-4 text-[#25f497]" />
              <span>Passkey / Email AA</span>
            </button>
          </div>
        </div>

        {/* 3 Value Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Wallet className="size-4 text-[#25f497]" />
              <span>1. Web3 Wallet Connect</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Connect MetaMask, Coinbase Wallet, Rainbow, or any WalletConnect mobile wallet directly on Base Sepolia.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <KeyRound className="size-4 text-[#25f497]" />
              <span>2. Account Abstraction (AA)</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              No seed phrases or extensions. Sign in with biometric FaceID/TouchID or email magic link with an auto-provisioned smart account.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Sparkles className="size-4 text-[#25f497]" />
              <span>3. Gasless Relayed Escrow</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Transactions are signed via EIP-712 and relayed through the Base Sepolia forwarder with zero gas tokens needed.
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
                {isWeb3 ? "Web3 Wallet Connected" : "Account Abstraction Smart Account"}
              </h2>
              <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest flex items-center gap-1 font-semibold">
                <Sparkles className="size-2.5" />
                <span>{providerLabel}</span>
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              Authenticated session: <span className="text-white font-medium">{userIdentifier}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            announce("Disconnected wallet.")
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
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500 uppercase tracking-widest block">
              {isWeb3 ? "External Web3 Address (Base Sepolia)" : "Smart Account Address (Base Sepolia)"}
            </span>
            <span className="text-[11px] text-[#25f497] font-semibold bg-[#25f497]/10 px-2 py-0.5 rounded">
              Chain ID 84532
            </span>
          </div>

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
            <span>{isWeb3 ? "EIP-1193 Web3 Connection" : "ERC-4337 Account Abstraction"}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300">
            <span>Gasless EIP-712 Relayer Active</span>
          </span>
        </div>
      </div>
    </div>
  )
}

