import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"

export const metadata: Metadata = {
  title: "Assistance & Platform Manual",
  description: "How to ask for help, how autonomous escrow works, and safety guidelines.",
}

export default function HelpPage() {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      <p className="kicker">
        <span className="status-dot" aria-hidden="true" />
        <span>Platform Guidelines &amp; Accessibility</span>
      </p>
      <PageTitle>Help &amp; Operating Principles</PageTitle>
      <p className="lede">
        HelpMesh is engineered to work reliably with screen readers, tactile keyboards, switch devices, or large-format text.
      </p>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>How Assistance Works</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          Start from a pre-configured template or write your custom requirements. You always review an immutable summary before broadcasting. Nearby peers receive distance and direction telemetry to locate you quickly.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Autonomous Escrow &amp; Funds</h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.6 }}>
          When requesting with a reward, test USDC is locked into a smart contract on Base Sepolia. The helper cannot claim tokens until you explicitly confirm completion in your session. Community donations to the Accessibility Fund are non-refundable and strictly disbursed for verified mobility, vision, or hearing assistance.
        </p>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Glossary of Concepts</h2>
        <dl className="stack" style={{ gap: "1rem" }}>
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem" }}>
            <dt style={{ color: "var(--signal)", fontWeight: 600, fontSize: "1rem" }}>Locked in Escrow</dt>
            <dd style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              Tokens are held by the autonomous smart contract on Base Sepolia. Neither party can seize them without meeting completion conditions.
            </dd>
          </div>
          <div style={{ borderBottom: "1px solid var(--line)", paddingBottom: "0.75rem" }}>
            <dt style={{ color: "var(--signal)", fontWeight: 600, fontSize: "1rem" }}>Accessibility Fund</dt>
            <dd style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              A community treasury pool that subsidizes assistance up to $25 for requesters who qualify under accessibility criteria.
            </dd>
          </div>
          <div>
            <dt style={{ color: "var(--signal)", fontWeight: 600, fontSize: "1rem" }}>Reputation Score</dt>
            <dd style={{ margin: "0.25rem 0 0", color: "var(--muted)", fontSize: "0.9rem" }}>
              Derived exclusively from verified, confirmed peer sessions minus disputes. Reputation can never be bought, tipped, or transferred.
            </dd>
          </div>
        </dl>
      </div>

      <div className="card" style={{ borderColor: "rgba(248, 113, 113, 0.35)", background: "var(--danger-bg)", marginBottom: "2rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.2rem", color: "var(--danger)" }}>Emergency Situations</h2>
        <p style={{ color: "var(--ink)", fontSize: "0.95rem", lineHeight: 1.6, margin: "0 0 1rem" }}>
          HelpMesh is not an emergency dispatcher, paramedic, or police service. If you are in immediate personal or medical danger, immediately contact emergency responders.
        </p>
        <div className="row">
          <a className="btn danger" href="tel:911">Call 911</a>
          <a className="btn" href="sms:911">Text 911</a>
        </div>
      </div>

      <p>
        <Link href="/settings/accessibility" className="btn quiet">
          Display &amp; Sensory Settings →
        </Link>
      </p>
    </div>
  )
}
