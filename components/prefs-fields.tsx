"use client"

import { useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { applyPrefs, defaultPrefs, prefsSnapshot, subscribePrefs, type Prefs } from "@/lib/prefs"
import { ArrowUpRight, Check, Sun, Sparkles, Type, Sliders, Eye, Hand, Volume2 } from "lucide-react"

export function usePrefs() {
  return useSyncExternalStore(subscribePrefs, prefsSnapshot, () => defaultPrefs)
}

const sizes = [
  ["normal", "Normal (100%)"],
  ["large", "Large (+25%)"],
  ["xlarge", "Extra Large (+50%)"],
  ["xxlarge", "Maximum (+75%)"],
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

const voiceSpeeds = [
  ["slow", "Slow (0.75x)"],
  ["normal", "Normal (1x)"],
  ["fast", "Fast (1.4x)"],
] as const

const focusStyles = [
  ["default", "Standard"],
  ["thick", "Thick Border"],
  ["high-contrast", "High Visibility"],
] as const

const touchTargets = [
  ["default", "Standard (44px)"],
  ["large", "Large (48px)"],
  ["xlarge", "Extra Large (56px)"],
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
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Sun className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Display Theme
          </h3>
        </div>

        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Display theme selection">
          {themes.map(([value, label]) => {
            const active = prefs.theme === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  update({ ...prefs, theme: value })
                  announce(`Theme changed to ${label}`)
                }}
                className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 min-h-[44px] ${
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
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Type className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Text Sizing
          </h3>
        </div>

        <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Text size selection">
          {sizes.map(([value, label]) => {
            const active = prefs.textSize === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  update({ ...prefs, textSize: value })
                  announce(`Text size changed to ${label}`)
                }}
                className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 min-h-[44px] ${
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
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Sparkles className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Typography &amp; Legibility
          </h3>
        </div>

        <div className="space-y-3" role="radiogroup" aria-label="Font selection">
          {fonts.map(([value, label, desc]) => {
            const active = prefs.font === value
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => {
                  update({ ...prefs, font: value })
                  announce(`Font changed to ${label}`)
                }}
                className={`w-full text-left p-4 rounded-2xl border transition-all duration-150 font-mono min-h-[60px] ${
                  active
                    ? "border-[#25f497] bg-zinc-900/80 shadow-[0_0_18px_rgba(37,244,151,0.1)]"
                    : "border-zinc-800 bg-zinc-900/40 hover:border-zinc-700 hover:bg-zinc-900/60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <strong className="block text-sm text-white font-medium">{label}</strong>
                  {active && <Check className="size-4 text-[#25f497]" aria-hidden="true" />}
                </div>
                <p className="text-xs text-zinc-400 mt-1">{desc}</p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Voice & Speech Settings */}
      <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Volume2 className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-mono font-medium text-white tracking-tight">
              Voice &amp; Speech
            </h3>
            <p className="text-xs text-zinc-500">For blind users and hands-free navigation</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Voice Speed */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Speech Speed</label>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Voice speed selection">
              {voiceSpeeds.map(([value, label]) => {
                const active = prefs.voiceSpeed === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      update({ ...prefs, voiceSpeed: value })
                      announce(`Speech speed set to ${label}`)
                    }}
                    className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 min-h-[44px] ${
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

          {/* Voice Pitch Slider */}
          <div className="space-y-2">
            <label htmlFor="voice-pitch" className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
              Voice Pitch: {prefs.voicePitch.toFixed(1)}
            </label>
            <input
              id="voice-pitch"
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={prefs.voicePitch}
              onChange={(e) => update({ ...prefs, voicePitch: parseFloat(e.target.value) })}
              className="w-full h-3 rounded-full appearance-none bg-zinc-800 accent-[#25f497]"
              aria-valuemin={0.5}
              aria-valuemax={2}
              aria-valuenow={prefs.voicePitch}
            />
          </div>

          <div className="space-y-3 font-mono text-xs pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.speak}
                onChange={(event) => {
                  update({ ...prefs, speak: event.target.checked })
                  announce(event.target.checked ? "Speech announcements enabled" : "Speech announcements disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
                aria-describedby="speak-desc"
              />
              <span id="speak-desc">Enable speech announcements for all updates</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.autoReadContent}
                onChange={(event) => {
                  update({ ...prefs, autoReadContent: event.target.checked })
                  announce(event.target.checked ? "Auto-read content enabled" : "Auto-read content disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
                aria-describedby="autoread-desc"
              />
              <span id="autoread-desc">Automatically read page content on navigation</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.autoSpeak}
                onChange={(event) => {
                  update({ ...prefs, autoSpeak: event.target.checked })
                  announce(event.target.checked ? "Auto-speak enabled" : "Auto-speak disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
                aria-describedby="autospeak-desc"
              />
              <span id="autospeak-desc">Speak all button labels and notifications</span>
            </label>
          </div>
        </div>
      </div>

      {/* Focus & Navigation */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Eye className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-mono font-medium text-white tracking-tight">
              Focus &amp; Navigation
            </h3>
            <p className="text-xs text-zinc-500">For keyboard and switch navigation</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Focus Style */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Focus Indicator Style</label>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Focus style selection">
              {focusStyles.map(([value, label]) => {
                const active = prefs.focusStyle === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      update({ ...prefs, focusStyle: value })
                      announce(`Focus style set to ${label}`)
                    }}
                    className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 min-h-[44px] ${
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

          <div className="space-y-3 font-mono text-xs pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.highContrastFocus}
                onChange={(event) => {
                  update({ ...prefs, highContrastFocus: event.target.checked })
                  announce(event.target.checked ? "High contrast focus enabled" : "High contrast focus disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
              />
              <span>Extra visible focus rings with glow effect</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.keyboardShortcuts}
                onChange={(event) => {
                  update({ ...prefs, keyboardShortcuts: event.target.checked })
                  announce(event.target.checked ? "Keyboard shortcuts enabled" : "Keyboard shortcuts disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
              />
              <span>Enable keyboard shortcuts (Alt+V for voice, etc.)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.screenReaderOptimized}
                onChange={(event) => {
                  update({ ...prefs, screenReaderOptimized: event.target.checked })
                  announce(event.target.checked ? "Screen reader mode enabled" : "Screen reader mode disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
              />
              <span>Screen reader optimized mode (simplified layout)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Motor & Physical Accessibility */}
      <div className="rounded-3xl border border-[#25f497]/30 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-[#25f497]/10 border border-[#25f497]/30 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Hand className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-mono font-medium text-white tracking-tight">
              Motor &amp; Physical Access
            </h3>
            <p className="text-xs text-zinc-500">For users with limited hand mobility or dexterity</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Touch Target Size */}
          <div className="space-y-2">
            <label className="text-xs font-mono text-zinc-400 uppercase tracking-wider">Touch Target Size</label>
            <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Touch target size selection">
              {touchTargets.map(([value, label]) => {
                const active = prefs.touchTarget === value
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => {
                      update({ ...prefs, touchTarget: value })
                      announce(`Touch targets set to ${label}`)
                    }}
                    className={`px-4 py-2 rounded-full font-mono text-xs transition-all duration-150 min-h-[44px] ${
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

          <div className="space-y-3 font-mono text-xs pt-2">
            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.largeCursor}
                onChange={(event) => {
                  update({ ...prefs, largeCursor: event.target.checked })
                  announce(event.target.checked ? "Large cursor enabled" : "Large cursor disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
              />
              <span>Large cursor for easier tracking</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.stickyKeys}
                onChange={(event) => {
                  update({ ...prefs, stickyKeys: event.target.checked })
                  announce(event.target.checked ? "Sticky keys hint enabled" : "Sticky keys hint disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
              />
              <span>Sticky keys support (hold modifier keys)</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
              <input
                type="checkbox"
                checked={prefs.switchAccess}
                onChange={(event) => {
                  update({ ...prefs, switchAccess: event.target.checked })
                  announce(event.target.checked ? "Switch access mode enabled" : "Switch access mode disabled")
                }}
                className="accent-[#25f497] size-5 rounded"
              />
              <span>Switch access mode (extra large targets, thick borders)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Motion, Sensory & Feedback */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/80 p-6 sm:p-8 backdrop-blur-md space-y-4">
        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
          <div className="size-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-[#25f497]" aria-hidden="true">
            <Sliders className="size-4" />
          </div>
          <h3 className="text-base font-mono font-medium text-white tracking-tight">
            Motion &amp; Sensory Feedback
          </h3>
        </div>

        <div className="space-y-3.5 font-mono text-xs">
          <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
            <input
              type="checkbox"
              checked={prefs.reduceMotion === true}
              onChange={(event) => {
                update({ ...prefs, reduceMotion: event.target.checked })
                announce(event.target.checked ? "Motion reduced" : "Motion restored")
              }}
              className="accent-[#25f497] size-5 rounded"
            />
            <span>Reduce motion (disable animations and transitions)</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer text-zinc-300 hover:text-white min-h-[44px]">
            <input
              type="checkbox"
              checked={prefs.haptics}
              onChange={(event) => {
                update({ ...prefs, haptics: event.target.checked })
                announce(event.target.checked ? "Haptic feedback enabled" : "Haptic feedback disabled")
              }}
              className="accent-[#25f497] size-5 rounded"
            />
            <span>Haptic feedback (vibration on mobile devices)</span>
          </label>
        </div>
      </div>

      {/* Interactive Preview */}
      <div className="rounded-3xl border border-zinc-800/80 bg-zinc-950/60 p-6 sm:p-8 backdrop-blur-sm space-y-4">
        <span className="text-xs font-mono uppercase tracking-widest text-[#25f497]">
          Interactive Preview
        </span>
        <p className="text-sm font-mono text-zinc-300 leading-relaxed">
          Test your settings with these interactive elements. Tab through them to check focus visibility.
        </p>
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => announce("Primary button activated successfully.")}
            className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-mono font-semibold px-6 py-3 rounded-full transition-all duration-150 hover:scale-[1.02] active:scale-[0.98] text-xs shadow-[0_0_20px_rgba(37,244,151,0.2)] min-h-[48px]"
            aria-label="Test primary button"
          >
            <span>Primary Button</span>
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => announce("Secondary button activated.")}
            className="inline-flex items-center gap-2 border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 font-mono font-medium px-6 py-3 rounded-full transition-colors text-xs min-h-[48px]"
            aria-label="Test secondary button"
          >
            Secondary Button
          </button>
        </div>
      </div>
    </div>
  )
}
