"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { PrivyProvider, usePrivy, useWallets, useConnectWallet } from "@privy-io/react-auth"
import { baseSepolia } from "viem/chains"
import { accountFor } from "@/lib/chain/session"

const rawAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim()
const isRealPrivy = Boolean(
  rawAppId &&
  (rawAppId.startsWith("cl") || rawAppId.startsWith("cm")) &&
  rawAppId.length >= 20 &&
  !rawAppId.includes("demo")
)

export interface AccountAbstractionWallet {
  address: string
  walletClientType?: string
  connectorType?: string
}

export interface AccountAbstractionState {
  ready: boolean
  authenticated: boolean
  isLivePrivy: boolean
  user: {
    id: string
    email?: { address: string }
    phone?: { number: string }
    wallet?: { address: string; walletClientType?: string }
  } | null
  wallets: AccountAbstractionWallet[]
  primaryWallet: AccountAbstractionWallet | null
  connectionType: "web3_wallet" | "account_abstraction" | "device_demo" | null
  login: () => void
  connectWallet: () => void
  logout: () => Promise<void>
}

const AAContext = createContext<AccountAbstractionState | null>(null)

export function useAccountAbstraction(): AccountAbstractionState {
  const ctx = useContext(AAContext)
  if (!ctx) {
    throw new Error("useAccountAbstraction must be used within HelpmeshPrivyProvider")
  }
  return ctx
}

export function HelpmeshPrivyProvider({ children }: { children: ReactNode }) {
  if (isRealPrivy && rawAppId) {
    return (
      <PrivyProvider
        appId={rawAppId}
        config={{
          appearance: {
            theme: "dark",
            accentColor: "#25f497",
            showWalletLoginFirst: true,
            walletList: [
              "detected_wallets",
              "metamask",
              "coinbase_wallet",
              "rainbow",
              "wallet_connect",
            ],
            walletChainType: "ethereum-only",
            landingHeader: "Connect Wallet & Sign In",
            loginMessage: "Connect an existing Web3 wallet or sign in with an Account Abstraction passkey.",
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          defaultChain: baseSepolia,
          supportedChains: [baseSepolia],
          loginMethods: ["wallet", "email", "sms"],
        }}
      >
        <RealPrivyBridge>{children}</RealPrivyBridge>
      </PrivyProvider>
    )
  }

  return <MockPrivyBridge>{children}</MockPrivyBridge>
}

function RealPrivyBridge({ children }: { children: ReactNode }) {
  const privy = usePrivy()
  const { wallets } = useWallets()
  const { connectWallet } = useConnectWallet()

  const mappedWallets: AccountAbstractionWallet[] = wallets.map((w) => ({
    address: w.address,
    walletClientType: w.walletClientType,
    connectorType: w.connectorType,
  }))

  const primaryWallet: AccountAbstractionWallet | null =
    mappedWallets[0] ??
    (privy.user?.wallet
      ? {
          address: privy.user.wallet.address,
          walletClientType: privy.user.wallet.walletClientType,
          connectorType: privy.user.wallet.connectorType,
        }
      : null)

  const isEmbedded =
    primaryWallet?.walletClientType === "privy" ||
    primaryWallet?.walletClientType === "privy-v2"

  const connectionType: "web3_wallet" | "account_abstraction" | "device_demo" | null =
    privy.authenticated
      ? isEmbedded
        ? "account_abstraction"
        : "web3_wallet"
      : null

  const value: AccountAbstractionState = {
    ready: privy.ready,
    authenticated: privy.authenticated,
    isLivePrivy: true,
    user: privy.user
      ? {
          id: privy.user.id,
          email: privy.user.email ? { address: privy.user.email.address } : undefined,
          phone: privy.user.phone ? { number: privy.user.phone.number } : undefined,
          wallet: privy.user.wallet
            ? {
                address: privy.user.wallet.address,
                walletClientType: privy.user.wallet.walletClientType,
              }
            : undefined,
        }
      : null,
    wallets: mappedWallets,
    primaryWallet,
    connectionType,
    login: privy.login,
    connectWallet,
    logout: privy.logout,
  }

  return <AAContext.Provider value={value}>{children}</AAContext.Provider>
}

function MockPrivyBridge({ children }: { children: ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => {
    if (typeof window === "undefined") return false
    try {
      return localStorage.getItem("helpmesh.aa.auth") === "true"
    } catch {
      return false
    }
  })

  const [connectionType, setConnectionType] = useState<"web3_wallet" | "account_abstraction" | "device_demo" | null>(() => {
    if (typeof window === "undefined") return null
    try {
      const auth = localStorage.getItem("helpmesh.aa.auth") === "true"
      if (!auth) return null
      return (localStorage.getItem("helpmesh.aa.type") as "web3_wallet" | "account_abstraction") || "account_abstraction"
    } catch {
      return null
    }
  })

  const [deviceAddress] = useState<string>(() => {
    if (typeof window === "undefined") return ""
    try {
      return accountFor("you").address
    } catch {
      return ""
    }
  })

  const [userEmail] = useState<string>(() => {
    if (typeof window === "undefined") return "you@helpmesh.network"
    try {
      return localStorage.getItem("helpmesh.aa.email") || "you@helpmesh.network"
    } catch {
      return "you@helpmesh.network"
    }
  })

  function login() {
    setAuthenticated(true)
    setConnectionType("account_abstraction")
    try {
      localStorage.setItem("helpmesh.aa.auth", "true")
      localStorage.setItem("helpmesh.aa.type", "account_abstraction")
    } catch {}
  }

  function connectWallet() {
    setAuthenticated(true)
    setConnectionType("web3_wallet")
    try {
      localStorage.setItem("helpmesh.aa.auth", "true")
      localStorage.setItem("helpmesh.aa.type", "web3_wallet")
    } catch {}
  }

  async function logout() {
    setAuthenticated(false)
    setConnectionType(null)
    try {
      localStorage.setItem("helpmesh.aa.auth", "false")
      localStorage.removeItem("helpmesh.aa.type")
    } catch {}
  }

  const primaryWallet: AccountAbstractionWallet | null =
    authenticated && deviceAddress
      ? {
          address: deviceAddress,
          walletClientType: connectionType === "web3_wallet" ? "metamask" : "privy",
        }
      : null

  const value: AccountAbstractionState = {
    ready: true,
    authenticated,
    isLivePrivy: false,
    user: authenticated
      ? {
          id: `privy:did:device:${deviceAddress.slice(2, 10)}`,
          email: { address: userEmail },
          wallet: {
            address: deviceAddress,
            walletClientType: connectionType === "web3_wallet" ? "metamask" : "privy",
          },
        }
      : null,
    wallets: primaryWallet ? [primaryWallet] : [],
    primaryWallet,
    connectionType,
    login,
    connectWallet,
    logout,
  }

  return <AAContext.Provider value={value}>{children}</AAContext.Provider>
}
