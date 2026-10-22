"use client"

import { useState, useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { faucet, useDemo } from "@/components/demo"
import { PageTitle } from "@/components/page-title"
import { addresses, EXPLORER } from "@/lib/chain/addresses"
import { liveChain } from "@/lib/chain/plain"
import { accountFor } from "@/lib/chain/session"
import { formatTestMoney } from "@/lib/model"

function yourAddress() {
  if (!liveChain || typeof window === "undefined") return ""
  return accountFor("you").address
}

export function WalletScreen() {
  const demo = useDemo()
  const announce = useAnnounce()
  const address = useSyncExternalStore(() => () => {}, yourAddress, () => "")
  const [copied, setCopied] = useState(false)

  const loading = !demo.ready || (liveChain && !demo.funded)

  function copyAddress() {
    if (!address) return
    if (navigator.clipboard) {
      navigator.clipboard.writeText(address).then(() => {
        setCopied(true)
        announce("Address copied to clipboard.")
        setTimeout(() => setCopied(false), 2000)
      })
    }
  }

  return (
    <>
      <div style={{ marginTop: "1.5rem" }}>
        <p className="kicker">
          <span className="status-dot" aria-hidden="true" />
          <span>{liveChain ? "Base Sepolia Escrow" : "Local Browser Chain"}</span>
        </p>
        <PageTitle>Your money</PageTitle>

        <div className="card" style={{ marginTop: "1rem", marginBottom: "1.5rem", position: "relative", overflow: "hidden" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
            <span className="steps">Available Balance</span>
            <span className="status-pill">
              <span className="status-dot" aria-hidden="true" />
              <span>{liveChain ? "Test USDC" : "Demo Credits"}</span>
            </span>
          </div>

          {loading ? (
            <p style={{ fontSize: "2rem", margin: "0.5rem 0", color: "var(--muted)" }}>Loading balance...</p>
          ) : (
            <div className="balance" style={{ margin: "0.5rem 0 1rem", border: "none", padding: "0", background: "transparent", boxShadow: "none" }}>
              {formatTestMoney(demo.balance)}
            </div>
          )}

          <p className="lede" style={{ fontSize: "0.95rem", marginBottom: "1.25rem" }}>
            {liveChain
              ? "Test money on Base Sepolia. It has no cash value. Amounts you commit are held in an autonomous smart contract escrow until you confirm help is complete."
              : "Demo chain. This balance is managed locally within your browser and does not touch an external network."}
          </p>

          <div className="row">
            {liveChain && (
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  announce("Requesting test USDC from faucet...")
                  void faucet().then((message) => announce(message))
                }}
              >
                <span>Add test money</span>
                <span className="btn-arrow-badge" aria-hidden="true">+</span>
              </button>
            )}
            <button
              type="button"
              className="btn"
              onClick={() => announce("Test money cannot be cashed out.")}
            >
              Cash out
            </button>
          </div>
        </div>

        <h2>Activity &amp; Escrow History</h2>
        {demo.activity.length === 0 ? (
          <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: "2rem" }}>
            <p style={{ margin: 0 }}>No transaction activity recorded yet.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: "1.25rem 1.5rem" }}>
            <ul className="timeline" style={{ margin: 0 }}>
              {demo.activity.map((item, index) => (
                <li key={`${item}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="advanced card" style={{ marginTop: "2rem" }}>
          <summary>Advanced Web3 Details</summary>
          <div style={{ paddingTop: "0.75rem", display: "grid", gap: "0.6rem" }}>
            {liveChain ? (
              <>
                <p style={{ margin: 0, fontSize: "0.9rem" }}>
                  <strong>Network:</strong> Base Sepolia Testnet (Chain ID: 84532)
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "0.9rem" }}>Account:</strong>
                  <span className="address">{address || "Loading..."}</span>
                  {address && (
                    <button
                      type="button"
                      className="btn"
                      style={{ minHeight: "1.8rem", padding: "0.2rem 0.65rem", fontSize: "0.75rem" }}
                      onClick={copyAddress}
                      aria-label="Copy wallet address"
                    >
                      {copied ? "Copied" : "Copy"}
                    </button>
                  )}
                </div>
                <p style={{ margin: "0.5rem 0 0" }}>
                  <a
                    href={`${EXPLORER}/address/${addresses.mockUsdc}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "var(--signal)", fontSize: "0.875rem", textDecoration: "underline" }}
                  >
                    View Mock USDC Contract on BaseScan ↗
                  </a>
                </p>
              </>
            ) : (
              <p style={{ margin: 0, color: "var(--muted)", fontSize: "0.9rem" }}>
                Demo chain mode active. Transactions are simulated locally with no external RPC or gas fees.
              </p>
            )}
          </div>
        </details>
      </div>
    </>
  )
}
