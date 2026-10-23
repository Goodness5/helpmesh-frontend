"use client"

import { useState, useEffect, useCallback } from "react"
import { Download, X, Smartphone } from "lucide-react"
import { useAnnounce } from "@/components/announce"

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

const DISMISS_KEY = "helpmesh.pwa-dismissed"
const INSTALL_KEY = "helpmesh.pwa-installed"
// Don't show again for 30 days after dismissal
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000

// Check if already installed
function checkIfInstalled(): boolean {
  if (typeof window === "undefined") return false
  // Check display mode
  const isStandalone = window.matchMedia("(display-mode: standalone)").matches
  const isIOSStandalone = ("standalone" in window.navigator) && (window.navigator as { standalone?: boolean }).standalone
  // Check if we marked it as installed
  const markedInstalled = localStorage.getItem(INSTALL_KEY) === "true"
  return isStandalone || Boolean(isIOSStandalone) || markedInstalled
}

// Check if banner was dismissed recently
function wasBannerDismissed(): boolean {
  if (typeof window === "undefined") return true // SSR: don't show
  const dismissedAt = localStorage.getItem(DISMISS_KEY)
  if (!dismissedAt) return false
  const dismissedTime = parseInt(dismissedAt, 10)
  // If dismissed within the duration, stay dismissed
  return Date.now() - dismissedTime < DISMISS_DURATION_MS
}

export function PWAInstall() {
  const announce = useAnnounce()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isInstalled, setIsInstalled] = useState(true) // Start hidden, check on mount

  // Check install/dismiss state on mount
  useEffect(() => {
    const installed = checkIfInstalled()
    const dismissed = wasBannerDismissed()
    setIsInstalled(installed)
    // Only potentially show banner if not installed and not dismissed
    if (!installed && !dismissed) {
      // We'll wait for the beforeinstallprompt event
    }
  }, [])

  useEffect(() => {
    // Listen for install prompt
    function handleBeforeInstall(e: Event) {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Only show banner if not dismissed
      if (!wasBannerDismissed() && !checkIfInstalled()) {
        setTimeout(() => setShowBanner(true), 3000)
      }
    }

    // Listen for successful install
    function handleAppInstalled() {
      localStorage.setItem(INSTALL_KEY, "true")
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
      announce("HelpMesh has been installed!")
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall)
    window.addEventListener("appinstalled", handleAppInstalled)

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall)
      window.removeEventListener("appinstalled", handleAppInstalled)
    }
  }, [announce])

  const handleInstall = useCallback(async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice

      if (outcome === "accepted") {
        localStorage.setItem(INSTALL_KEY, "true")
        announce("Installing HelpMesh...")
      } else {
        // User cancelled - treat like dismiss
        localStorage.setItem(DISMISS_KEY, Date.now().toString())
        announce("Install cancelled")
      }

      setDeferredPrompt(null)
      setShowBanner(false)
    } catch (error) {
      console.error("Install failed:", error)
    }
  }, [deferredPrompt, announce])

  const dismissBanner = useCallback(() => {
    setShowBanner(false)
    // Don't show again for 30 days
    localStorage.setItem(DISMISS_KEY, Date.now().toString())
  }, [])

  // Don't show install banner if already installed or no prompt available
  if (isInstalled || !showBanner || !deferredPrompt) {
    return null
  }

  return (
    <div
      role="banner"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-0 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
    >
      <div className="rounded-2xl border border-[#25f497]/30 bg-zinc-950/95 p-4 backdrop-blur-xl shadow-2xl">
        <div className="flex items-start gap-3">
          <div className="size-12 rounded-xl bg-gradient-to-br from-[#25f497] to-teal-600 flex items-center justify-center shrink-0">
            <Smartphone className="size-6 text-black" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-mono font-semibold text-white">Install HelpMesh</h3>
            <p className="text-xs font-mono text-zinc-400 mt-1">
              Add to home screen for quick access, offline support, and push notifications.
            </p>
          </div>
          <button
            type="button"
            onClick={dismissBanner}
            aria-label="Dismiss install prompt"
            className="size-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors shrink-0"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={dismissBanner}
            className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-mono text-xs transition-colors min-h-[44px]"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={handleInstall}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25f497] hover:bg-[#1ee088] text-black font-mono text-xs font-semibold transition-colors min-h-[44px]"
          >
            <Download className="size-4" aria-hidden="true" />
            Install
          </button>
        </div>
      </div>
    </div>
  )
}

// Service Worker Registration Component
export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return
    }

    // Register service worker
    async function registerSW() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          scope: "/",
        })

        console.log("[PWA] Service Worker registered:", registration.scope)

        // Check for updates periodically
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000) // Every hour

        // Handle updates
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              // New version available
              console.log("[PWA] New version available")
            }
          })
        })
      } catch (error) {
        console.error("[PWA] Service Worker registration failed:", error)
      }
    }

    // Register after page load
    if (document.readyState === "complete") {
      registerSW()
    } else {
      window.addEventListener("load", registerSW)
      return () => window.removeEventListener("load", registerSW)
    }
  }, [])

  return null
}

