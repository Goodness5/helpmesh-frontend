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
      <PageTitle>Help someone</PageTitle>
      <p className="lede">Read the need, how far away it is, and how to communicate. Then accept.</p>
      {open.length === 0 && <p>No open requests right now.</p>}
      <ul className="list">
        {open.map((request) => (
          <li key={request.id} className="card">
            <h2>{request.title}</h2>
            <p>{request.description}</p>
            <p>
              {request.owner === "maria" ? "300 meters north-east" : "Nearby"}, about {request.minutes} minutes, {modeLabel(request.mode, request.amount)}.
            </p>
            <p>Communicate by {request.communicate}.</p>
            {request.shareNeeds && request.needsSummary && <p>{request.needsSummary}</p>}
            {request.owner === "me" ? (
              <Link className="btn" href={`/request/${request.id}`}>This is your request</Link>
            ) : (
              <button type="button" className="btn primary" onClick={() => setAcceptId(request.id)}>Accept {request.requesterName}&apos;s request</button>
            )}
          </li>
        ))}
      </ul>
      <Dialog
        open={Boolean(chosen)}
        title={chosen ? `Accept help for ${chosen.requesterName}` : "Accept request"}
        description={chosen ? `${chosen.requesterName} needs: ${chosen.description} Communicate by ${chosen.communicate}.` : ""}
        onClose={() => setAcceptId(null)}
      >
        <div className="row">
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
            Accept
          </button>
          <button type="button" className="btn quiet" onClick={() => setAcceptId(null)}>Go back</button>
        </div>
      </Dialog>
    </>
  )
}
