"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { cancel, chat, choose, completeHelp, confirm, dispute, hold, saveTrusted, startHelp, tip, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { liveChain } from "@/lib/chain/plain"
import {
  distanceText,
  escrowSentence,
  formatTestMoney,
  headline,
  HELPERS,
  modeLabel,
  parseAmount,
  personName,
  rankHelpers,
} from "@/lib/model"

const replies = ["I'm here", "I'm at the entrance", "Please wait 2 minutes", "I can't hear you, I'll text"]
const reasons = ["I don't need help now", "I can't make it", "Something else"]

export function RequestScreen({ id }: { id: string }) {
  const announce = useAnnounce()
  const demo = useDemo()
  const request = demo.requests.find((item) => item.id === id)
  const [holdOpen, setHoldOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cardOpen, setCardOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [problemOpen, setProblemOpen] = useState(false)
  const [tipAmount, setTipAmount] = useState<number | null>(null)
  const [customTip, setCustomTip] = useState("")
  const [reason, setReason] = useState(reasons[0])
  const [checkedIn, setCheckedIn] = useState(false)

  const asHelper = request?.owner !== "me"
  const title = request ? headline(request, asHelper) : ""
  const statusKey = `${request?.id ?? ""}:${request?.status ?? ""}:${request?.escrow?.state ?? ""}:${request?.helperId ?? ""}`
  const told = useRef("")

  useEffect(() => {
    if (!demo.ready) return
    const heading = document.querySelector("main h1")
    if (heading instanceof HTMLElement) heading.focus()
  }, [demo.ready, id])

  useEffect(() => {
    if (!demo.ready || !request) return
    const line = headline(request, request.owner !== "me")
    if (told.current === line) return
    const previous = told.current
    told.current = line
    if (previous) announce(line)
  }, [announce, demo.ready, request, statusKey])

  if (!demo.ready) return <PageTitle>Loading this request</PageTitle>
  if (!request) {
    return (
      <>
        <PageTitle>We can’t find that request</PageTitle>
        <p><Link href="/helper">See open requests</Link></p>
      </>
    )
  }

  const helperName = personName(request.helperId, asHelper)
  const shownHelper = helperName.charAt(0).toUpperCase() + helperName.slice(1)
  const funds = request.escrow
    ? escrowSentence({
        state: request.escrow.state,
        amount: request.amount,
        helperName: shownHelper,
        source: request.escrow.source,
        helperAmount: request.escrow.helperAmount,
        refundAmount: request.escrow.refundAmount,
      })
    : ""
  const ranked = rankHelpers(HELPERS, request)
  const active = request.status === "assigned" || request.status === "started" || request.status === "awaiting_confirm"

  function run(result: string | Promise<string>, urgent = false) {
    if (liveChain && typeof result !== "string") announce("Sending this now.")
    void Promise.resolve(result).then((message) => announce(message, urgent ? "assertive" : "polite"))
  }

  function say(text: string) {
    if (!("speechSynthesis" in window)) {
      run("Speaking is not available. The words stay on screen.")
      return
    }
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(text))
    run(`Saying: ${text}`)
  }

  return (
    <>
      <PageTitle>{title}</PageTitle>
      <p className="lede">{request.description}</p>
      {funds && <p className="status">{funds}</p>}
      {!request.escrow && request.mode === "volunteer" && <p className="note">Volunteer. No money moves.</p>}
      <p className="muted">{request.place || "No place yet. Meet in a public spot if you can."} · about {request.minutes} minutes · {modeLabel(request.mode, request.amount)}</p>
      <p>Communicate by {request.communicate}.{request.shareNeeds && request.needsSummary ? ` ${request.needsSummary}` : ""}</p>

      {!asHelper && request.mode === "reward" && !request.escrow && request.status === "open" && (
        <button type="button" className="btn primary block" onClick={() => setHoldOpen(true)}>
          Hold {formatTestMoney(request.amount)} as test money until the help is confirmed
        </button>
      )}

      {!asHelper && request.status === "open" && (request.mode !== "reward" || request.escrow) && (
        <>
          <h2>Helpers nearby</h2>
          {liveChain && <p className="note">Daniel and Priya are practice helpers on this device. A helper on their own phone would accept from there.</p>}
          <ul className="list">
            {ranked.map(({ helper }) => (
              <li key={helper.id} className="card">
                <p>{helper.name}, {distanceText(helper)}, {helper.verified ? "identity checked" : "identity not checked"}, {helper.completions} completed, {helper.acceptsPaid ? "accepts rewards" : "free help only"}.</p>
                <button type="button" className="btn primary" onClick={() => run(choose(request.id, helper.id))}>Choose {helper.name}</button>
                <p><Link href={`/profile/${helper.id}`}>View {helper.name}</Link></p>
              </li>
            ))}
          </ul>
        </>
      )}

      {asHelper && request.status === "open" && (
        <button type="button" className="btn primary" onClick={() => run(choose(request.id, "me"))}>Accept this request</button>
      )}

      {asHelper && request.status === "assigned" && (
        <button type="button" className="btn primary" onClick={() => run(startHelp(request.id))}>Start helping</button>
      )}
      {asHelper && request.status === "started" && (
        <button type="button" className="btn primary" onClick={() => run(completeHelp(request.id))}>Mark help done</button>
      )}

      {!asHelper && request.helperId && request.helperId !== "me" && request.status === "assigned" && (
        <button type="button" className="btn primary" onClick={() => run(startHelp(request.id))}>Help has started</button>
      )}
      {!asHelper && request.status === "started" && request.helperId !== "me" && (
        <button type="button" className="btn primary" onClick={() => run(completeHelp(request.id))}>Help is finished</button>
      )}
      {asHelper && request.status === "awaiting_confirm" && (
        <>
          <p className="note">Waiting for {request.requesterName} to confirm. The amount stays held until then.</p>
          <button type="button" className="btn primary" onClick={() => run(confirm(request.id))}>They confirmed the help</button>
        </>
      )}

      {!asHelper && request.status === "awaiting_confirm" && (
        <div className="row">
          <button type="button" className="btn primary" onClick={() => setConfirmOpen(true)}>Yes, help was completed</button>
          <button type="button" className="btn danger" onClick={() => setProblemOpen(true)}>There was a problem</button>
        </div>
      )}

      {request.status === "done" && !asHelper && request.helperId && (
        <section>
          <h2>Say thanks</h2>
          <p>Optional. A tip does not change reputation.</p>
          <div className="chips">
            {[2, 5, 10].map((dollars) => (
              <button key={dollars} type="button" className="btn" onClick={() => setTipAmount(dollars * 1_000_000)}>${dollars}</button>
            ))}
            <button type="button" className="btn quiet" onClick={() => run("No tip. That is fine.")}>Skip</button>
          </div>
          <label className="field" htmlFor="custom-tip">
            <span>Custom amount</span>
            <input id="custom-tip" inputMode="decimal" value={customTip} onChange={(event) => setCustomTip(event.target.value)} />
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => {
              const amount = parseAmount(customTip)
              if (!amount) {
                run("Enter an amount like 4 or 4.50.")
                return
              }
              setTipAmount(amount)
            }}
          >
            Use custom amount
          </button>
        </section>
      )}

      {request.status === "disputed" && (
        <p className="status">A reviewer has this. The amount stays held until the review is finished.</p>
      )}

      {active && (
        <>
          <h2>Messages</h2>
          {request.messages.length === 0 && <p>No messages yet.</p>}
          <ul className="list">
            {request.messages.map((message, index) => (
              <li key={`${message.body}-${index}`}><strong>{message.from}: </strong>{message.body}</li>
            ))}
          </ul>
          <div className="chips">
            {replies.map((reply) => (
              <button key={reply} type="button" className="btn" onClick={() => { chat(request.id, asHelper ? "Helper" : "You", reply); run(`Sent: ${reply}`) }}>{reply}</button>
            ))}
          </div>
          <button type="button" className="btn quiet" onClick={() => say(replies[0] ?? "I'm here")}>Say “I’m here”</button>
          <button type="button" className="btn" onClick={() => setCardOpen(true)}>{asHelper ? "Show this card" : "Show this to the helper"}</button>

          {request.status === "started" && (
            <section className="card">
              <h2>Check in</h2>
              <p>This was estimated at about {request.minutes} minutes.</p>
              <button type="button" className="btn" onClick={() => { setCheckedIn(true); run("Checked in. You are OK.") }}>{checkedIn ? "Checked in" : "I'm OK"}</button>
            </section>
          )}

          <section id="sos">
            <h2>I need help now</h2>
            <div className="stack">
              <Link className="btn" href="/help">Message the platform</Link>
              <a className="btn" href="tel:911">Call 911</a>
              <a
                className="btn danger"
                href={`sms:?&body=${encodeURIComponent(`${demo.trustedName ? `${demo.trustedName}, ` : ""}I need help now. ${request.description}`)}`}
              >
                Text a trusted person
              </a>
            </div>
            <TrustedName />
          </section>
        </>
      )}

      {(request.status === "open" || request.status === "assigned") && (
        <button type="button" className="btn quiet" onClick={() => setCancelOpen(true)}>Cancel this request</button>
      )}
      {request.status === "started" && (
        <p>You can cancel after the help session has been left for 24 hours. You can report a problem instead.</p>
      )}
      {request.status === "started" && (
        <button type="button" className="btn danger" onClick={() => setProblemOpen(true)}>There was a problem</button>
      )}

      <h2>What happened</h2>
      <ol className="timeline">
        {request.events.map((event) => <li key={event}>{event}</li>)}
      </ol>

      <Dialog
        open={holdOpen}
        title={`Hold ${formatTestMoney(request.amount)}`}
        description={`This holds ${formatTestMoney(request.amount)} of test money. It is paid to the helper only after you confirm, or under the review rules. Escape cancels.`}
        onClose={() => setHoldOpen(false)}
      >
        <div className="row">
          <button type="button" className="btn primary" onClick={() => { setHoldOpen(false); run(hold(request.id)) }}>Hold {formatTestMoney(request.amount)}</button>
          <button type="button" className="btn quiet" onClick={() => setHoldOpen(false)}>Go back</button>
        </div>
      </Dialog>
      <Dialog
        open={confirmOpen}
        title="Confirm the help is done"
        description={request.escrow ? `${formatTestMoney(request.amount)} will be paid to ${shownHelper}.` : "No money moves. This records that the help happened."}
        onClose={() => setConfirmOpen(false)}
      >
        <div className="row">
          <button type="button" className="btn primary" onClick={() => { setConfirmOpen(false); run(confirm(request.id)) }}>{request.escrow ? "Yes, pay and finish" : "Yes, finish"}</button>
          <button type="button" className="btn quiet" onClick={() => setConfirmOpen(false)}>Go back</button>
        </div>
      </Dialog>
      <Dialog
        open={problemOpen}
        title="Report a problem"
        description="The amount stays held while this is reviewed."
        onClose={() => setProblemOpen(false)}
      >
        <div className="row">
          <button type="button" className="btn danger" onClick={() => { setProblemOpen(false); run(dispute(request.id), true) }}>Report the problem</button>
          <button type="button" className="btn quiet" onClick={() => setProblemOpen(false)}>Go back</button>
        </div>
      </Dialog>
      <Dialog
        open={cancelOpen}
        title="Cancel this request"
        description={request.escrow?.source === "pool" ? "The sponsored reward goes back to the pool." : request.escrow ? "The held amount comes back to you." : "No money moves."}
        onClose={() => setCancelOpen(false)}
      >
        <fieldset>
          <legend>Reason</legend>
          <div className="chips">
            {reasons.map((item) => (
              <button key={item} type="button" className="btn" aria-pressed={reason === item} onClick={() => setReason(item)}>{item}</button>
            ))}
          </div>
        </fieldset>
        <div className="row">
          <button type="button" className="btn danger" onClick={() => { setCancelOpen(false); run(cancel(request.id, reason)) }}>Cancel request</button>
          <button type="button" className="btn quiet" onClick={() => setCancelOpen(false)}>Keep it</button>
        </div>
      </Dialog>
      <Dialog
        open={cardOpen}
        title={asHelper ? "Show this card" : "Show this to the helper"}
        description="Large text you can hold up."
        onClose={() => setCardOpen(false)}
      >
        <p className="show-card">{request.description}</p>
        <p className="show-card">Please communicate by {request.communicate}.</p>
        <button type="button" className="btn primary" onClick={() => setCardOpen(false)}>Close</button>
      </Dialog>
      <Dialog
        open={tipAmount !== null}
        title={tipAmount ? `Send ${formatTestMoney(tipAmount)} to ${shownHelper}` : "Send a tip"}
        description="This is a thank-you. It does not confirm the help and it does not change reputation."
        onClose={() => setTipAmount(null)}
      >
        <div className="row">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!tipAmount || !request.helperId) return
              const amount = tipAmount
              setTipAmount(null)
              run(tip(request.helperId, amount, request.id))
            }}
          >
            Send tip
          </button>
          <button type="button" className="btn quiet" onClick={() => setTipAmount(null)}>Go back</button>
        </div>
      </Dialog>
    </>
  )
}

function TrustedName() {
  const demo = useDemo()
  const announce = useAnnounce()

  return (
    <form
      className="field"
      onSubmit={(event) => {
        event.preventDefault()
        const name = demo.trustedName.trim()
        saveTrusted(name)
        announce(name ? `Saved ${name}.` : "Cleared the trusted person.")
      }}
    >
      <label htmlFor="trusted">Trusted person, optional</label>
      <input id="trusted" autoComplete="name" value={demo.trustedName} onChange={(event) => saveTrusted(event.target.value)} />
      <button type="submit" className="btn">Save name</button>
    </form>
  )
}
