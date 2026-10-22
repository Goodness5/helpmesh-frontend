"use client"

import { useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { applyPrefs, defaultPrefs, prefsSnapshot, subscribePrefs, type Prefs } from "@/lib/prefs"

export function usePrefs() {
  return useSyncExternalStore(subscribePrefs, prefsSnapshot, () => defaultPrefs)
}

const sizes = [
  ["normal", "Normal"],
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
  ["default", "HelpMesh Default", "Clean, modern sans"],
  ["atkinson", "Atkinson Hyperlegible", "Designed for low vision"],
  ["dyslexia", "Lexend", "Optimized for dyslexia & reading proficiency"],
] as const

export function PrefsFields({ prefs, onChange }: { prefs: Prefs; onChange: (prefs: Prefs) => void }) {
  const announce = useAnnounce()

  function update(next: Prefs) {
    applyPrefs(next)
    onChange(next)
  }

  return (
    <div style={{ display: "grid", gap: "1.25rem", marginTop: "1rem" }}>
      <div className="card">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ marginBottom: "0.6rem" }}>Display Theme</legend>
          <div className="chips">
            {themes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={prefs.theme === value}
                onClick={() => update({ ...prefs, theme: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="card">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ marginBottom: "0.6rem" }}>Text Sizing</legend>
          <div className="chips">
            {sizes.map(([value, label]) => (
              <button
                key={value}
                type="button"
                aria-pressed={prefs.textSize === value}
                onClick={() => update({ ...prefs, textSize: value })}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="card">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ marginBottom: "0.6rem" }}>Typography &amp; Legibility</legend>
          <div className="stack" style={{ gap: "0.5rem" }}>
            {fonts.map(([value, label, desc]) => (
              <button
                key={value}
                type="button"
                className="choice"
                style={{
                  cursor: "pointer",
                  textAlign: "left",
                  borderColor: prefs.font === value ? "var(--signal)" : "var(--line)",
                  background: prefs.font === value ? "var(--surface-raised)" : "var(--surface)",
                  boxShadow: prefs.font === value ? "0 0 16px -4px var(--accent-glow)" : "none",
                }}
                onClick={() => update({ ...prefs, font: value })}
              >
                <strong>{label}</strong>
                <span>{desc}</span>
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      <div className="card">
        <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
          <legend style={{ marginBottom: "0.6rem" }}>Motion, Sensory &amp; Feedback</legend>
          <div className="stack">
            <label className="row">
              <input
                type="checkbox"
                checked={prefs.reduceMotion === true}
                onChange={(event) => update({ ...prefs, reduceMotion: event.target.checked })}
              />
              <span>Reduce motion (disable canvas vector sweep and scale transitions)</span>
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={prefs.haptics}
                onChange={(event) => update({ ...prefs, haptics: event.target.checked })}
              />
              <span>Haptic vibration on transactional events &amp; updates</span>
            </label>
            <label className="row">
              <input
                type="checkbox"
                checked={prefs.speak}
                onChange={(event) => update({ ...prefs, speak: event.target.checked })}
              />
              <span>Text-to-speech audio announcements for screen changes</span>
            </label>
          </div>
        </fieldset>
      </div>

      <div className="card preview" style={{ marginTop: "0.5rem" }}>
        <span className="steps">Interactive Preview</span>
        <p style={{ margin: "0.5rem 0 1rem", fontSize: "0.95rem" }}>
          Live sample text reflecting your selected font and scale. Buttons below represent target touch sizes.
        </p>
        <button
          type="button"
          className="btn primary"
          onClick={() => announce("Sample button pressed successfully.")}
        >
          <span>Sample Primary Button</span>
          <span className="btn-arrow-badge" aria-hidden="true">↗</span>
        </button>
      </div>
    </div>
  )
}
