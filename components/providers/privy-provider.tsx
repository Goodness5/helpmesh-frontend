"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { PrivyProvider, usePrivy, useWallets } from "@privy-io/react-auth"
import { baseSepolia } from "viem/chains"
import { accountFor } from "@/lib/chain/session"

const rawAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim()
const isRealPrivy = Boolean(
  rawAppId &&
  (rawAppId.startsWith("cl") || rawAppId.startsWith("cm")) &&
  rawAppId.length >= 20 &&
  !rawAppId.includes("demo")
)

export interface AccountAbstractionState {
  ready: boolean
  authenticated: boolean
  isLivePrivy: boolean
  user: {
    id: string
    email?: { address: string }
    phone?: { number: string }
    wallet?: { address: string }
  } | null
  wallets: Array<{ address: string }>
  login: () => void
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
            showWalletLoginFirst: false,
          },
          embeddedWallets: {
            ethereum: {
              createOnLogin: "users-without-wallets",
            },
          },
          defaultChain: baseSepolia,
          supportedChains: [baseSepolia],
          loginMethods: ["email", "wallet", "sms"],
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

  const value: AccountAbstractionState = {
    ready: privy.ready,
    authenticated: privy.authenticated,
    isLivePrivy: true,
    user: privy.user
      ? {
          id: privy.user.id,
          email: privy.user.email ? { address: privy.user.email.address } : undefined,
          phone: privy.user.phone ? { number: privy.user.phone.number } : undefined,
          wallet: privy.user.wallet ? { address: privy.user.wallet.address } : undefined,
        }
      : null,
    wallets: wallets.map((w) => ({ address: w.address })),
    login: privy.login,
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
    try {
      localStorage.setItem("helpmesh.aa.auth", "true")
    } catch {}
  }

  async function logout() {
    setAuthenticated(false)
    try {
      localStorage.setItem("helpmesh.aa.auth", "false")
    } catch {}
  }

  const value: AccountAbstractionState = {
    ready: true,
    authenticated,
    isLivePrivy: false,
    user: authenticated
      ? {
          id: `privy:did:device:${deviceAddress.slice(2, 10)}`,
          email: { address: userEmail },
          wallet: { address: deviceAddress },
        }
      : null,
    wallets: authenticated && deviceAddress ? [{ address: deviceAddress }] : [],
    login,
    logout,
  }

  return <AAContext.Provider value={value}>{children}</AAContext.Provider>
}
