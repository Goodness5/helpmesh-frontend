"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { useMesh } from "@/lib/mesh-context"
import { formatTestMoney, looksLikeEmergency, parseAmount, TEMPLATES, type Mode } from "@/lib/model"
import {
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  HeartHandshake,
  Sparkles,
  Layers,
  Footprints,
  Compass,
  Eye,
  Radio,
} from "lucide-react"
import { LocationPicker } from "@/components/location-picker"

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
    if (raw) draft = { ...blank, ...(JSON.parse(raw) as Partial<DraftForm>) }
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

function TemplateIcon({ id }: { id: string }) {
  switch (id) {
    case "stairs":
      return <Layers className="size-4" />
    case "crossing":
      return <Footprints className="size-4" />
    case "transit":
      return <Compass className="size-4" />
    case "reading":
      return <Eye className="size-4" />
    default:
      return <Radio className="size-4" />
  }
}

export function NewRequest() {
  const router = useRouter()
  const announce = useAnnounce()
  const mesh = useMesh()
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
    announce("Sending your request.")
    const result = await mesh.createRequest({
      title: title.trim() || description.trim().slice(0, 60),
      description: description.trim(),
      category,
      mode,
      amount,
      place: place.trim(),
      minutes,
      communicate: "Text", // Default to text
    })
    announce(result.message, result.ok ? "polite" : "assertive")
    if (!result.ok || !result.id) return
    clearDraft()
    router.push(`/request/${result.id}`)
  }

  if (step === "emergency") {
    return (
      <div className="w-full max-w-3xl mx-auto space-y-8 sm:space-y-10 py-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-red-500/30 bg-red-950/40 text-xs font-mono uppercase tracking-widest text-red-400">
            <AlertTriangle className="size-3.5" />
            <span>Emergency Assistance Notice</span>
          </div>
          <PageTitle>Get emergency help</PageTitle>
        </div>

        <div className="rounded-3xl border border-red-500/30 bg-red-950/20 p-7 sm:p-9 backdrop-blur-sm space-y-4">
          <div className="size-16 rounded-2xl bg-red-950/60 border border-red-500/40 flex items-center justify-center text-red-400">
            <AlertTriangle className="size-8" />
          </div>
          <p className="text-base sm:text-lg font-mono text-zinc-200 leading-relaxed max-w-2xl">
            HelpMesh is a peer-to-peer volunteer community, not an emergency or medical dispatcher. If you are in immediate danger or require emergency medical treatment, contact official emergency services directly.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <a
            href="tel:911"
            className="inline-flex items-center gap-2.5 bg-red-500 hover:bg-red-400 text-black font-mono font-bold px-7 py-3.5 rounded-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
          >
            <PhoneCall className="size-4" />
            <span>Call 911 Now</span>
          </a>
          <a
            href="sms:911"
            className="inline-flex items-center gap-2.5 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 font-mono font-medium px-6 py-3.5 rounded-full transition-colors"
          >
            <MessageSquare className="size-4" />
            <span>Text 911</span>
          </a>
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-white transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <span>Return to my draft request</span>
          </button>
        </div>
      </div>
    )
  }

  if (step === 2) {
    const amount = parseAmount(amountText)
    const money = amount ? formatTestMoney(amount) : ""
    return (
      <div className="w-full max-w-3xl mx-auto space-y-8 sm:space-y-10 py-6">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
            <span className="size-2 rounded-full bg-[#25f497]" />
            <span>Step 2 of 2 · Final Review</span>
          </div>
          <PageTitle>Verify request details</PageTitle>
          <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
            Please confirm these parameters before publishing to the peer mesh. Escrow commitments lock automatically upon confirmation.
          </p>
        </div>

        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex items-center gap-4 pb-5 border-b border-zinc-900">
            <div className="size-14 rounded-2xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]">
              <ShieldCheck className="size-8 stroke-[1.8]" />
            </div>
            <div>
              <h2 className="text-xl font-mono font-medium text-white tracking-tight">
                Escrow &amp; Dispatch Summary
              </h2>
              <p className="text-xs font-mono text-zinc-500">Autonomous settlement on Base Sepolia</p>
            </div>
          </div>

          <div className="space-y-4 font-mono text-sm divide-y divide-zinc-900">
            <div className="pt-2 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <span className="text-zinc-500 shrink-0">Assistance need:</span>
              <span className="text-zinc-200 text-right">{description}</span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <span className="text-zinc-500 shrink-0">Location:</span>
              <span className="text-zinc-200 text-right">
                {place.trim() || "Public location nearby (exact meeting point coordinated via chat)"}
              </span>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
              <span className="text-zinc-500 shrink-0">Compensation model:</span>
              <span className="text-[#25f497] text-right font-medium">
                {mode === "volunteer" && "Volunteer · No payment involved ($0.00)"}
                {mode === "reward" && `Reward Escrow · Locks ${money} in smart contract`}
                {mode === "sponsored" && `Accessibility Fund · Treasury covers up to ${money}`}
              </span>
            </div>
          </div>
        </div>

        {/* Zero-Data Privacy & Cryptographic Security Disclosure */}
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/60 p-5 sm:p-6 space-y-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs font-mono text-[#25f497]">
            <ShieldCheck className="size-4" />
            <span className="uppercase tracking-widest font-semibold">Zero Centralized Data Collection · 100% Private</span>
          </div>
          <p className="text-xs font-mono text-zinc-400 leading-relaxed">
            HelpMesh collects no personal telemetry, emails, or phone records on central servers. Escrows execute autonomously via Base Sepolia smart contracts, and real-time audio/video and location streams are peer-to-peer (P2P) and vanish the moment your session completes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={submit}
            className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
          >
            <span>{mode === "sponsored" ? "Submit to Accessibility Fund" : "Broadcast Request"}</span>
            <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
              <ArrowUpRight className="size-3 stroke-[2.5]" />
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStep(1)}
            className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono font-medium px-6 py-3.5 rounded-full transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Back to edit</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 sm:space-y-10 py-6">
      {/* Header Eyebrow */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full border border-zinc-800 bg-zinc-950/70 text-xs font-mono uppercase tracking-widest text-[#25f497]">
          <span className="size-2 rounded-full bg-[#25f497]" />
          <span>Step 1 of 2 · Composition</span>
        </div>
        <PageTitle>Ask for assistance</PageTitle>
        <p className="text-sm sm:text-base font-mono text-zinc-400 max-w-2xl leading-relaxed">
          Describe what you need, or select one of the common pre-configured requests below.
        </p>
      </div>

      {errors.length > 0 && (
        <div
          tabIndex={-1}
          ref={summaryRef}
          className="rounded-2xl border border-red-500/40 bg-red-950/30 p-5 font-mono text-sm text-red-200 space-y-2 focus:outline-none"
        >
          <h2 className="font-semibold text-red-300">Please check the following items:</h2>
          <ul className="list-disc pl-5 space-y-1">
            {errors.map((error) => (
              <li key={error.id}>
                <a href={`#${error.id}`} className="underline hover:text-white">
                  {error.message}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Templates Chips */}
      <div className="space-y-3">
        <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Quick Templates
        </span>
        <div className="flex flex-wrap gap-2.5">
          {TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => fill(template)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-800 bg-zinc-900/70 hover:bg-zinc-800/90 text-zinc-300 hover:text-white font-mono text-xs transition-all duration-150 hover:border-zinc-700 hover:scale-[1.02]"
            >
              <TemplateIcon id={template.id} />
              <span>{template.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Request Details Form Card */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-7 sm:p-9 backdrop-blur-md shadow-xl space-y-6">
        {/* Description Field */}
        <div className="space-y-2">
          <label htmlFor="need" className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
            What do you need help with?
          </label>
          <textarea
            id="need"
            rows={3}
            value={description}
            onChange={(event) => patchDraft({ description: event.target.value })}
            placeholder="e.g., I'm in a wheelchair and the elevator is out of service at Platform 3..."
            aria-invalid={errors.some((error) => error.id === "need")}
            aria-describedby={errors.some((error) => error.id === "need") ? "need-error" : undefined}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497] transition-colors resize-y"
          />
          {errors.some((error) => error.id === "need") && (
            <p id="need-error" className="text-xs font-mono text-red-400">
              {errors.find((error) => error.id === "need")?.message}
            </p>
          )}
        </div>

        {/* Location Field */}
        <div className="space-y-2">
          <label htmlFor="place" className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
            Where? (search address or use GPS)
          </label>
          <LocationPicker
            value={place}
            onChange={(newPlace) => patchDraft({ place: newPlace })}
            placeholder="Search for a location or use GPS..."
          />
        </div>

        {/* Mode Selector */}
        <div className="space-y-3 pt-2">
          <span className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
            Payment &amp; Escrow Mode
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {([
              ["volunteer", "Volunteer", "Free mutual aid. No tokens exchanged.", HeartHandshake],
              ["reward", "Reward Escrow", "Lock USDC into smart contract escrow.", ShieldCheck],
              ["sponsored", "Accessibility Fund", "Community pool covers the reward.", Sparkles],
            ] as const).map(([val, label, sub, Icon]) => {
              const active = mode === val
              return (
                <label
                  key={val}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl border cursor-pointer font-mono transition-all duration-150 ${
                    active
                      ? "border-[#25f497] bg-zinc-900/80 shadow-[0_0_20px_rgba(37,244,151,0.12)]"
                      : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <Icon className={`size-6 ${active ? "text-[#25f497]" : "text-zinc-500"}`} />
                    <input
                      type="radio"
                      name="mode"
                      value={val}
                      checked={active}
                      onChange={() => patchDraft({ mode: val })}
                      className="accent-[#25f497]"
                    />
                  </div>
                  <div className="space-y-1">
                    <strong className="block text-sm text-white font-medium">{label}</strong>
                    <p className="text-xs text-zinc-400 leading-normal">{sub}</p>
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Amount Input for Paid Modes */}
        {mode !== "volunteer" && (
          <div className="space-y-3 pt-2 border-t border-zinc-900">
            <label htmlFor="amount" className="block text-xs font-mono uppercase tracking-widest text-zinc-400">
              Reward Amount (USDC)
            </label>
            <div className="flex flex-wrap gap-2">
              {chips.map((dollars) => (
                <button
                  key={dollars}
                  type="button"
                  aria-pressed={amountText === String(dollars)}
                  onClick={() => patchDraft({ amountText: String(dollars) })}
                  className={`px-4 py-1.5 rounded-full font-mono text-xs transition-colors ${
                    amountText === String(dollars)
                      ? "bg-[#25f497] text-black font-semibold"
                      : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                  }`}
                >
                  ${dollars}
                </button>
              ))}
            </div>
            <div className="max-w-xs">
              <input
                id="amount"
                inputMode="decimal"
                autoComplete="off"
                value={amountText}
                onChange={(event) => patchDraft({ amountText: event.target.value })}
                aria-invalid={errors.some((error) => error.id === "amount")}
                aria-describedby="amount-hint"
                placeholder="e.g. 10 or 25"
                className="w-full bg-zinc-900/90 border border-zinc-800 rounded-2xl px-4 py-3 font-mono text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#25f497] transition-colors"
              />
            </div>
            <p id="amount-hint" className="text-xs font-mono text-zinc-500">
              Locked into escrow on confirmation. Released upon verified completion.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={review}
          className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)]"
        >
          <span>Review &amp; Continue</span>
          <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
            <ArrowRight className="size-3 stroke-[2.5]" />
          </span>
        </button>
      </div>
    </div>
  )
}
