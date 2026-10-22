"use client"

import { useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { applyPrefs, defaultPrefs, prefsSnapshot, subscribePrefs, type Prefs } from "@/lib/prefs"
import { ArrowUpRight, Check, Sun, Sparkles, Type, Sliders } from "lucide-react"

export function usePrefs() {
  return useSyncExternalStore(subscribePrefs, prefsSnapshot, () => defaultPrefs)
}

const sizes = [
  ["normal", "Normal (100%)"],
  ["large", "Large (+25%)"],
  ["xlarge", "Extra Large (+50%)"],
] as const

const themes = [
  ["system", "System Default"],
  ["light", "Light"],
  ["dark", "Dark (Pitch Black)"],
  ["high", "High Contrast"],
] as const

const fonts = [
  ["default", "Geist Mono", "Primary cyber-minimalist monospace"],
  ["atkinson", "Atkinson Hyperlegible", "Designed for low vision & reading proficiency"],
  ["dyslexia", "Lexend", "Optimized for dyslexia & cognitive processing"],
] as const

export function PrefsFields({ prefs, onChange }: { prefs: Prefs; onChange: (prefs: Prefs) => void }) {
  const announce = useAnnounce()

  function update(next: Prefs) {
    applyPrefs(next)
    onChange(next)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Display Theme */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <Sun className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Display Theme
          </h3>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {themes.map(([value, label]) => {
            const active = prefs.theme === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => update({ ...prefs, theme: value })}
                className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 ${
                  active
                    ? "bg-[#25f497] text-black font-semibold shadow-[0_0_16px_rgba(37,244,151,0.25)]"
                    : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Text Sizing */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <Type className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Text Sizing
          </h3>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {sizes.map(([value, label]) => {
            const active = prefs.textSize === value
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                onClick={() => update({ ...prefs, textSize: value })}
                className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 ${
                  active
                    ? "bg-[#25f497] text-black font-semibold shadow-[0_0_16px_rgba(37,244,151,0.25)]"
                    : "border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                {label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Typography & Legibility */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <Sparkles className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Typography &amp; Legibility
          </h3>
        </div>

        <div className="space-y-3">
          {fonts.map(([value, label, desc]) => {
            const active = prefs.font === value
            return (
              <button
                key={value}
                type="button"
                onClick={() => update({ ...prefs, font: value })}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 font-mono ${
                  active
                    ? "border-[#25f497] bg-zinc-900/80 shadow-[0_0_18px_rgba(37,244,151,0.1)]"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-sm text-white font-medium">{label}</strong>
                  {active && <Check className="size-4 text-[#25f497]" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Motion, Sensory & Feedback */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]">
            <Sliders className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Motion &amp; Sensory Feedback
          </h3>
        </div>

        <div className="space-y-3.5 font-mono text-xs">
          <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white">
            <input
              type="checkbox"
              checked={prefs.reduceMotion === true}
              onChange={(event) => update({ ...prefs, reduceMotion: event.target.checked })}
              className="accent-[#25f497] size-4 rounded"
            />
            <span>Reduce motion (disable vector mesh sweep and scale transitions)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white">
            <input
              type="checkbox"
              checked={prefs.haptics}
              onChange={(event) => update({ ...prefs, haptics: event.target.checked })}
              className="accent-[#25f497] size-4 rounded"
            />
            <span>Haptic feedback on transaction events and confirmations</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white">
            <input
              type="checkbox"
              checked={prefs.speak}
              onChange={(event) => update({ ...prefs, speak: event.target.checked })}
              className="accent-[#25f497] size-4 rounded"
            />
            <span>Audio speech announcements for dynamic screen updates</span>
          </label>
        </div>
      </div>

      {/* Interactive Preview */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-6 sm:p-8 backdrop-blur-sm space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[#25f497]">
          Interactive Preview
        </span>
        <p className="text-sm font-mono text-zinc-300 leading-relaxed">
          Sample typography reflecting active font selection and scale. The button below confirms tactile feedback and accessible focus styling.
        </p>
        <button
          type="button"
          onClick={() => announce("Sample button pressed successfully.")}
          className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] text-xs shadow-[0_0_20px_rgba(37,244,151,0.2)]"
        >
          <span>Sample Primary Button</span>
          <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
            <ArrowUpRight className="size-3 stroke-[2.5]" />
          </span>
        </button>
      </div>
    </div>
  )
}
