export type TextSize = "normal" | "large" | "xlarge" | "xxlarge"
export type ThemeName = "system" | "light" | "dark" | "high"
export type FontChoice = "default" | "atkinson" | "dyslexia"
export type VoiceSpeed = "slow" | "normal" | "fast"
export type FocusStyle = "default" | "thick" | "high-contrast"
export type TouchTarget = "default" | "large" | "xlarge"

export type Prefs = {
  textSize: TextSize
  theme: ThemeName
  font: FontChoice
  reduceMotion: boolean | null
  haptics: boolean
  speak: boolean
  // Enhanced accessibility options
  voiceSpeed: VoiceSpeed
  voicePitch: number // 0.5 to 2.0
  autoReadContent: boolean // Automatically read page content on navigation
  screenReaderOptimized: boolean // Extra ARIA and simplified layout
  focusStyle: FocusStyle // Focus indicator visibility
  touchTarget: TouchTarget // Touch target size
  keyboardShortcuts: boolean // Enable keyboard shortcuts
  highContrastFocus: boolean // Extra visible focus rings
  autoSpeak: boolean // Speak all announcements automatically
  largeCursor: boolean // Use large cursor (CSS)
  stickyKeys: boolean // Hold modifier keys
  switchAccess: boolean // Enable switch access mode
}

export const defaultPrefs: Prefs = {
  textSize: "normal",
  theme: "system",
  font: "default",
  reduceMotion: null,
  haptics: false,
  speak: false,
  // Enhanced defaults
  voiceSpeed: "normal",
  voicePitch: 1.0,
  autoReadContent: false,
  screenReaderOptimized: false,
  focusStyle: "default",
  touchTarget: "default",
  keyboardShortcuts: true,
  highContrastFocus: false,
  autoSpeak: false,
  largeCursor: false,
  stickyKeys: false,
  switchAccess: false,
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

  // Theme handling - apply class to both html and body for comprehensive coverage
  if (prefs.theme === "system") {
    delete root.dataset.theme
    root.classList.remove("light", "dark")
    // Let system preference take over
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    root.classList.add(prefersDark ? "dark" : "light")
  } else {
    root.dataset.theme = prefs.theme
    root.classList.remove("light", "dark")
    if (prefs.theme === "light") {
      root.classList.add("light")
    } else {
      root.classList.add("dark")
    }
  }

  // Text size
  if (prefs.textSize === "normal") delete root.dataset.text
  else root.dataset.text = prefs.textSize

  // Font choice
  if (prefs.font === "dyslexia") root.dataset.font = "dyslexia"
  else if (prefs.font === "atkinson") root.dataset.font = "atkinson"
  else delete root.dataset.font

  // Motion preferences
  if (prefs.reduceMotion === true) root.dataset.motion = "reduce"
  else if (prefs.reduceMotion === false) root.dataset.motion = "ok"
  else delete root.dataset.motion

  // Focus style
  if (prefs.focusStyle === "thick") root.dataset.focus = "thick"
  else if (prefs.focusStyle === "high-contrast") root.dataset.focus = "high-contrast"
  else delete root.dataset.focus

  // Touch targets
  if (prefs.touchTarget === "large") root.dataset.touch = "large"
  else if (prefs.touchTarget === "xlarge") root.dataset.touch = "xlarge"
  else delete root.dataset.touch

  // High contrast focus
  if (prefs.highContrastFocus) root.dataset.highfocus = "true"
  else delete root.dataset.highfocus

  // Large cursor
  if (prefs.largeCursor) root.dataset.cursor = "large"
  else delete root.dataset.cursor

  // Screen reader optimized mode
  if (prefs.screenReaderOptimized) root.dataset.screenreader = "true"
  else delete root.dataset.screenreader

  // Switch access mode
  if (prefs.switchAccess) root.dataset.switchaccess = "true"
  else delete root.dataset.switchaccess

  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(prefs))};path=/;max-age=31536000;samesite=lax`
  prefListeners.forEach((listener) => listener())
}

export function getVoiceSettings(prefs: Prefs): { rate: number; pitch: number } {
  const rateMap: Record<VoiceSpeed, number> = {
    slow: 0.75,
    normal: 1.0,
    fast: 1.4,
  }
  return {
    rate: rateMap[prefs.voiceSpeed],
    pitch: prefs.voicePitch,
  }
}
