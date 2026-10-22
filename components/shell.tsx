"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react"
import { LiveRegions } from "@/components/announce"
import { VoiceController } from "@/components/voice-controller"
import { applyPrefs, defaultPrefs, prefsSnapshot, subscribePrefs } from "@/lib/prefs"
import { Sun, Moon, HelpCircle } from "lucide-react"

const links = [
  { href: "/request/new", label: "Ask" },
  { href: "/helper", label: "Offer" },
  { href: "/fund", label: "Fund" },
  { href: "/wallet", label: "Money" },
]

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const seen = useRef<string | null>(null)
  const prefs = useSyncExternalStore(subscribePrefs, prefsSnapshot, () => defaultPrefs)

  useEffect(() => {
    if (seen.current === null || seen.current === path) {
      seen.current = path
      return
    }
    seen.current = path
    const heading = document.querySelector("main h1")
    if (heading instanceof HTMLElement) heading.focus()
  }, [path])

  const isLight = prefs.theme === "light"

  function toggleTheme() {
    applyPrefs({
      ...prefs,
      theme: isLight ? "dark" : "light",
    })
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white selection:bg-[#25f497] selection:text-black font-mono">
      <a
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-5 focus:py-2.5 focus:rounded-full focus:bg-[#25f497] focus:text-black focus:font-semibold focus:shadow-xl focus:outline-none"
        href="#main"
      >
        Skip to main content
      </a>

      {/* Header matching x-write-only sticky blur minimalist aesthetic */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-900 bg-black/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          <Link
            className="flex items-center gap-3.5 group rounded-full py-1.5 px-2 -ml-2 hover:opacity-90 transition-opacity"
            href="/"
            aria-label="HelpMesh Homepage"
          >
            {/* Signature triple-bar brand mark from x-write-only reference */}
            <div className="flex items-center gap-1 h-6" aria-hidden="true">
              <span className="block w-1 h-4 rounded-full bg-white group-hover:bg-[#25f497] transition-colors" />
              <span className="block w-1 h-6 rounded-full bg-[#25f497]" />
              <span className="block w-1 h-3.5 rounded-full bg-white group-hover:bg-[#25f497] transition-colors" />
            </div>
            <span className="text-lg font-semibold tracking-[-0.04em] text-white">
              HelpMesh
            </span>
          </Link>

          {/* Navigation with Tailwind pill styling */}
          <nav aria-label="Main" className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-zinc-950/80 border border-zinc-800/80">
            {links.map((link) => {
              const isActive = path === link.href || path.startsWith(`${link.href}/`)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`px-4 py-1.5 rounded-full text-xs font-mono tracking-tight transition-all duration-150 ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium shadow-sm border border-zinc-700/60"
                      : "text-zinc-400 hover:text-white hover:bg-zinc-900/60"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>

          {/* Header Action Accessories */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Network indicator with pulsing status dot */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono bg-zinc-950 border border-zinc-800 text-zinc-300"
              title="Connected to Base Sepolia Escrow Smart Contracts (Chain ID: 84532)"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#25f497] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#25f497]" />
              </span>
              <span className="hidden sm:inline font-mono text-[11px] uppercase tracking-wider text-zinc-300">
                Base Sepolia Escrow
              </span>
            </div>

            {/* Theme Toggle Pill button matching x-write-only */}
            <button
              type="button"
              className="group flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-mono font-medium tracking-tight bg-zinc-900 text-zinc-300 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-all cursor-pointer select-none"
              onClick={toggleTheme}
              aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
            >
              {isLight ? (
                <>
                  <Moon className="size-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <Sun className="size-3.5 text-zinc-400 group-hover:text-white transition-colors" />
                  <span>Light</span>
                </>
              )}
            </button>

            {/* Help link pill */}
            <Link
              className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 transition-colors"
              href="/help"
            >
              <HelpCircle className="size-3.5" />
              <span className="hidden sm:inline">Help</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around px-4 py-2 border-t border-zinc-900 bg-black/90">
          {links.map((link) => {
            const isActive = path === link.href || path.startsWith(`${link.href}/`)
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`px-3 py-1 rounded-full text-xs font-mono tracking-tight transition-colors ${
                  isActive
                    ? "bg-[#25f497] text-black font-semibold"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </div>
      </header>

      {/* Main Content Container with strict padding & layout */}
      <main id="main" tabIndex={-1} className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 focus:outline-none">
        <LiveRegions />
        <VoiceController />
        {children}
      </main>

      {/* Footer matching x-write-only distraction-free minimalism */}
      <footer className="border-t border-zinc-900 py-12 px-4 sm:px-6 lg:px-8 bg-black">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs font-mono text-zinc-500">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-6 text-center sm:text-left">
            <p className="text-zinc-400">
              Autonomous Escrow on Base Sepolia · Zero Data Collection · Private &amp; Non-Custodial
            </p>
            <span className="hidden sm:inline text-zinc-800">|</span>
            <p className="text-zinc-500">HelpMesh is not an emergency dispatcher.</p>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/onboarding" className="hover:text-zinc-300 transition-colors">
              User Setup
            </Link>
            <span className="text-zinc-800">·</span>
            <Link href="/settings/accessibility" className="hover:text-zinc-300 transition-colors">
              Sensory &amp; Display
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
