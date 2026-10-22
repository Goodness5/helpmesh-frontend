"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { sendRequest, useDemo } from "@/components/demo"
import { formatTestMoney, looksLikeEmergency, parseAmount, TEMPLATES, type Mode } from "@/lib/model"

const chips = [5, 10, 20]
const blank = { title: "", description: "", place: "", mode: "volunteer" as Mode, amountText: "10", category: "other", minutes: 20 }
type DraftForm = typeof blank
const draftListeners = new Set<() => void>()
let draft: DraftForm | null = null

function currentDraft(): DraftForm {
  if (draft) return draft
  draft = blank
  try {
    const raw = sessionStorage.getItem("helpmesh.draft")
    if (raw) draft = { ...blank, ...JSON.parse(raw) as Partial<DraftForm> }
  } catch {
    draft = blank
    sessionStorage.removeItem("helpmesh.draft")
  }
  return draft
}

function patchDraft(partial: Partial<DraftForm>) {
  draft = { ...currentDraft(), ...partial }
  sessionStorage.setItem("helpmesh.draft", JSON.stringify(draft))
  draftListeners.forEach((listener) => listener())
}

function clearDraft() {
  draft = blank
  sessionStorage.removeItem("helpmesh.draft")
  draftListeners.forEach((listener) => listener())
}

function subscribeDraft(listener: () => void) {
  draftListeners.add(listener)
  return () => draftListeners.delete(listener)
}

export function NewRequest() {
  const router = useRouter()
  const announce = useAnnounce()
  const demo = useDemo()
  const summaryRef = useRef<HTMLDivElement>(null)
  const saved = useSyncExternalStore(subscribeDraft, currentDraft, () => blank)
  const [step, setStep] = useState<1 | 2 | "emergency">(1)
  const [errors, setErrors] = useState<{ id: string; message: string }[]>([])
  const { title, description, category, place, minutes, mode, amountText } = saved

  useEffect(() => {
    if (errors.length) summaryRef.current?.focus()
  }, [errors])

  function fill(template: (typeof TEMPLATES)[number]) {
    patchDraft({ title: template.label, description: template.need, category: template.category, minutes: template.minutes })
    announce(`${template.label} filled in. You can edit it.`)
    if (template.id === "other") document.getElementById("need")?.focus()
  }

  function locate() {
    if (!navigator.geolocation) {
      announce("Location is not available. You can type a place.")
      return
    }
    navigator.geolocation.getCurrentPosition(
      () => {
        patchDraft({ place: place || "Near you" })
        announce("Place set to near you. You can edit it.")
      },
      () => announce("We could not read your location. Type a place instead."),
    )
  }

  function review() {
    const next: { id: string; message: string }[] = []
    if (!description.trim()) next.push({ id: "need", message: "Tell us what you need help with." })
    if (mode !== "volunteer" && !parseAmount(amountText)) {
      next.push({ id: "amount", message: "Enter an amount like 10 or 10.50, up to $10,000." })
    }
    setErrors(next)
    if (next.length) {
      announce("Please fix the form before continuing.")
      return
    }
    if (looksLikeEmergency(`${title} ${description}`)) {
      setStep("emergency")
      announce("This sounds like an emergency. Call your local emergency number.", "assertive")
      return
    }
    setStep(2)
    announce("Step 2 of 2. Check this summary.")
  }

  async function submit() {
    const amount = mode === "volunteer" ? 0 : parseAmount(amountText) ?? 0
    const communicate = demo.profile.communicate.length ? demo.profile.communicate.join(", ") : "Text"
    announce("Sending your request.")
    const result = await sendRequest({
      title: title.trim() || description.trim().slice(0, 60),
      description: description.trim(),
      category,
      mode,
      amount,
      place: place.trim(),
      minutes,
      communicate,
      needsSummary: demo.profile.needsSummary,
      shareNeeds: demo.profile.shareWithHelper,
    })
    announce(result.message, result.id ? "polite" : "assertive")
    if (!result.id) return
    clearDraft()
    router.push(`/request/${result.id}`)
  }

  if (step === "emergency") {
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <p className="kicker" style={{ color: "var(--danger)" }}>
          <span>Emergency Assistance</span>
        </p>
        <PageTitle>Get emergency help</PageTitle>
        <div className="card" style={{ borderColor: "rgba(248, 113, 113, 0.35)", background: "var(--danger-bg)", marginBottom: "1.5rem" }}>
          <p className="lede" style={{ color: "var(--ink)", margin: 0 }}>
            HelpMesh is a peer-to-peer volunteer community, not an emergency or medical dispatcher. If you are in immediate danger or require emergency medical treatment, contact official emergency services directly.
          </p>
        </div>
        <div className="row" style={{ marginBottom: "1.5rem" }}>
          <a className="btn danger" href="tel:911" style={{ fontWeight: 650 }}>
            Call 911 Now
          </a>
          <a className="btn" href="sms:911">
            Text 911
          </a>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>Your draft request is preserved if this is not an emergency.</p>
        <button type="button" className="btn quiet" onClick={() => setStep(1)}>
          ← Return to my draft request
        </button>
      </div>
    )
  }

  if (step === 2) {
    const amount = parseAmount(amountText)
    const money = amount ? formatTestMoney(amount) : ""
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <p className="steps">Step 2 of 2 · Final Review</p>
        <PageTitle>Verify request details</PageTitle>
        <p className="lede">
          Please confirm these parameters before publishing to the peer mesh. Escrow commitments lock automatically upon confirmation.
        </p>

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <ul className="timeline" style={{ margin: 0 }}>
            <li>
              <strong>Assistance need:</strong> {description}
            </li>
            <li>
              <strong>Location:</strong> {place.trim() || "Public location nearby (exact meeting point coordinated via chat)"}
            </li>
            <li>
              <strong>Compensation model:</strong>{" "}
              {mode === "volunteer" && "Volunteer · No payment involved."}
              {mode === "reward" && `Reward Escrow · Next you will lock ${money} in test USDC smart contract escrow until you confirm completion.`}
              {mode === "sponsored" && `Accessibility Fund · The community fund will sponsor up to ${money} if approved.`}
            </li>
          </ul>
        </div>

        <div className="row">
          <button type="button" className="btn primary" onClick={submit}>
            <span>{mode === "sponsored" ? "Submit to Accessibility Fund" : "Broadcast Request"}</span>
            <span className="btn-arrow-badge" aria-hidden="true">↗</span>
          </button>
          <button type="button" className="btn quiet" onClick={() => setStep(1)}>
            ← Back to edit
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      <p className="steps">Step 1 of 2 · Composition</p>
      <PageTitle>Ask for assistance</PageTitle>
      <p className="lede">Describe what you need, or pick from common pre-configured requests.</p>

      {errors.length > 0 && (
        <div className="summary" tabIndex={-1} ref={summaryRef}>
          <h2 style={{ fontSize: "1.05rem", marginTop: 0 }}>Please check the following items:</h2>
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {errors.map((error) => (
              <li key={error.id}>
                <a href={`#${error.id}`}>{error.message}</a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ marginBottom: "1.5rem" }}>
        <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          Quick Templates
        </span>
        <div className="chips" style={{ marginTop: "0.5rem" }}>
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="btn"
              style={{ minHeight: "2.2rem", padding: "0.35rem 0.85rem", fontSize: "0.8rem" }}
              onClick={() => fill(template)}
            >
              {template.label}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1.5rem" }}>
        <label className="field" htmlFor="need">
          <span>What do you need help with?</span>
          <textarea
            id="need"
            value={description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            placeholder="e.g., I'm in a wheelchair and the elevator is out of service at Platform 3..."
            aria-invalid={errors.some((error) => error.id === "need")}
            aria-describedby={errors.some((error) => error.id === "need") ? "need-error" : undefined}
          />
        </label>
        {errors.some((error) => error.id === "need") && (
          <p id="need-error" className="status bad">
            {errors.find((error) => error.id === "need")?.message}
          </p>
        )}

        <div className="field">
          <label htmlFor="place">
            <span>Where? (station, corner, building)</span>
          </label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <input
              id="place"
              style={{ flex: "1 1 200px" }}
              autoComplete="street-address"
              value={place}
              onChange={(event) => patchDraft({ place: event.target.value })}
              placeholder="e.g. Central Station, Entrance B"
            />
            <button
              type="button"
              className="btn"
              style={{ flex: "0 0 auto", minHeight: "2.85rem", padding: "0.45rem 1rem" }}
              onClick={locate}
            >
              📍 Locate me
            </button>
          </div>
        </div>

        <fieldset style={{ marginTop: "1rem" }}>
          <legend style={{ marginBottom: "0.6rem" }}>Payment &amp; Escrow Mode</legend>
          <div className="stack">
            {([
              ["volunteer", "Volunteer", "Free mutual aid. No tokens exchanged."],
              ["reward", "Reward Escrow", "You lock test USDC into an autonomous escrow until completion."],
              ["sponsored", "Accessibility Fund", "Community sponsorship pool covers the reward if eligible."],
            ] as const).map(([val, label, sub]) => (
              <label
                key={val}
                className="choice"
                style={{
                  cursor: "pointer",
                  borderColor: mode === val ? "var(--signal)" : "var(--line)",
                  background: mode === val ? "var(--surface-raised)" : "var(--surface)",
                  boxShadow: mode === val ? "0 0 16px -4px var(--accent-glow)" : "none",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                  <input
                    type="radio"
                    name="mode"
                    value={val}
                    checked={mode === val}
                    onChange={() => patchDraft({ mode: val })}
                  />
                  <div>
                    <strong>{label}</strong>
                    <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.15rem" }}>{sub}</div>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {mode !== "volunteer" && (
          <div className="field" style={{ marginTop: "1rem" }}>
            <label htmlFor="amount">Reward Amount (USDC)</label>
            <div className="chips" style={{ marginBottom: "0.5rem" }}>
              {chips.map((dollars) => (
                <button
                  key={dollars}
                  type="button"
                  aria-pressed={amountText === String(dollars)}
                  onClick={() => patchDraft({ amountText: String(dollars) })}
                >
                  ${dollars}
                </button>
              ))}
            </div>
            <input
              id="amount"
              inputMode="decimal"
              autoComplete="off"
              value={amountText}
              onChange={(event) => patchDraft({ amountText: event.target.value })}
              aria-invalid={errors.some((error) => error.id === "amount")}
              aria-describedby="amount-hint"
              placeholder="e.g. 10 or 25"
            />
            <p id="amount-hint" className="small muted">
              Specify the exact amount (e.g. 10.00). Locked into escrow on confirmation.
            </p>
          </div>
        )}
      </div>

      <button type="button" className="btn primary" onClick={review}>
        <span>Review &amp; Continue</span>
        <span className="btn-arrow-badge" aria-hidden="true">→</span>
      </button>
    </div>
  )
}
