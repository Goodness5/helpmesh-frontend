"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { choose, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { modeLabel } from "@/lib/model"

export function HelperBoard() {
  const demo = useDemo()
  const announce = useAnnounce()
  const router = useRouter()
  const [acceptId, setAcceptId] = useState<string | null>(null)
  const open = demo.requests.filter((request) => request.status === "open")
  const chosen = open.find((request) => request.id === acceptId)

  return (
    <>
      <div style={{ marginTop: "1.5rem" }}>
        <p className="kicker">
          <span className="status-dot" aria-hidden="true" />
          <span>Peer Opportunity Feed</span>
        </p>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: "1rem" }}>
          <PageTitle>Help someone nearby</PageTitle>
          <span className="status-pill">
            <span>{open.length} {open.length === 1 ? "request active" : "requests active"}</span>
          </span>
        </div>
        <p className="lede">
          Review the requested assistance, proximity, and preferred communication. Accept to establish an end-to-end coordination session.
        </p>

        {open.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--muted)" }}>
            <p style={{ fontSize: "1.1rem", margin: "0 0 0.5rem", color: "var(--ink)" }}>All caught up!</p>
            <p style={{ margin: 0, fontSize: "0.9rem" }}>There are no open assistance requests in your vicinity right now.</p>
          </div>
        ) : (
          <ul className="list">
            {open.map((request) => (
              <li key={request.id} className="card" style={{ display: "grid", gap: "0.85rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <span className="steps">{request.category.toUpperCase()}</span>
                    <h2 style={{ margin: "0.15rem 0 0", fontSize: "1.25rem" }}>{request.title}</h2>
                  </div>
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    <span className="status-pill" style={{ color: "var(--signal)", borderColor: "rgba(37, 244, 151, 0.3)" }}>
                      {modeLabel(request.mode, request.amount)}
                    </span>
                    <span className="status-pill">~{request.minutes}m</span>
                  </div>
                </div>

                <p style={{ color: "var(--muted)", margin: 0, fontSize: "0.95rem", lineHeight: 1.55 }}>
                  {request.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
                  <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
                    📍 {request.owner === "maria" ? "300 meters NE" : "Nearby (~250m)"}
                  </span>
                  <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
                    💬 Communicate: {request.communicate}
                  </span>
                  {request.shareNeeds && request.needsSummary && (
                    <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
                      ♿ {request.needsSummary}
                    </span>
                  )}
                </div>

                <div style={{ paddingTop: "0.4rem" }}>
                  {request.owner === "me" ? (
                    <Link className="btn" href={`/request/${request.id}`}>
                      View your active request →
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="btn primary"
                      onClick={() => setAcceptId(request.id)}
                    >
                      <span>Accept {request.requesterName}&apos;s request</span>
                      <span className="btn-arrow-badge" aria-hidden="true">↗</span>
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <Dialog
          open={Boolean(chosen)}
          title={chosen ? `Accept help for ${chosen.requesterName}` : "Accept request"}
          description={
            chosen
              ? `You are agreeing to assist ${chosen.requesterName}: "${chosen.description}". Preferred communication is by ${chosen.communicate}.`
              : ""
          }
          onClose={() => setAcceptId(null)}
        >
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                void (async () => {
                  if (!chosen) return
                  const id = chosen.id
                  const message = await choose(id, "me")
                  setAcceptId(null)
                  announce(message)
                  router.push(`/request/${id}`)
                })()
              }}
            >
              Confirm Acceptance
            </button>
            <button type="button" className="btn quiet" onClick={() => setAcceptId(null)}>
              Go back
            </button>
          </div>
        </Dialog>
      </div>
    </>
  )
}
