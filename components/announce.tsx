"use client"

import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { readPrefs } from "@/lib/prefs"

type Tone = "polite" | "assertive"

type AnnounceApi = {
  polite: string
  assertive: string
  announce: (message: string, tone?: Tone) => void
}

const AnnounceContext = createContext<AnnounceApi | null>(null)

export function AnnounceProvider({ children }: { children: ReactNode }) {
  const [polite, setPolite] = useState("")
  const [assertive, setAssertive] = useState("")

  const announce = useCallback((message: string, tone: Tone = "polite") => {
    const set = tone === "assertive" ? setAssertive : setPolite
    set("")
    window.setTimeout(() => set(message), 30)
    const prefs = readPrefs()
    if (prefs.haptics && typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(tone === "assertive" ? [40, 60, 40] : [20])
    }
    if (prefs.speak && typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(message))
    }
  }, [])

  return (
    <AnnounceContext.Provider value={{ polite, assertive, announce }}>
      {children}
    </AnnounceContext.Provider>
  )
}

export function useAnnounce() {
  const api = useContext(AnnounceContext)
  return api?.announce ?? (() => {})
}

export function LiveRegions() {
  const api = useContext(AnnounceContext)
  return (
    <>
      <div role="status" aria-live="polite" className="banner">{api?.polite ?? ""}</div>
      <div role="alert" className="banner">{api?.assertive ?? ""}</div>
    </>
  )
}
