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
      <>
        <PageTitle>Get emergency help</PageTitle>
        <p className="lede">HelpMesh is not an emergency or medical service. If you are in danger, contact local emergency services.</p>
        <div className="row">
          <a className="btn primary" href="tel:911">Call 911</a>
          <a className="btn" href="sms:911">Text 911</a>
        </div>
        <p>Your words are still here if this is not an emergency.</p>
        <button type="button" className="btn" onClick={() => setStep(1)}>This is not an emergency</button>
      </>
    )
  }

  if (step === 2) {
    const amount = parseAmount(amountText)
    const money = amount ? formatTestMoney(amount) : ""
    return (
      <>
        <p className="steps">Step 2 of 2</p>
        <PageTitle>Check this before you send</PageTitle>
        <ul className="timeline">
          <li>{description}</li>
          <li>{place.trim() || "No place yet. Meet in a public spot if you can."}</li>
          <li>{mode === "volunteer" && "Volunteer. No payment."}</li>
          <li>{mode === "reward" && `Next you will hold ${money} of test money. It is paid only after you confirm the help.`}</li>
          <li>{mode === "sponsored" && `The fund may pay ${money}. This is the fund's money, not yours.`}</li>
        </ul>
        <div className="row">
          <button type="button" className="btn primary" onClick={submit}>{mode === "sponsored" ? "Ask the fund to cover this" : "Send request"}</button>
          <button type="button" className="btn quiet" onClick={() => setStep(1)}>Go back and edit</button>
        </div>
      </>
    )
  }

  return (
    <>
      <p className="steps">Step 1 of 2</p>
      <PageTitle>Ask for help</PageTitle>
      <p>Write what you need, or start from a common request.</p>
      {errors.length > 0 && (
        <div className="summary" tabIndex={-1} ref={summaryRef}>
          <h2>Please fix the following</h2>
          <ul>
            {errors.map((error) => (
              <li key={error.id}><a href={`#${error.id}`}>{error.message}</a></li>
            ))}
          </ul>
        </div>
      )}
      <div className="stack">
        {TEMPLATES.map((template) => (
          <button key={template.id} type="button" className="btn" onClick={() => fill(template)}>{template.label}</button>
        ))}
      </div>
      <h2>Your request</h2>
      <label className="field" htmlFor="need">
        <span>What do you need?</span>
        <textarea id="need" value={description} onChange={(event) => patchDraft({ description: event.target.value })} aria-invalid={errors.some((error) => error.id === "need")} aria-describedby={errors.some((error) => error.id === "need") ? "need-error" : undefined} />
      </label>
      {errors.some((error) => error.id === "need") && <p id="need-error" className="status bad">{errors.find((error) => error.id === "need")?.message}</p>}
      <label className="field" htmlFor="place">
        <span>Where?</span>
        <input id="place" autoComplete="street-address" value={place} onChange={(event) => patchDraft({ place: event.target.value })} />
      </label>
      <button type="button" className="btn quiet" onClick={locate}>Use my location</button>
      <fieldset>
        <legend>How should this be helped?</legend>
        <div className="stack">
          {([
            ["volunteer", "Free. No payment."],
            ["reward", "Reward. You hold test money until you confirm the help."],
            ["sponsored", "Fund. A community fund may pay."],
          ] as const).map(([value, label]) => (
            <label key={value}><input type="radio" name="mode" value={value} checked={mode === value} onChange={() => patchDraft({ mode: value })} /> {label}</label>
          ))}
        </div>
      </fieldset>
      {mode !== "volunteer" && (
        <div className="field">
          <label htmlFor="amount">Amount</label>
          <div className="chips">
            {chips.map((dollars) => (
              <button key={dollars} type="button" className="btn" aria-pressed={amountText === String(dollars)} onClick={() => patchDraft({ amountText: String(dollars) })}>${dollars}</button>
            ))}
          </div>
          <input id="amount" inputMode="decimal" autoComplete="off" value={amountText} onChange={(event) => patchDraft({ amountText: event.target.value })} aria-invalid={errors.some((error) => error.id === "amount")} aria-describedby="amount-hint" />
          <p id="amount-hint" className="small muted">Use 10 or 10.50.</p>
        </div>
      )}
      <button type="button" className="btn primary" onClick={review}>Continue</button>
    </>
  )
}
