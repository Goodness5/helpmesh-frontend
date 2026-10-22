"use client"

import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { saveProfile, useDemo } from "@/components/demo"
import { PrefsFields, usePrefs } from "@/components/prefs-fields"
import { applyPrefs } from "@/lib/prefs"
import { Users, HeartHandshake, Sparkles, ArrowRight, ArrowLeft, Check } from "lucide-react"

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
      <div className="w-full space-y-4 py-8">
        <PageTitle>How will you use HelpMesh?</PageTitle>
        <p className="text-sm font-mono text-zinc-500 animate-pulse">Initializing preferences...</p>
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
    <div className="w-full max-w-3xl mx-auto space-y-8 sm:space-y-10 py-6">
      {/* Progress Pill Indicator */}
      <div className="flex items-center gap-3">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-mono font-medium bg-[#25f497]/15 text-[#25f497] border border-[#25f497]/30">
          Step {step} of 3
        </span>
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500 font-semibold">
          {step === 1 ? "Role Preference" : step === 2 ? "Accessibility & Notes" : "Display Appearance"}
        </span>
      </div>

      {step === 1 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <PageTitle>How will you use HelpMesh?</PageTitle>
            <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
              Select your primary mode. All features and screens remain accessible regardless of your choice.
            </p>
          </div>

          <div className="space-y-4">
            {([
              ["help", "I need assistance", "Post requests for guidance, stairs, errands, or mobility support", Users],
              ["helper", "I want to offer help", "Browse nearby peer requests and accept sessions when available", HeartHandshake],
              ["fund", "I want to fund help", "Sponsor community accessibility grants with decentralized donations", Sparkles],
            ] as const).map(([value, label, desc, Icon]) => {
              const active = role === value
              return (
                <label
                  key={value}
                  className={`flex items-start gap-5 p-6 rounded-3xl border cursor-pointer font-mono transition-all duration-150 ${
                    active
                      ? "border-[#25f497] bg-zinc-900/80 shadow-[0_0_24px_rgba(37,244,151,0.12)]"
                      : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-700 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="size-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497] shrink-0">
                    <Icon className="size-7" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-base text-white font-medium">{label}</strong>
                      <input
                        type="radio"
                        name="role"
                        value={value}
                        checked={active}
                        onChange={() => setRole(value)}
                        className="accent-[#25f497] size-4"
                      />
                    </div>
                    <p className="text-xs sm:text-sm text-zinc-400 leading-normal">{desc}</p>
                  </div>
                </label>
              )
            })}
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (role) setStep(2)
                else announce("Choose one to continue.")
              }}
              className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
            >
              <span>Continue</span>
              <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
                <ArrowRight className="size-3 stroke-[2.5]" />
              </span>
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <PageTitle>What should a helper know?</PageTitle>
            <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
              Optional context to improve coordination. You control what is shared upon mutual match.
            </p>
          </div>

          <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md space-y-6">
            <div className="space-y-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Assistance Needs or Situations
              </span>
              <div className="flex flex-wrap gap-2">
                {disabilities.map(([value, label]) => {
                  const active = picked.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(picked, value, setPicked)}
                      className={`px-4 py-2 rounded-full font-mono text-xs transition-colors ${
                        active
                          ? "bg-[#25f497] text-black font-semibold"
                          : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-zinc-900">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Preferred Communication Channels
              </span>
              <div className="flex flex-wrap gap-2">
                {channels.map(([value, label]) => {
                  const active = channelsOn.includes(value)
                  return (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={active}
                      onClick={() => toggle(channelsOn, value, setChannelsOn)}
                      className={`px-4 py-2 rounded-full font-mono text-xs transition-colors ${
                        active
                          ? "bg-[#25f497] text-black font-semibold"
                          : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                      }`}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-zinc-900">
              <label htmlFor="notes" className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
                Additional notes for your matched helper
              </label>
              <textarea
                id="notes"
                rows={3}
                value={needs}
                onChange={(event) => setNeeds(event.target.value)}
                placeholder="e.g. Please speak clearly into my left ear, or meet at street level..."
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497] transition-colors"
              />
            </div>

            <label className="flex items-center gap-3 cursor-pointer text-xs font-mono text-zinc-300 hover:text-white pt-2">
              <input
                type="checkbox"
                checked={share}
                onChange={(event) => setShare(event.target.checked)}
                className="accent-[#25f497] size-4 rounded"
              />
              <span>Automatically share this note with matched helpers</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
            >
              <span>Continue to Display</span>
              <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
                <ArrowRight className="size-3 stroke-[2.5]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-xs px-6 py-3.5 rounded-full transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8">
          <div className="space-y-2">
            <PageTitle>How should the app look?</PageTitle>
            <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
              Configure high contrast, text scaling, fonts, and motion feedback to fit your visual and sensory preferences.
            </p>
          </div>

          <PrefsFields prefs={prefs} onChange={applyPrefs} />

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <button
              type="button"
              onClick={finish}
              className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
            >
              <span>Complete Setup</span>
              <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
                <Check className="size-3.5 stroke-[2.5]" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono text-xs px-6 py-3.5 rounded-full transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>Back</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
