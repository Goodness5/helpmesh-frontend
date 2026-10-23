"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useCallback } from "react"
import { Mic, MicOff, Volume2, X, Settings, HelpCircle } from "lucide-react"
import { readPrefs, getVoiceSettings } from "@/lib/prefs"

interface SpeechRecognitionEvent {
  resultIndex: number
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string
      }
    }
  }
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start: () => void
  stop: () => void
  abort: () => void
  onresult: (event: SpeechRecognitionEvent) => void
  onerror: (event: { error: string }) => void
  onend: () => void
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance
  }
}

// Voice commands mapping for discoverability
const VOICE_COMMANDS = [
  { phrases: ["ask", "need help", "new request", "post request", "create request"], action: "Ask for Help", path: "/request/new" },
  { phrases: ["offer", "browse", "helpers", "assist someone", "help others"], action: "Offer Help", path: "/helper" },
  { phrases: ["fund", "treasury", "grant", "sponsor", "donate"], action: "Accessibility Fund", path: "/fund" },
  { phrases: ["wallet", "money", "balance", "usdc", "my funds"], action: "Wallet", path: "/wallet" },
  { phrases: ["setting", "settings", "contrast", "font", "display", "accessibility", "preferences"], action: "Settings", path: "/settings/accessibility" },
  { phrases: ["home", "main page", "start", "beginning"], action: "Home", path: "/" },
  { phrases: ["help", "principles", "manual", "guide", "how to", "instructions"], action: "Help Guide", path: "/help" },
] as const

export function VoiceController() {
  const router = useRouter()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [showCommands, setShowCommands] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const retryCount = useRef(0)

  // Check speech support - safe for SSR (returns true during SSR, real check on client)
  const speechSupported = typeof window !== "undefined"
    ? !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    : true

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return

    // Get user preferences for voice
    const prefs = readPrefs()
    const voiceSettings = getVoiceSettings(prefs)

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = voiceSettings.rate
    utterance.pitch = voiceSettings.pitch

    // Try to use a natural voice if available
    const voices = window.speechSynthesis.getVoices()
    const preferredVoice = voices.find(v => v.lang.startsWith("en") && v.name.includes("Natural")) ||
                          voices.find(v => v.lang.startsWith("en"))
    if (preferredVoice) utterance.voice = preferredVoice

    window.speechSynthesis.speak(utterance)
  }, [])

  const handleVoiceCommand = useCallback((raw: string) => {
    const text = raw.toLowerCase().trim()
    setTranscript(raw)

    // Check against all defined commands
    for (const command of VOICE_COMMANDS) {
      if (command.phrases.some(phrase => text.includes(phrase))) {
        setFeedback(`Navigating to ${command.action}`)
        speak(`Opening ${command.action}`)
        router.push(command.path)
        setTimeout(() => setIsOpen(false), 1500)
        return
      }
    }

    // Emergency commands
    if (text.includes("emergency") || text.includes("911") || text.includes("danger") || text.includes("police")) {
      setFeedback("Emergency Dialing")
      speak("Emergency triggered. Connecting to emergency services.")
      window.location.href = "tel:911"
      return
    }

    // Location commands
    if (text.includes("where am i") || text.includes("location") || text.includes("gps") || text.includes("my position")) {
      if (!navigator.geolocation) {
        const msg = "Geolocation is unavailable on this device."
        setFeedback(msg)
        speak(msg)
        return
      }
      speak("Locating your position...")
      setFeedback("Getting your location...")
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4)
          const lng = pos.coords.longitude.toFixed(4)
          const msg = `Your location: latitude ${lat}, longitude ${lng}`
          setFeedback(msg)
          speak(msg)
        },
        () => {
          const msg = "Could not access location. Please check browser permissions."
          setFeedback(msg)
          speak(msg)
        }
      )
      return
    }

    // Read page command
    if (text.includes("read page") || text.includes("read screen") || text.includes("what's on screen")) {
      const mainContent = document.querySelector("main")
      if (mainContent) {
        const textContent = mainContent.textContent?.slice(0, 500) || "No content found"
        setFeedback("Reading page content...")
        speak(textContent)
      }
      return
    }

    // Show commands
    if (text.includes("commands") || text.includes("what can i say") || text.includes("help voice")) {
      setShowCommands(true)
      speak("Here are the available voice commands. You can say things like: ask for help, offer help, wallet, settings, or where am I.")
      return
    }

    // Stop/cancel commands
    if (text.includes("stop") || text.includes("cancel") || text.includes("close") || text.includes("nevermind")) {
      setFeedback("Cancelled")
      speak("Okay, cancelled.")
      setIsOpen(false)
      return
    }

    // Unknown command
    const suggestions = "Try: ask for help, offer help, wallet, settings, or where am I"
    setFeedback(`Heard: "${raw}". ${suggestions}`)
    speak(`I heard ${raw}. ${suggestions}`)
  }, [router, speak])

  // Use ref for startListening to allow self-reference in error handler
  const startListeningRef = useRef<() => void>(() => {})

  const startListening = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      const msg = "Speech recognition is not supported in this browser. Use keyboard navigation instead."
      setFeedback(msg)
      speak(msg)
      return
    }

    try {
      const recognition = new SpeechRec()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = "en-US"

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const text = event.results[0]?.[0]?.transcript
        if (text) {
          retryCount.current = 0
          handleVoiceCommand(text)
        }
      }

      recognition.onerror = (event: { error: string }) => {
        setListening(false)
        if (event.error === "no-speech") {
          // Auto-retry up to 3 times for no-speech
          if (retryCount.current < 3) {
            retryCount.current++
            setFeedback(`No speech detected. Listening again... (attempt ${retryCount.current}/3)`)
            setTimeout(() => {
              startListeningRef.current()
            }, 500)
          } else {
            setFeedback("No speech detected. Tap the microphone to try again.")
            retryCount.current = 0
          }
        } else if (event.error === "not-allowed") {
          setFeedback("Microphone access denied. Please enable microphone permissions in your browser settings.")
          speak("Microphone access denied. Please enable permissions.")
        } else if (event.error === "network") {
          // Network error - speech recognition requires internet
          setFeedback("Network error. Voice recognition needs internet. Check your connection and try again.")
          speak("Network error. Please check your internet connection.")
          // Auto-retry once after a delay if network might have recovered
          if (retryCount.current < 1) {
            retryCount.current++
            setTimeout(() => {
              if (navigator.onLine) {
                setFeedback("Retrying voice recognition...")
                startListeningRef.current()
              } else {
                setFeedback("Still offline. Please reconnect and tap the microphone to try again.")
              }
            }, 2000)
          }
        } else if (event.error === "aborted") {
          // User or system aborted - no need to show error unless it's unexpected
          if (retryCount.current === 0) {
            setFeedback("Voice recognition stopped.")
          }
        } else if (event.error === "audio-capture") {
          // Microphone disconnected or unavailable
          setFeedback("Microphone disconnected or unavailable. Please check your microphone and tap to retry.")
          speak("Microphone disconnected.")
          // Try to recover after a delay
          if (retryCount.current < 2) {
            retryCount.current++
            setTimeout(() => {
              setFeedback("Attempting to reconnect microphone...")
              startListeningRef.current()
            }, 1500)
          }
        } else if (event.error === "service-not-allowed") {
          setFeedback("Speech service not available. This may be a browser restriction. Try using Chrome.")
        } else {
          setFeedback(`Voice error: ${event.error}. Tap microphone to retry.`)
        }
      }

      recognition.onend = () => {
        setListening(false)
        // Don't auto-restart if there was an error (error handler will handle it)
      }

      recognitionRef.current = recognition
      recognition.start()
      setListening(true)
      setIsOpen(true)
      retryCount.current = 0
      setFeedback("Listening... Say a command like 'ask for help' or 'wallet'")
      speak("Listening. Say a command.")
    } catch (error) {
      setListening(false)
      const errorMessage = error instanceof Error ? error.message : "Unknown error"
      
      // Handle specific errors
      if (errorMessage.includes("not-allowed") || errorMessage.includes("permission")) {
        setFeedback("Microphone permission denied. Please allow microphone access in your browser.")
      } else if (errorMessage.includes("audio") || errorMessage.includes("device")) {
        setFeedback("Microphone unavailable. Please check your microphone connection.")
      } else {
        setFeedback("Failed to start voice recognition. Please try again.")
      }
      
      console.error("Voice recognition error:", error)
    }
  }, [handleVoiceCommand, speak])

  // Keep the ref updated with the latest startListening function
  useEffect(() => {
    startListeningRef.current = startListening
  }, [startListening])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    retryCount.current = 0
    speak("Voice assistant paused.")
  }, [speak])

  const toggleListening = useCallback(() => {
    if (listening) {
      stopListening()
    } else {
      startListening()
    }
  }, [listening, startListening, stopListening])

  const toggleRef = useRef(toggleListening)
  useEffect(() => {
    toggleRef.current = toggleListening
  })

  // Keyboard shortcuts
  useEffect(() => {
    const prefs = readPrefs()
    if (!prefs.keyboardShortcuts) return

    function handleKeyDown(event: KeyboardEvent) {
      // Alt+V toggles voice command
      if (event.altKey && (event.key === "v" || event.key === "V")) {
        event.preventDefault()
        toggleRef.current()
      }
      // Escape closes voice panel
      if (event.key === "Escape" && isOpen) {
        event.preventDefault()
        setIsOpen(false)
        stopListening()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, stopListening])

  return (
    <>
      {/* Floating Accessible Voice Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-5 z-40 flex flex-col gap-2 items-end">
        {/* Help button for voice commands */}
        {!isOpen && speechSupported && (
          <button
            type="button"
            onClick={() => {
              setIsOpen(true)
              setShowCommands(true)
            }}
            aria-label="Show voice commands help"
            className="flex items-center gap-2 px-3 py-2 rounded-full font-mono text-xs bg-zinc-950/90 hover:bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 backdrop-blur-md transition-all min-h-[44px]"
          >
            <HelpCircle className="size-4" aria-hidden="true" />
            <span className="hidden sm:inline">Voice Help</span>
          </button>
        )}

        {/* Main voice button */}
        <button
          type="button"
          onClick={toggleListening}
          aria-label={listening ? "Stop listening" : "Start voice controls. Press Alt+V anytime."}
          aria-pressed={listening}
          disabled={!speechSupported}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full font-mono text-xs shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 min-h-[48px] min-w-[48px] ${
            listening
              ? "bg-[#25f497] text-black font-semibold ring-4 ring-[#25f497]/40 shadow-[0_0_30px_rgba(37,244,151,0.5)]"
              : speechSupported
                ? "bg-zinc-950/90 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-[#25f497]/50 backdrop-blur-md"
                : "bg-zinc-900 text-zinc-500 border border-zinc-800 cursor-not-allowed opacity-60"
          }`}
        >
          {listening ? (
            <>
              <div className="flex items-center gap-0.5" aria-hidden="true">
                <span className="size-1 rounded-full bg-black animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="size-2 rounded-full bg-black animate-[pulse_0.8s_ease-in-out_infinite]" />
                <span className="size-1 rounded-full bg-black animate-[pulse_0.6s_ease-in-out_infinite]" />
              </div>
              <span>Listening...</span>
              <MicOff className="size-4 text-black" aria-hidden="true" />
            </>
          ) : (
            <>
              <div className="size-2 rounded-full bg-[#25f497] animate-pulse" aria-hidden="true" />
              <Mic className={`size-4 ${speechSupported ? "text-[#25f497]" : "text-zinc-500"}`} aria-hidden="true" />
              <span className="hidden sm:inline font-medium">
                {speechSupported ? "Voice Mode" : "Not Supported"}
              </span>
              {speechSupported && (
                <kbd className="hidden md:inline text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800" aria-hidden="true">
                  Alt+V
                </kbd>
              )}
            </>
          )}
        </button>
      </div>

      {/* Accessible Voice Dialog / Transcript Banner */}
      {isOpen && (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Voice navigation panel"
          className="fixed bottom-36 md:bottom-24 right-5 max-w-md w-[calc(100%-2.5rem)] z-40 rounded-3xl border border-[#25f497]/40 bg-zinc-950/95 p-5 backdrop-blur-xl shadow-2xl space-y-4 font-mono text-xs"
        >
          <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
            <div className="flex items-center gap-2 text-[#25f497]">
              <Volume2 className="size-4" aria-hidden="true" />
              <strong className="tracking-wide uppercase text-[11px]">Voice Navigation</strong>
              {listening && (
                <span className="flex items-center gap-1 text-[10px] bg-[#25f497]/20 px-2 py-0.5 rounded-full">
                  <span className="size-1.5 rounded-full bg-[#25f497] animate-pulse" aria-hidden="true" />
                  Active
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCommands(!showCommands)}
                aria-label={showCommands ? "Hide command list" : "Show command list"}
                aria-expanded={showCommands}
                className="size-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px]"
              >
                <Settings className="size-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false)
                  stopListening()
                }}
                aria-label="Close voice panel"
                className="size-8 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors min-h-[44px] min-w-[44px]"
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Command List */}
          {showCommands && (
            <div className="space-y-2 p-3 rounded-xl bg-zinc-900/60 border border-zinc-800">
              <h4 className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">Available Commands</h4>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {VOICE_COMMANDS.slice(0, 6).map((cmd) => (
                  <div key={cmd.path} className="flex items-center gap-2 text-zinc-300">
                    <span className="text-[#25f497]">→</span>
                    <span>&ldquo;{cmd.phrases[0]}&rdquo;</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-[#25f497]">→</span>
                  <span>&ldquo;where am I&rdquo;</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="text-[#25f497]">→</span>
                  <span>&ldquo;read page&rdquo;</span>
                </div>
              </div>
            </div>
          )}

          {/* Transcript */}
          {transcript && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800" role="status" aria-live="polite">
              <span className="text-zinc-500 block text-[10px] uppercase mb-1">Heard:</span>
              <p className="text-sm font-medium text-white">&ldquo;{transcript}&rdquo;</p>
            </div>
          )}

          {/* Feedback */}
          {feedback && (
            <p className="text-zinc-300 leading-relaxed text-xs p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/50" role="status" aria-live="assertive">
              {feedback}
            </p>
          )}

          {/* Quick suggestions */}
          {!showCommands && (
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] text-zinc-500 w-full mb-1">Quick commands:</span>
              {["Ask for help", "Wallet", "Settings", "Where am I"].map((cmd) => (
                <button
                  key={cmd}
                  type="button"
                  onClick={() => handleVoiceCommand(cmd)}
                  className="text-[#25f497] bg-[#25f497]/10 hover:bg-[#25f497]/20 px-3 py-1.5 rounded-full text-[11px] transition-colors min-h-[36px]"
                >
                  {cmd}
                </button>
              ))}
            </div>
          )}

          {/* Listen again button */}
          {!listening && (
            <button
              type="button"
              onClick={startListening}
              className="w-full flex items-center justify-center gap-2 bg-[#25f497] hover:bg-[#1ee088] text-black font-semibold py-3 rounded-xl transition-colors min-h-[48px]"
              aria-label="Start listening for voice commands"
            >
              <Mic className="size-4" aria-hidden="true" />
              <span>Tap to Speak</span>
            </button>
          )}
        </div>
      )}
    </>
  )
}
