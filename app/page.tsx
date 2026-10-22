import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"
import { Reach } from "@/components/reach"
import { VectorMesh } from "@/components/vector-mesh"

export const metadata: Metadata = {
  title: { absolute: "HelpMesh · Peer-to-Peer Assistance Network" },
  description: "Ask someone nearby for help, offer help, or fund it with decentralized escrow.",
}

export default function HomePage() {
  return (
    <>
      <div className="hero-container">
        <VectorMesh />
        <section className="stage">
          <div>
            <p className="eyebrow">
              <span className="status-dot" aria-hidden="true" />
              <span>Registered Assistance Mesh</span>
            </p>
            <PageTitle>A person nearby can help.</PageTitle>
            <p className="lede">
              Need a guide, a hand with stairs, or escort for a short journey? Post what you need in seconds.
              Someone close can accept. Escrow locks the reward until help is confirmed.
            </p>
            <div className="hero-actions">
              <Link className="btn primary" href="/request/new">
                <span>Ask for help</span>
                <span className="btn-arrow-badge" aria-hidden="true">↗</span>
              </Link>
              <Link className="btn" href="/helper">
                <span>Offer help</span>
              </Link>
            </div>
            <p className="setup">
              <Link href="/onboarding">Personalize how HelpMesh works for you →</Link>
            </p>
          </div>
          <Reach />
        </section>
      </div>

      <section className="paths" aria-label="How help is paid">
        <article>
          <div>
            <span className="steps">Mode 01</span>
            <h2>Volunteer</h2>
            <p>Zero payment. Pure mutual assistance from a verified neighbor who has a few minutes to spare.</p>
          </div>
        </article>
        <article>
          <div>
            <span className="steps">Mode 02</span>
            <h2>Reward Escrow</h2>
            <p>You lock test USDC into an autonomous escrow contract. Released only when you confirm completion.</p>
          </div>
        </article>
        <article>
          <div>
            <span className="steps">Mode 03</span>
            <h2>Accessibility Fund</h2>
            <p>Community sponsorship pool pays up to $25 for verified mobility, vision, or hearing assistance.</p>
          </div>
          <p>
            <Link href="/fund">View the treasury pool →</Link>
          </p>
        </article>
      </section>
    </>
  )
}
