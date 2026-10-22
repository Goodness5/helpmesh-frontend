"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { donate, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { liveChain } from "@/lib/chain/plain"
import { formatTestMoney, FUND_MAX, parseAmount } from "@/lib/model"

const PRESETS = ["5", "10", "20", "50"]

export function FundScreen() {
  const demo = useDemo()
  const announce = useAnnounce()
  const [amountText, setAmountText] = useState("20")
  const [open, setOpen] = useState(false)
  const amount = parseAmount(amountText)
  const paid = demo.requests.filter(
    (request) => request.mode === "sponsored" && (request.status === "done" || request.status === "resolved")
  ).length

  return (
    <>
      <div style={{ marginTop: "1.5rem" }}>
        <p className="kicker">
          <span className="status-dot" aria-hidden="true" />
          <span>Community Sponsorship Treasury</span>
        </p>
        <PageTitle>Accessibility Fund</PageTitle>

        <div className="card" style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
            <span className="steps">Treasury Pool</span>
            <span className="status-pill">
              <span>{paid} {paid === 1 ? "grant disbursed" : "grants disbursed"}</span>
            </span>
          </div>

          <div className="balance" style={{ margin: "0.5rem 0 1rem", border: "none", padding: "0", background: "transparent", boxShadow: "none" }}>
            {!demo.ready || (liveChain && !demo.funded) ? "Loading..." : formatTestMoney(demo.poolBalance)}
          </div>

          <p className="lede" style={{ fontSize: "0.95rem", marginBottom: "0" }}>
            A transparent smart contract pool funding assistance for requesters who cannot pay. Donated tokens can only exit the fund through verified completion of eligible needs.
          </p>
        </div>

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <h2 style={{ marginTop: "0", fontSize: "1.15rem" }}>Pool Coverage Rules</h2>
          <p style={{ fontSize: "0.925rem", color: "var(--muted)", marginBottom: "1rem" }}>
            Covers up to <strong>{formatTestMoney(FUND_MAX)}</strong> for verified mobility, vision, or hearing assistance.
            Disbursements are automated and verifiable on-chain.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>Mobility &amp; Transit</span>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>Vision Guidance</span>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>Hearing &amp; Translation</span>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>Max $25 / Request</span>
          </div>
        </div>

        <div className="card">
          <label className="field" htmlFor="gift" style={{ marginBottom: "0.75rem" }}>
            <span>Amount to contribute (USDC)</span>
            <input
              id="gift"
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              onChange={(event) => setAmountText(event.target.value)}
              placeholder="e.g. 20"
            />
          </label>

          <div style={{ marginBottom: "1.25rem" }}>
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Quick Preset
            </span>
            <div className="chips" style={{ marginTop: "0.35rem" }}>
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  aria-pressed={amountText === preset}
                  onClick={() => setAmountText(preset)}
                >
                  ${preset}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!amount) {
                announce("Enter an amount like 20 or 20.00.")
                return
              }
              setOpen(true)
            }}
          >
            <span>Contribute to the fund</span>
            <span className="btn-arrow-badge" aria-hidden="true">↗</span>
          </button>
        </div>

        <Dialog
          open={open}
          title={amount ? `Add ${formatTestMoney(amount)} to the Accessibility Fund` : "Add to the fund"}
          description="This contribution cannot be refunded. It is locked into the treasury and can only release to verified helpers who fulfill eligible requests. Press Escape to cancel."
          onClose={() => setOpen(false)}
        >
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                if (!amount) return
                setOpen(false)
                announce("Sending contribution transaction...")
                void donate(amount).then(announce)
              }}
            >
              Confirm {amount ? formatTestMoney(amount) : "contribution"}
            </button>
            <button type="button" className="btn quiet" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </Dialog>
      </div>
    </>
  )
}
