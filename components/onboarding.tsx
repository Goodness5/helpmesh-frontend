"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { saveProfile, useDemo } from "@/components/demo"
import { PrefsFields, usePrefs } from "@/components/prefs-fields"
import { applyPrefs } from "@/lib/prefs"

const disabilities = [
  ["blind", "Blind"],
  ["low_vision", "Low vision"],
  ["deaf", "Deaf"],
  ["hard_of_hearing", "Hard of hearing"],
  ["mobility", "Mobility"],
  ["wheelchair", "Wheelchair"],
  ["speech", "Speech"],
  ["cognitive", "Learning or memory"],
  ["elderly", "Older age"],
  ["other", "Something else"],
] as const

const channels = [
  ["text", "Text & SMS"],
  ["voice", "Voice Call"],
  ["gestures", "Visual Gestures"],
  ["sign_language", "Sign Language"],
  ["written_notes", "Written Notes"],
] as const

export function Onboarding() {
  const demo = useDemo()
  if (!demo.ready) {
    return (
      <div style={{ marginTop: "1.5rem" }}>
        <p className="steps">Setup Flow · Initializing</p>
        <PageTitle>How will you use HelpMesh?</PageTitle>
        <p className="lede">Loading profile state...</p>
      </div>
    )
  }
  return <OnboardingForm />
}

function OnboardingForm() {
  const router = useRouter()
  const announce = useAnnounce()
  const demo = useDemo()
  const prefs = usePrefs()
  const [step, setStep] = useState(1)
  const [role, setRole] = useState(demo.profile.role)
  const [picked, setPicked] = useState<string[]>(demo.profile.disabilities)
  const [channelsOn, setChannelsOn] = useState<string[]>(demo.profile.communicate)
  const [needs, setNeeds] = useState(demo.profile.needsSummary)
  const [share, setShare] = useState(demo.profile.shareWithHelper)

  useEffect(() => {
    const titles = ["How will you use HelpMesh?", "What should a helper know?", "How should the app look?"]
    announce(`Step ${step} of 3. ${titles[step - 1]}`)
  }, [announce, step])

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value])
  }

  function finish() {
    saveProfile({ role, disabilities: picked, communicate: channelsOn, needsSummary: needs, shareWithHelper: share })
    announce("Setup saved. You can change it any time.")
    router.push(role === "helper" ? "/helper" : role === "fund" ? "/fund" : "/")
  }

  return (
    <div style={{ marginTop: "1.5rem" }}>
      {/* Progress pill indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.85rem" }}>
        <span className="status-pill" style={{ color: "var(--signal)", borderColor: "rgba(37, 244, 151, 0.4)" }}>
          Step {step} of 3
        </span>
        <span style={{ fontSize: "0.75rem", color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          {step === 1 ? "Role Preference" : step === 2 ? "Accessibility & Notes" : "Display Appearance"}
        </span>
      </div>

      {step === 1 && (
        <>
          <PageTitle>How will you use HelpMesh?</PageTitle>
          <p className="lede">Select your primary mode. All features and screens remain accessible regardless of your choice.</p>

          <fieldset style={{ border: 0, padding: 0, margin: "1rem 0 1.5rem" }}>
            <legend className="steps" style={{ marginBottom: "0.6rem" }}>Choose Primary Role</legend>
            <div className="stack">
              {([
                ["help", "I need assistance", "Post requests for guidance, stairs, errands, or mobility support"],
                ["helper", "I want to offer help", "Browse nearby peer requests and accept sessions when available"],
                ["fund", "I want to fund help", "Sponsor community accessibility grants with decentralized donations"],
              ] as const).map(([value, label, desc]) => (
                <label
                  key={value}
                  className="choice"
                  style={{
                    cursor: "pointer",
                    borderColor: role === value ? "var(--signal)" : "var(--line)",
                    background: role === value ? "var(--surface-raised)" : "var(--surface)",
                    boxShadow: role === value ? "0 0 16px -4px var(--accent-glow)" : "none",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "0.75rem" }}>
                    <input
                      type="radio"
                      name="role"
                      value={value}
                      checked={role === value}
                      onChange={() => setRole(value)}
                      style={{ marginTop: "0.25rem" }}
                    />
                    <div>
                      <strong>{label}</strong>
                      <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.15rem" }}>{desc}</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (role) setStep(2)
              else announce("Choose one to continue.")
            }}
          >
            <span>Continue</span>
            <span className="btn-arrow-badge" aria-hidden="true">→</span>
          </button>
        </>
      )}

      {step === 2 && (
        <>
          <PageTitle>What should a helper know?</PageTitle>
          <p className="lede">
            Optional context to improve coordination. You control what is shared upon mutual match.
          </p>

          <div className="card" style={{ marginBottom: "1.25rem" }}>
            <span className="steps">Assistance Needs or Situations</span>
            <div className="chips" style={{ margin: "0.6rem 0 1rem" }}>
              {disabilities.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={picked.includes(value)}
                  onClick={() => toggle(picked, value, setPicked)}
                >
                  {label}
                </button>
              ))}
            </div>

            <span className="steps">Preferred Communication Channels</span>
            <div className="chips" style={{ margin: "0.6rem 0 1rem" }}>
              {channels.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={channelsOn.includes(value)}
                  onClick={() => toggle(channelsOn, value, setChannelsOn)}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="field" style={{ marginTop: "0.5rem" }}>
              <span>Additional notes for your matched helper</span>
              <textarea
                value={needs}
                onChange={(event) => setNeeds(event.target.value)}
                placeholder="e.g. Please speak clearly into my left ear, or meet at street level..."
              />
            </label>

            <label className="row" style={{ marginTop: "0.5rem" }}>
              <input
                type="checkbox"
                checked={share}
                onChange={(event) => setShare(event.target.checked)}
              />
              <span>Automatically share this note with matched helpers</span>
            </label>
          </div>

          <div className="row">
            <button type="button" className="btn primary" onClick={() => setStep(3)}>
              <span>Continue to Display</span>
              <span className="btn-arrow-badge" aria-hidden="true">→</span>
            </button>
            <button
              type="button"
              className="btn quiet"
              onClick={() => {
                setPicked([])
                setChannelsOn([])
                setNeeds("")
                setShare(false)
                setStep(3)
              }}
            >
              Skip this step
            </button>
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <PageTitle>Personalize your appearance</PageTitle>
          <p className="lede">Set theme contrast, font family, and accessibility defaults for your experience.</p>

          <PrefsFields prefs={prefs} onChange={applyPrefs} />

          <div style={{ marginTop: "1.75rem" }}>
            <button type="button" className="btn primary" onClick={finish}>
              <span>Save &amp; Enter HelpMesh</span>
              <span className="btn-arrow-badge" aria-hidden="true">✓</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
