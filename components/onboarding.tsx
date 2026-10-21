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
  ["text", "Text"],
  ["voice", "Voice"],
  ["gestures", "Gestures"],
  ["sign_language", "Sign language"],
  ["written_notes", "Written notes"],
] as const

export function Onboarding() {
  const demo = useDemo()
  if (!demo.ready) {
    return (
      <>
        <p className="steps">Step 1 of 3</p>
        <PageTitle>How will you use HelpMesh?</PageTitle>
      </>
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
    <>
      <p className="steps">Step {step} of 3</p>
      {step === 1 && (
        <>
          <PageTitle>How will you use HelpMesh?</PageTitle>
          <fieldset>
            <legend>Choose one. You can still use the other pages.</legend>
            <div className="stack">
              {([
                ["help", "I need help"],
                ["helper", "I want to help"],
                ["fund", "I want to fund help"],
              ] as const).map(([value, label]) => (
                <label key={value} className="choice">
                  <span><input type="radio" name="role" value={value} checked={role === value} onChange={() => setRole(value)} /> {label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="button" className="btn primary" onClick={() => { if (role) setStep(2); else announce("Choose one to continue.") }}>Continue</button>
        </>
      )}
      {step === 2 && (
        <>
          <PageTitle>What should a helper know?</PageTitle>
          <p>All of this is optional. Skip it if you want.</p>
          <fieldset>
            <legend>Anything you want to share</legend>
            <div className="chips">
              {disabilities.map(([value, label]) => (
                <button key={value} type="button" className="btn" aria-pressed={picked.includes(value)} onClick={() => toggle(picked, value, setPicked)}>{label}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>How should people communicate with you?</legend>
            <div className="chips">
              {channels.map(([value, label]) => (
                <button key={value} type="button" className="btn" aria-pressed={channelsOn.includes(value)} onClick={() => toggle(channelsOn, value, setChannelsOn)}>{label}</button>
              ))}
            </div>
          </fieldset>
          <label className="field">
            <span>A short note</span>
            <textarea value={needs} onChange={(event) => setNeeds(event.target.value)} />
          </label>
          <label className="row">
            <input type="checkbox" checked={share} onChange={(event) => setShare(event.target.checked)} />
            Show this note to a helper after you match
          </label>
          <div className="row">
            <button type="button" className="btn primary" onClick={() => setStep(3)}>Continue</button>
            <button type="button" className="btn quiet" onClick={() => { setPicked([]); setChannelsOn([]); setNeeds(""); setShare(false); setStep(3) }}>Skip for now</button>
          </div>
        </>
      )}
      {step === 3 && (
        <>
          <PageTitle>How should the app look?</PageTitle>
          <PrefsFields prefs={prefs} onChange={applyPrefs} />
          <button type="button" className="btn primary" onClick={finish}>Save and finish</button>
        </>
      )}
    </>
  )
}
