"use client"

import Link from "next/link"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { resetDemo } from "@/components/demo"
import { PrefsFields, usePrefs } from "@/components/prefs-fields"
import { applyPrefs } from "@/lib/prefs"

export function SettingsForm() {
  const announce = useAnnounce()
  const prefs = usePrefs()

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <p className="kicker">
        <span className="status-dot" aria-hidden="true" />
        <span>Accessibility &amp; Environment</span>
      </p>
      <PageTitle>Display &amp; Accessibility</PageTitle>
      <p className="lede">
        Fine-tune visual contrast, typography, scaling, and feedback to suit your perceptual preferences. Changes persist locally.
      </p>

      <PrefsFields
        prefs={prefs}
        onChange={(next) => {
          applyPrefs(next)
          announce("Display settings updated.")
        }}
      />

      <div className="card" style={{ marginTop: "2rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Assistance Profile &amp; Needs</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.925rem", marginBottom: "1rem" }}>
          Configure what you share with peers, communication preferences, and radius settings.
        </p>
        <Link className="btn" href="/onboarding">
          Configure Your Profile →
        </Link>
      </div>

      <div className="card" style={{ marginTop: "1rem", borderColor: "rgba(248, 113, 113, 0.25)" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.15rem", color: "var(--danger)" }}>Local Storage &amp; Reset</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.925rem", marginBottom: "1rem" }}>
          Clears local browser requests and cached session state. Test money and transactions committed to Base Sepolia remain intact on-chain.
        </p>
        <button
          type="button"
          className="btn danger"
          onClick={() => {
            resetDemo()
            announce("Local storage cleared.")
          }}
        >
          Reset Local Browser Cache
        </button>
      </div>
    </div>
  )
}
