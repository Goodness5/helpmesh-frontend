"use client"

import { useState, useSyncExternalStore } from "react"
import { useAccountAbstraction, type SocialLoginProvider } from "@/components/providers/privy-provider"
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

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2" />
    </svg>
  )
}

function MetaMaskFoxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.5 8.2L17.7 2 12 5.8 6.3 2 2.5 8.2l3.4 8.7L12 22l6.1-5.1 3.4-8.7zm-9.5 8.5l-4-2.4 1.2-3.1 2.8 1.5v4zm0-6.1L7.8 8.7l3-3.6 1.2 5.5zm4.8 3.7l-4 2.4v-4l2.8-1.5 1.2 3.1zm-1.8-4.9l1.2-5.5 3 3.6-4.2 1.9z" fill="#E2761B" />
    </svg>
  )
}

function RabbyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" fill="#8B94FF" />
    </svg>
  )
}

function getProviderName(walletClientType?: string, isWeb3?: boolean, user?: ReturnType<typeof useAccountAbstraction>["user"]) {
  if (user?.google?.email) return "Google Account"
  if (user?.twitter?.username) return `X (@${user.twitter.username})`
  if (!walletClientType) return isWeb3 ? "Web3 Wallet" : "Smart Account"
  const type = walletClientType.toLowerCase()
  if (type.includes("metamask")) return "MetaMask"
  if (type.includes("rabby")) return "Rabby Wallet"
  if (type.includes("coinbase")) return "Coinbase Smart Wallet"
  if (type.includes("rainbow")) return "Rainbow"
  if (type.includes("wallet_connect") || type.includes("walletconnect")) return "WalletConnect"
  if (type.includes("privy")) return "Smart Account (AA)"
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
          announce("Opening wallet connection and account abstraction sign-in.")
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
    loginWithSocial,
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
    user?.google?.email ??
    (user?.twitter?.username ? `@${user.twitter.username}` : null) ??
    user?.email?.address ??
    user?.phone?.number ??
    (address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Connected")

  function copyAddress() {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    announce("Copied wallet address.")
    setTimeout(() => setCopied(false), 2000)
  }

  function handleSocial(provider: SocialLoginProvider, label: string) {
    announce(`Opening ${label} sign in.`)
    loginWithSocial(provider)
  }

  if (!mounted || !ready) {
    return (
      <div className="rounded-3xl border border-zinc-800 bg-zinc-950/80 p-7 sm:p-9 font-mono animate-pulse">
        <p className="text-sm text-zinc-500">Initializing decentralized wallet interface...</p>
      </div>
    )
  }

  if (!authenticated) {
    return (
      <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md font-mono space-y-7 shadow-2xl">
        {/* Header Block */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-zinc-900 pb-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497] shrink-0">
              <Wallet className="size-7 stroke-[1.8]" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-medium text-white tracking-tight">
                  Wallet &amp; Account Abstraction
                </h2>
                <span className="text-[10px] text-[#25f497] bg-[#25f497]/10 px-2.5 py-0.5 rounded-full border border-[#25f497]/20 uppercase tracking-widest font-semibold">
                  Non-Custodial
                </span>
                <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2.5 py-0.5 rounded-full border border-zinc-800 uppercase tracking-widest font-semibold">
                  Base (84532)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-zinc-400">
                Connect your Web3 wallet (MetaMask, Rabby) or sign in instantly with Social &amp; Passkeys.
              </p>
            </div>
          </div>
        </div>

        {/* Action Connect Grid */}
        <div className="space-y-3">
          <span className="block text-xs uppercase tracking-widest text-zinc-400 font-medium">
            Select Your Preferred Connection Method
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs">
            {/* MetaMask */}
            <button
              type="button"
              onClick={() => {
                announce("Connecting MetaMask wallet.")
                connectWallet()
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-white font-medium transition-all duration-150 hover:scale-[1.02]"
            >
              <MetaMaskFoxIcon className="size-4 shrink-0" />
              <span>MetaMask</span>
            </button>

            {/* Rabby Wallet */}
            <button
              type="button"
              onClick={() => {
                announce("Connecting Rabby wallet.")
                connectWallet()
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-white font-medium transition-all duration-150 hover:scale-[1.02]"
            >
              <RabbyIcon className="size-4 shrink-0" />
              <span>Rabby</span>
            </button>

            {/* Google */}
            <button
              type="button"
              onClick={() => handleSocial("google", "Google")}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-white font-medium transition-all duration-150 hover:scale-[1.02]"
            >
              <GoogleIcon className="size-4 shrink-0" />
              <span>Google</span>
            </button>

            {/* X / Twitter */}
            <button
              type="button"
              onClick={() => handleSocial("twitter", "X")}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-white font-medium transition-all duration-150 hover:scale-[1.02]"
            >
              <XIcon className="size-3.5 shrink-0" />
              <span>X</span>
            </button>

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handleSocial("facebook", "Facebook")}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-850 hover:border-zinc-700 text-white font-medium transition-all duration-150 hover:scale-[1.02]"
            >
              <FacebookIcon className="size-4 shrink-0" />
              <span>Facebook</span>
            </button>

            {/* Passkey / Biometrics */}
            <button
              type="button"
              onClick={() => {
                announce("Opening Passkey biometric login.")
                login()
              }}
              className="flex items-center justify-center gap-2 px-3.5 py-3 rounded-2xl border border-[#25f497]/40 bg-[#25f497]/10 hover:bg-[#25f497]/20 text-[#25f497] font-semibold transition-all duration-150 hover:scale-[1.02]"
            >
              <KeyRound className="size-4 shrink-0" />
              <span>Passkey</span>
            </button>
          </div>
        </div>

        {/* 3 Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs pt-1">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Wallet className="size-4 text-[#25f497]" />
              <span>1. Self-Custody Web3 Wallets</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Connect MetaMask, Rabby Wallet, Coinbase Wallet, Rainbow, or any WalletConnect client directly on Base.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <Sparkles className="size-4 text-[#25f497]" />
              <span>2. Social &amp; Passkey Smart Accounts</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              Sign in via Google, X, Facebook, or FaceID/TouchID biometrics with automated, non-custodial smart accounts.
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center gap-2 text-white font-medium">
              <ShieldCheck className="size-4 text-[#25f497]" />
              <span>3. Gasless On-Chain Escrow</span>
            </div>
            <p className="text-zinc-400 leading-relaxed">
              All transactions are signed via EIP-712 and relayed on Base with zero gas fees or complexity.
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
                {isWeb3 ? "Web3 Wallet Connected" : "Autonomous Smart Account"}
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
              {isWeb3 ? "External Web3 Address (Base)" : "Smart Account Address (Base)"}
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

