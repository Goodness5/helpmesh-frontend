"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { tip, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { formatTestMoney, HELPERS, helperStats, parseAmount } from "@/lib/model"

export function ProfileStats({ helperId }: { helperId: string }) {
  const demo = useDemo()
  const helper = HELPERS.find((item) => item.id === helperId)
  if (!helper) return null
  const stats = helperStats(helper, demo.records)

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "0.75rem", margin: "1rem 0 1.5rem" }}>
      <div className="card" style={{ padding: "1.1rem" }}>
        <span className="steps">Completed</span>
        <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--ink)", margin: "0.2rem 0" }}>
          {stats.helped}
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Assistance sessions</span>
      </div>

      <div className="card" style={{ padding: "1.1rem" }}>
        <span className="steps">Reputation</span>
        <div style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--signal)", margin: "0.2rem 0" }}>
          ★ {stats.score}
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Earned via completions</span>
      </div>

      <div className="card" style={{ padding: "1.1rem" }}>
        <span className="steps">Identity</span>
        <div style={{ fontSize: "1.2rem", fontWeight: 600, color: "var(--ink)", margin: "0.55rem 0" }}>
          {helper.verified ? "✓ Verified" : "Unverified"}
        </div>
        <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Platform screening</span>
      </div>
    </div>
  )
}

const PRESETS = ["2", "5", "10", "20"]

export function SupportButton({ helperId, helperName }: { helperId: string; helperName: string }) {
  const announce = useAnnounce()
  const [amountText, setAmountText] = useState("5")
  const [open, setOpen] = useState(false)
  const amount = parseAmount(amountText)

  return (
    <section className="card" style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}>
      <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Support {helperName}</h2>
      <p style={{ color: "var(--muted)", fontSize: "0.925rem", marginBottom: "1rem" }}>
        Send an optional tip or gratitude grant. Gratuities transfer directly to the helper and do not inflate reputation rankings.
      </p>

      <div style={{ marginBottom: "1rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          Tip Presets
        </span>
        <div className="chips" style={{ marginTop: "0.4rem" }}>
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

      <label className="field" htmlFor="support" style={{ marginBottom: "1rem" }}>
        <span>Custom amount (USDC)</span>
        <input
          id="support"
          inputMode="decimal"
          autoComplete="off"
          value={amountText}
          onChange={(event) => setAmountText(event.target.value)}
          placeholder="e.g. 5"
        />
      </label>

      <button
        type="button"
        className="btn primary"
        onClick={() => {
          if (!amount) {
            announce("Enter an amount like 5 or 5.00.")
            return
          }
          setOpen(true)
        }}
      >
        <span>Send {amount ? formatTestMoney(amount) : "support"} to {helperName}</span>
        <span className="btn-arrow-badge" aria-hidden="true">↗</span>
      </button>

      <Dialog
        open={open}
        title={amount ? `Send ${formatTestMoney(amount)} to ${helperName}` : `Support ${helperName}`}
        description="This gift does not confirm help and does not change reputation. Escape cancels."
        onClose={() => setOpen(false)}
      >
        <div className="row" style={{ marginTop: "1.25rem" }}>
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!amount) return
              setOpen(false)
              announce("Sending support tokens...")
              void tip(helperId, amount).then(announce)
            }}
          >
            Confirm {amount ? formatTestMoney(amount) : "gift"}
          </button>
          <button type="button" className="btn quiet" onClick={() => setOpen(false)}>
            Go back
          </button>
        </div>
      </Dialog>
    </section>
  )
}
