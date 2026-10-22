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
      <div style={{ marginTop: "1.5rem" }}>
        <PageTitle>We can’t find that request</PageTitle>
        <p><Link href="/helper" className="btn">See open requests</Link></p>
      </div>
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
      <div style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
          <p className="kicker" style={{ margin: 0 }}>
            <span className="status-dot" aria-hidden="true" />
            <span>Active Session · {request.id.slice(0, 10)}</span>
          </p>
          <span className="status-pill" style={{ color: "var(--signal)", borderColor: "rgba(37, 244, 151, 0.3)" }}>
            {modeLabel(request.mode, request.amount)}
          </span>
        </div>

        <PageTitle>{title}</PageTitle>

        <div className="card" style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
          <p className="lede" style={{ fontSize: "1.05rem", margin: "0 0 0.85rem", color: "var(--ink)" }}>
            {request.description}
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.85rem" }}>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
              📍 {request.place || "Public location nearby"}
            </span>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
              ⏱ ~{request.minutes} mins
            </span>
            <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
              💬 {request.communicate}
            </span>
            {request.shareNeeds && request.needsSummary && (
              <span className="status-pill" style={{ background: "var(--surface-raised)" }}>
                ♿ {request.needsSummary}
              </span>
            )}
          </div>

          {funds && (
            <div className="status" style={{ margin: "0.5rem 0 0" }}>
              <span className="status-dot" style={{ display: "inline-block", marginRight: "0.5rem" }} aria-hidden="true" />
              <strong>Escrow:</strong> {funds}
            </div>
          )}
          {!request.escrow && request.mode === "volunteer" && (
            <div className="note" style={{ margin: "0.5rem 0 0" }}>
              Volunteer request. Peer-to-peer aid with no smart contract lock.
            </div>
          )}
        </div>

        {!asHelper && request.mode === "reward" && !request.escrow && request.status === "open" && (
          <div className="card" style={{ marginBottom: "1.5rem", borderColor: "rgba(37, 244, 151, 0.4)" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Lock Escrow to Begin Matching</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.95rem", marginBottom: "1rem" }}>
              Hold {formatTestMoney(request.amount)} in the Base Sepolia testnet escrow contract. Released to your helper only after you confirm completion.
            </p>
            <button type="button" className="btn primary" onClick={() => setHoldOpen(true)}>
              <span>Lock {formatTestMoney(request.amount)} into Escrow</span>
              <span className="btn-arrow-badge" aria-hidden="true">↗</span>
            </button>
          </div>
        )}

        {!asHelper && request.status === "open" && (request.mode !== "reward" || request.escrow) && (
          <div style={{ marginBottom: "2rem" }}>
            <h2>Available Helpers Nearby</h2>
            {liveChain && (
              <p className="note">
                Daniel and Priya are simulated peers on this device. Live peers on their own devices can accept via the Offer feed.
              </p>
            )}
            <ul className="list">
              {ranked.map(({ helper }) => (
                <li key={helper.id} className="card" style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                    <div>
                      <h3 style={{ margin: "0 0 0.2rem", fontSize: "1.15rem" }}>{helper.name}</h3>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                        <span className="status-pill">{distanceText(helper)}</span>
                        <span className="status-pill">{helper.verified ? "✓ Verified" : "Unverified"}</span>
                        <span className="status-pill">{helper.completions} completed</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <Link href={`/profile/${helper.id}`} className="btn quiet" style={{ fontSize: "0.8rem", padding: "0.4rem 0.8rem" }}>
                        Profile ↗
                      </Link>
                      <button type="button" className="btn primary" onClick={() => run(choose(request.id, helper.id))}>
                        Choose {helper.name}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {asHelper && request.status === "open" && (
          <div style={{ margin: "1.5rem 0" }}>
            <button type="button" className="btn primary" onClick={() => run(choose(request.id, "me"))}>
              <span>Accept this request</span>
              <span className="btn-arrow-badge" aria-hidden="true">↗</span>
            </button>
          </div>
        )}

        {/* Action controls based on status */}
        <div style={{ margin: "1.5rem 0" }}>
          {asHelper && request.status === "assigned" && (
            <button type="button" className="btn primary" onClick={() => run(startHelp(request.id))}>
              Start helping now
            </button>
          )}
          {asHelper && request.status === "started" && (
            <button type="button" className="btn primary" onClick={() => run(completeHelp(request.id))}>
              Mark help completed
            </button>
          )}

          {!asHelper && request.helperId && request.helperId !== "me" && request.status === "assigned" && (
            <button type="button" className="btn primary" onClick={() => run(startHelp(request.id))}>
              Confirm session started
            </button>
          )}
          {!asHelper && request.status === "started" && request.helperId !== "me" && (
            <button type="button" className="btn primary" onClick={() => run(completeHelp(request.id))}>
              Mark help completed
            </button>
          )}

          {asHelper && request.status === "awaiting_confirm" && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <p className="note" style={{ margin: "0 0 1rem" }}>
                Waiting for {request.requesterName} to confirm. The escrow tokens stay held until then.
              </p>
              <button type="button" className="btn primary" onClick={() => run(confirm(request.id))}>
                They confirmed in person
              </button>
            </div>
          )}

          {!asHelper && request.status === "awaiting_confirm" && (
            <div className="card" style={{ marginBottom: "1rem" }}>
              <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Did you receive the assistance needed?</h2>
              <p style={{ color: "var(--muted)", fontSize: "0.925rem", marginBottom: "1rem" }}>
                Confirming will trigger autonomous escrow release of {formatTestMoney(request.amount)} to {shownHelper}.
              </p>
              <div className="row">
                <button type="button" className="btn primary" onClick={() => setConfirmOpen(true)}>
                  Yes, release escrow
                </button>
                <button type="button" className="btn danger" onClick={() => setProblemOpen(true)}>
                  Report a problem
                </button>
              </div>
            </div>
          )}
        </div>

        {request.status === "done" && !asHelper && request.helperId && (
          <section className="card" style={{ marginBottom: "2rem" }}>
            <h2 style={{ marginTop: 0, fontSize: "1.2rem" }}>Send a Gratuity (Optional)</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.925rem", marginBottom: "1rem" }}>
              Tips do not affect helper reputation scores. Balances transfer directly to the helper&apos;s account.
            </p>
            <div className="chips" style={{ marginBottom: "1rem" }}>
              {[2, 5, 10].map((dollars) => (
                <button key={dollars} type="button" onClick={() => setTipAmount(dollars * 1_000_000)}>
                  ${dollars} tip
                </button>
              ))}
              <button type="button" className="btn quiet" onClick={() => run("No tip. That is fine.")}>
                Skip
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
              <input
                id="custom-tip"
                style={{ maxWidth: "160px" }}
                inputMode="decimal"
                value={customTip}
                onChange={(event) => setCustomTip(event.target.value)}
                placeholder="Custom $"
                aria-label="Custom tip amount"
              />
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
                Send custom tip
              </button>
            </div>
          </section>
        )}

        {request.status === "disputed" && (
          <div className="status warn" style={{ marginBottom: "1.5rem" }}>
            <strong>Dispute Under Review:</strong> An independent community reviewer has been assigned. The escrow amount remains locked until resolved.
          </div>
        )}

        {active && (
          <div style={{ display: "grid", gap: "1.5rem", marginBottom: "2rem" }}>
            <div className="card">
              <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Live Peer Messaging</h2>
              {request.messages.length === 0 ? (
                <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>No messages yet. Send a quick update below.</p>
              ) : (
                <ul className="list" style={{ marginBottom: "1rem" }}>
                  {request.messages.map((message, index) => (
                    <li
                      key={`${message.body}-${index}`}
                      style={{
                        padding: "0.6rem 0.9rem",
                        background: message.from === "You" ? "var(--surface-raised)" : "var(--soft)",
                        borderColor: message.from === "You" ? "var(--signal)" : "var(--line)",
                        fontSize: "0.9rem",
                      }}
                    >
                      <strong style={{ color: message.from === "You" ? "var(--signal)" : "var(--ink)" }}>{message.from}: </strong>
                      {message.body}
                    </li>
                  ))}
                </ul>
              )}

              <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
                Quick Responses
              </span>
              <div className="chips" style={{ margin: "0.4rem 0 1rem" }}>
                {replies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => {
                      chat(request.id, asHelper ? "Helper" : "You", reply)
                      run(`Sent: ${reply}`)
                    }}
                  >
                    {reply}
                  </button>
                ))}
              </div>

              <div className="row">
                <button type="button" className="btn quiet" onClick={() => say(replies[0] ?? "I'm here")}>
                  🔊 Speak &ldquo;I&apos;m here&rdquo;
                </button>
                <button type="button" className="btn" onClick={() => setCardOpen(true)}>
                  📱 {asHelper ? "Show identification card" : "Show card to helper"}
                </button>
              </div>
            </div>

            {request.status === "started" && (
              <div className="card">
                <h2 style={{ marginTop: 0, fontSize: "1.15rem" }}>Session Check-In</h2>
                <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "0.85rem" }}>
                  Estimated at ~{request.minutes} minutes. Tap to confirm you are safe.
                </p>
                <button
                  type="button"
                  className="btn"
                  style={{ borderColor: checkedIn ? "var(--signal)" : "var(--line)" }}
                  onClick={() => {
                    setCheckedIn(true)
                    run("Checked in. Status is OK.")
                  }}
                >
                  {checkedIn ? "✓ Checked in: You are OK" : "I'm OK"}
                </button>
              </div>
            )}

            <div className="card" style={{ borderColor: "rgba(248, 113, 113, 0.3)" }}>
              <h2 style={{ marginTop: 0, fontSize: "1.15rem", color: "var(--danger)" }}>Emergency &amp; Safety SOS</h2>
              <div className="row" style={{ marginBottom: "1rem" }}>
                <a className="btn danger" href="tel:911">
                  Call 911
                </a>
                <a
                  className="btn"
                  href={`sms:?&body=${encodeURIComponent(`${demo.trustedName ? `${demo.trustedName}, ` : ""}I need help now. ${request.description}`)}`}
                >
                  Text trusted contact
                </a>
                <Link className="btn quiet" href="/help">
                  Platform safety
                </Link>
              </div>
              <TrustedName />
            </div>
          </div>
        )}

        <div style={{ margin: "1.5rem 0" }}>
          {(request.status === "open" || request.status === "assigned") && (
            <button type="button" className="btn quiet" onClick={() => setCancelOpen(true)}>
              Cancel this request
            </button>
          )}
          {request.status === "started" && (
            <button type="button" className="btn danger" onClick={() => setProblemOpen(true)}>
              Report a problem
            </button>
          )}
        </div>

        <h2>Audit Trail &amp; Events</h2>
        <div className="card" style={{ padding: "1.25rem 1.5rem", marginBottom: "2rem" }}>
          <ol className="timeline" style={{ margin: 0 }}>
            {request.events.map((event, idx) => (
              <li key={`${event}-${idx}`}>{event}</li>
            ))}
          </ol>
        </div>

        {/* Dialogs */}
        <Dialog
          open={holdOpen}
          title={`Lock ${formatTestMoney(request.amount)} in Escrow`}
          description={`This commits ${formatTestMoney(request.amount)} of test USDC to the escrow contract. It will be released to the helper upon confirmation. Escape cancels.`}
          onClose={() => setHoldOpen(false)}
        >
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setHoldOpen(false)
                run(hold(request.id))
              }}
            >
              Confirm Escrow Lock
            </button>
            <button type="button" className="btn quiet" onClick={() => setHoldOpen(false)}>
              Go back
            </button>
          </div>
        </Dialog>

        <Dialog
          open={confirmOpen}
          title="Confirm assistance completed"
          description={
            request.escrow
              ? `${formatTestMoney(request.amount)} will be released from escrow to ${shownHelper}.`
              : "No tokens move. This records successful verified completion."
          }
          onClose={() => setConfirmOpen(false)}
        >
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setConfirmOpen(false)
                run(confirm(request.id))
              }}
            >
              {request.escrow ? "Yes, Release & Settle" : "Yes, Complete Session"}
            </button>
            <button type="button" className="btn quiet" onClick={() => setConfirmOpen(false)}>
              Go back
            </button>
          </div>
        </Dialog>

        <Dialog
          open={problemOpen}
          title="Initiate dispute resolution"
          description="Tokens stay locked in escrow while an independent reviewer investigates the situation."
          onClose={() => setProblemOpen(false)}
        >
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                setProblemOpen(false)
                run(dispute(request.id), true)
              }}
            >
              File dispute report
            </button>
            <button type="button" className="btn quiet" onClick={() => setProblemOpen(false)}>
              Go back
            </button>
          </div>
        </Dialog>

        <Dialog
          open={cancelOpen}
          title="Cancel request"
          description={
            request.escrow?.source === "pool"
              ? "The sponsored grant returns immediately to the Accessibility Fund pool."
              : request.escrow
              ? "The locked escrow tokens return immediately to your balance."
              : "No tokens are locked."
          }
          onClose={() => setCancelOpen(false)}
        >
          <fieldset style={{ marginTop: "1rem" }}>
            <legend style={{ marginBottom: "0.5rem" }}>Cancellation Reason</legend>
            <div className="chips">
              {reasons.map((item) => (
                <button
                  key={item}
                  type="button"
                  aria-pressed={reason === item}
                  onClick={() => setReason(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="row" style={{ marginTop: "1.25rem" }}>
            <button
              type="button"
              className="btn danger"
              onClick={() => {
                setCancelOpen(false)
                run(cancel(request.id, reason))
              }}
            >
              Cancel request
            </button>
            <button type="button" className="btn quiet" onClick={() => setCancelOpen(false)}>
              Keep request
            </button>
          </div>
        </Dialog>

        <Dialog
          open={cardOpen}
          title={asHelper ? "Identification Card" : "Assistance Card"}
          description="High-contrast display card to present to your peer in person."
          onClose={() => setCardOpen(false)}
        >
          <div className="preview" style={{ margin: "1rem 0" }}>
            <p className="show-card" style={{ margin: "0 0 0.5rem" }}>{request.description}</p>
            <p className="show-card" style={{ fontSize: "1.3rem", color: "var(--signal)" }}>
              Communicate by: {request.communicate}
            </p>
          </div>
          <button type="button" className="btn primary" onClick={() => setCardOpen(false)}>
            Close Card
          </button>
        </Dialog>

        <Dialog
          open={tipAmount !== null}
          title={tipAmount ? `Send ${formatTestMoney(tipAmount)} Gratuity to ${shownHelper}` : "Send a tip"}
          description="This gratuity transfers directly to the helper. It is independent of reputation scoring."
          onClose={() => setTipAmount(null)}
        >
          <div className="row" style={{ marginTop: "1.25rem" }}>
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
              Confirm Gratuity
            </button>
            <button type="button" className="btn quiet" onClick={() => setTipAmount(null)}>
              Go back
            </button>
          </div>
        </Dialog>
      </div>
    </>
  )
}

function TrustedName() {
  const demo = useDemo()
  const announce = useAnnounce()

  return (
    <form
      className="field"
      style={{ marginTop: "1rem" }}
      onSubmit={(event) => {
        event.preventDefault()
        const name = demo.trustedName.trim()
        saveTrusted(name)
        announce(name ? `Saved ${name}.` : "Cleared the trusted person.")
      }}
    >
      <label htmlFor="trusted">Trusted contact name (for quick emergency SMS)</label>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <input
          id="trusted"
          style={{ flex: "1 1 200px" }}
          autoComplete="name"
          value={demo.trustedName}
          onChange={(event) => saveTrusted(event.target.value)}
          placeholder="e.g. Maria or Alex"
        />
        <button type="submit" className="btn" style={{ flex: "0 0 auto" }}>
          Save name
        </button>
      </div>
    </form>
  )
}
