"use client"

import { useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { applyPrefs, defaultPrefs, prefsSnapshot, subscribePrefs, type Prefs } from "@/lib/prefs"

export function usePrefs() {
  return useSyncExternalStore(subscribePrefs, prefsSnapshot, () => defaultPrefs)
}

const sizes = [
  ["normal", "Normal"],
  ["large", "Large"],
  ["xlarge", "Extra large"],
] as const

const themes = [
  ["system", "Match this device"],
  ["light", "Light"],
  ["dark", "Dark"],
  ["high", "High contrast"],
] as const

export function PrefsFields({ prefs, onChange }: { prefs: Prefs; onChange: (prefs: Prefs) => void }) {
  const announce = useAnnounce()

  function update(next: Prefs) {
    applyPrefs(next)
    onChange(next)
  }

  return (
    <>
      <fieldset>
        <legend>Text size</legend>
        <div className="chips">
          {sizes.map(([value, label]) => (
            <button key={value} type="button" className="btn" aria-pressed={prefs.textSize === value} onClick={() => update({ ...prefs, textSize: value })}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Theme</legend>
        <div className="chips">
          {themes.map(([value, label]) => (
            <button key={value} type="button" className="btn" aria-pressed={prefs.theme === value} onClick={() => update({ ...prefs, theme: value })}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend>Font</legend>
        <div className="chips">
          <button type="button" className="btn" aria-pressed={prefs.font === "default"} onClick={() => update({ ...prefs, font: "default" })}>HelpMesh</button>
          <button type="button" className="btn" aria-pressed={prefs.font === "atkinson"} onClick={() => update({ ...prefs, font: "atkinson" })}>Atkinson</button>
          <button type="button" className="btn" aria-pressed={prefs.font === "dyslexia"} onClick={() => update({ ...prefs, font: "dyslexia" })}>Lexend</button>
        </div>
      </fieldset>
      <fieldset>
        <legend>Motion and alerts</legend>
        <div className="stack">
          <label className="row"><input type="checkbox" checked={prefs.reduceMotion === true} onChange={(event) => update({ ...prefs, reduceMotion: event.target.checked })} /> Reduce motion</label>
          <label className="row"><input type="checkbox" checked={prefs.haptics} onChange={(event) => update({ ...prefs, haptics: event.target.checked })} /> Vibrate on updates</label>
          <label className="row"><input type="checkbox" checked={prefs.speak} onChange={(event) => update({ ...prefs, speak: event.target.checked })} /> Speak updates aloud</label>
        </div>
      </fieldset>
      <div className="preview">
        <p>This is sample text. The button below is the size you will tap.</p>
        <button type="button" className="btn primary" onClick={() => announce("This is a sample button.")}>Sample button</button>
      </div>
    </>
  )
}
