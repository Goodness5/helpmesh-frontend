import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageTitle } from "@/components/page-title"
import { ProfileStats, SupportButton } from "@/components/support-button"
import { HELPERS } from "@/lib/model"

export function generateStaticParams() {
  return HELPERS.map((helper) => ({ id: helper.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const helper = HELPERS.find((item) => item.id === id)
  if (!helper) return { title: "Helper" }
  return {
    title: `${helper.name} · Verified Peer Profile`,
    description: `${helper.name} helps nearby. Reputation is earned strictly through verified completions.`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const helper = HELPERS.find((item) => item.id === id)
  if (!helper) notFound()

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <p className="kicker">
        <span className="status-dot" aria-hidden="true" />
        <span>Verified Helper Profile</span>
      </p>
      <PageTitle>{helper.name}</PageTitle>

      <ProfileStats helperId={helper.id} />

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Availability &amp; Preferences</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.85rem" }}>
          <span className="status-pill">
            📍 {helper.distanceM}m {helper.direction}
          </span>
          <span className="status-pill">
            {helper.verified ? "✓ Identity Screened" : "Unverified"}
          </span>
          <span className="status-pill">
            {helper.acceptsFree ? "🤝 Accepts Free Aid" : "Paid Only"}
          </span>
          <span className="status-pill">
            {helper.acceptsPaid ? "🪙 Accepts Rewards" : "Free Only"}
          </span>
          <span className="status-pill">
            💬 {helper.communicate.join(" & ")}
          </span>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: "1rem", marginBottom: 0 }}>
          Reputation scores are calculated algorithmically based solely on confirmed sessions. Scores cannot be bought or transferred.
        </p>
      </div>

      <SupportButton helperId={helper.id} helperName={helper.name} />

      <p style={{ marginTop: "1.5rem" }}>
        <Link href="/helper" className="btn quiet">
          ← Back to open requests
        </Link>
      </p>
    </div>
  )
}
