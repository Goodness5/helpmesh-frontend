export type TextSize = "normal" | "large" | "xlarge"
export type ThemeName = "system" | "light" | "dark" | "high"
export type FontChoice = "default" | "atkinson" | "dyslexia"

export type Prefs = {
  textSize: TextSize
  theme: ThemeName
  font: FontChoice
  reduceMotion: boolean | null
  haptics: boolean
  speak: boolean
}

export const defaultPrefs: Prefs = {
  textSize: "normal",
  theme: "system",
  font: "default",
  reduceMotion: null,
  haptics: false,
  speak: false,
}

const COOKIE = "hm"
const prefListeners = new Set<() => void>()
let cachedPrefs = defaultPrefs
let prefsLoaded = false

export function subscribePrefs(listener: () => void) {
  prefListeners.add(listener)
  return () => prefListeners.delete(listener)
}

export function prefsSnapshot(): Prefs {
  if (!prefsLoaded && typeof document !== "undefined") {
    prefsLoaded = true
    cachedPrefs = readPrefs()
  }
  return cachedPrefs
}

export function readPrefs(): Prefs {
  if (typeof document === "undefined") return defaultPrefs
  const match = document.cookie.match(/(?:^|; )hm=([^;]*)/)
  if (!match?.[1]) return defaultPrefs
  try {
    const parsed = JSON.parse(decodeURIComponent(match[1])) as Partial<Prefs>
    return { ...defaultPrefs, ...parsed }
  } catch {
    return defaultPrefs
  }
}

export function applyPrefs(prefs: Prefs) {
  cachedPrefs = prefs
  prefsLoaded = true
  const root = document.documentElement
  if (prefs.theme === "system") delete root.dataset.theme
  else root.dataset.theme = prefs.theme
  if (prefs.textSize === "normal") delete root.dataset.text
  else root.dataset.text = prefs.textSize
  if (prefs.font === "dyslexia") root.dataset.font = "dyslexia"
  else if (prefs.font === "atkinson") root.dataset.font = "atkinson"
  else delete root.dataset.font
  if (prefs.reduceMotion === true) root.dataset.motion = "reduce"
  else if (prefs.reduceMotion === false) root.dataset.motion = "ok"
  else delete root.dataset.motion
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(prefs))};path=/;max-age=31536000;samesite=lax`
  prefListeners.forEach((listener) => listener())
}
