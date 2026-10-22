"use client"

import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { Mic, MicOff, Volume2, X } from "lucide-react"

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

export function VoiceController() {
  const router = useRouter()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [feedback, setFeedback] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  function speak(text: string) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.05
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  function handleVoiceCommand(raw: string) {
    const text = raw.toLowerCase().trim()
    setTranscript(raw)

    if (text.includes("ask") || text.includes("need help") || text.includes("new request") || text.includes("post request")) {
      setFeedback("Navigating to Ask for Help")
      speak("Opening assistance request form")
      router.push("/request/new")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("offer") || text.includes("browse") || text.includes("helpers") || text.includes("assist someone")) {
      setFeedback("Navigating to Offer Feed")
      speak("Opening nearby peer requests feed")
      router.push("/helper")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("fund") || text.includes("treasury") || text.includes("grant") || text.includes("sponsor")) {
      setFeedback("Navigating to Accessibility Fund")
      speak("Opening Accessibility Fund treasury")
      router.push("/fund")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("wallet") || text.includes("money") || text.includes("balance") || text.includes("usdc")) {
      setFeedback("Navigating to Wallet & Balance")
      speak("Opening wallet balance and escrow activity")
      router.push("/wallet")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("setting") || text.includes("contrast") || text.includes("font") || text.includes("display")) {
      setFeedback("Navigating to Display & Sensory Settings")
      speak("Opening display and accessibility preferences")
      router.push("/settings/accessibility")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("home") || text.includes("main page")) {
      setFeedback("Returning Home")
      speak("Navigating to home screen")
      router.push("/")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("help") || text.includes("principles") || text.includes("manual") || text.includes("guide")) {
      setFeedback("Opening Platform Manual")
      speak("Opening platform guide and operating manual")
      router.push("/help")
      setTimeout(() => setIsOpen(false), 1500)
      return
    }

    if (text.includes("emergency") || text.includes("911") || text.includes("danger") || text.includes("police")) {
      setFeedback("Emergency Dialing")
      speak("Emergency triggered. Connecting to emergency services.")
      window.location.href = "tel:911"
      return
    }

    if (text.includes("where am i") || text.includes("location") || text.includes("gps")) {
      if (!navigator.geolocation) {
        speak("Geolocation is unavailable on this device.")
        return
      }
      speak("Locating your coordinates...")
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude.toFixed(4)
          const lng = pos.coords.longitude.toFixed(4)
          const msg = `You are at latitude ${lat}, longitude ${lng}. Mesh radar is scanning.`
          setFeedback(msg)
          speak(msg)
        },
        () => {
          speak("Could not access location. Please check browser permissions.")
        }
      )
      return
    }

    setFeedback(`Heard: "${raw}". Say: "Ask for help", "Offer help", "My money", "Fund", or "Where am I".`)
    speak(`I heard ${raw}. Try saying: ask for help, offer help, or wallet.`)
  }

  function toggleListening() {
    if (listening) {
      recognitionRef.current?.stop()
      setListening(false)
      speak("Voice assistant paused.")
      return
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRec) {
      const msg = "Speech recognition is not supported in this browser. You can use standard keyboard navigation."
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
        if (text) handleVoiceCommand(text)
      }

      recognition.onerror = (event: { error: string }) => {
        setListening(false)
        if (event.error !== "no-speech") {
          setFeedback(`Voice error: ${event.error}`)
        }
      }

      recognition.onend = () => {
        setListening(false)
      }

      recognitionRef.current = recognition
      recognition.start()
      setListening(true)
      setIsOpen(true)
      setFeedback("Listening for voice command... (e.g., 'Ask for help', 'My money', 'Where am I')")
      speak("Listening. Say a command.")
    } catch {
      setListening(false)
    }
  }

  const toggleRef = useRef(toggleListening)
  useEffect(() => {
    toggleRef.current = toggleListening
  })

  // Keyboard shortcut: Alt+V toggles voice command
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.altKey && (event.key === "v" || event.key === "V")) {
        event.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  return (
    <>
      {/* Floating Accessible Voice Trigger Button */}
      <div className="fixed bottom-20 md:bottom-6 right-5 z-40">
        <button
          type="button"
          onClick={toggleListening}
          aria-label={listening ? "Stop voice controls" : "Start voice controls for blind and accessibility navigation"}
          className={`group flex items-center gap-2.5 px-4 py-3 rounded-full font-mono text-xs shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95 ${
            listening
              ? "bg-[#25f497] text-black font-semibold ring-4 ring-[#25f497]/40 shadow-[0_0_30px_rgba(37,244,151,0.5)]"
              : "bg-zinc-950/90 hover:bg-zinc-900 text-zinc-200 border border-zinc-800 hover:border-[#25f497]/50 backdrop-blur-md"
          }`}
        >
          {listening ? (
            <>
              <div className="flex items-center gap-0.5">
                <span className="size-1 rounded-full bg-black animate-[pulse_0.6s_ease-in-out_infinite]" />
                <span className="size-2 rounded-full bg-black animate-[pulse_0.8s_ease-in-out_infinite]" />
                <span className="size-1 rounded-full bg-black animate-[pulse_0.6s_ease-in-out_infinite]" />
              </div>
              <span>Listening...</span>
              <MicOff className="size-4 text-black" />
            </>
          ) : (
            <>
              <div className="size-2 rounded-full bg-[#25f497] animate-pulse" />
              <Mic className="size-4 text-[#25f497]" />
              <span className="hidden sm:inline font-medium">Voice Mode</span>
              <kbd className="hidden md:inline text-[10px] bg-zinc-900 text-zinc-400 px-1.5 py-0.5 rounded border border-zinc-800">
                Alt+V
              </kbd>
            </>
          )}
        </button>
      </div>

      {/* Accessible Voice Dialog / Transcript Banner */}
      {isOpen && (
        <div
          role="region"
          aria-live="assertive"
          className="fixed bottom-36 md:bottom-20 right-5 max-w-sm w-[calc(100%-2.5rem)] z-40 rounded-3xl border border-[#25f497]/40 bg-zinc-950/95 p-5 backdrop-blur-xl shadow-2xl space-y-3 font-mono text-xs animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2.5">
            <div className="flex items-center gap-2 text-[#25f497]">
              <Volume2 className="size-4" />
              <strong className="tracking-wide uppercase text-[11px]">Voice Navigation HUD</strong>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close voice feedback dialog"
              className="size-6 rounded-full border border-zinc-800 bg-zinc-900 flex items-center justify-center text-zinc-400 hover:text-white"
            >
              <X className="size-3" />
            </button>
          </div>

          {transcript && (
            <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-zinc-200">
              <span className="text-zinc-500 block text-[10px] uppercase">Heard:</span>
              <p className="text-sm font-medium text-white">{transcript}</p>
            </div>
          )}

          {feedback && (
            <p className="text-zinc-300 leading-relaxed text-xs">
              {feedback}
            </p>
          )}

          <div className="pt-1 flex flex-wrap gap-1.5 text-[10px] text-zinc-500">
            <span>Try:</span>
            <span className="text-[#25f497] bg-[#25f497]/10 px-2 py-0.5 rounded-full">Ask for help</span>
            <span className="text-[#25f497] bg-[#25f497]/10 px-2 py-0.5 rounded-full">Offer help</span>
            <span className="text-[#25f497] bg-[#25f497]/10 px-2 py-0.5 rounded-full">My money</span>
            <span className="text-[#25f497] bg-[#25f497]/10 px-2 py-0.5 rounded-full">Where am I</span>
          </div>
        </div>
      )}
    </>
  )
}
