"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useSyncExternalStore, type ReactNode } from "react"
import { LiveRegions } from "@/components/announce"
import { liveChain } from "@/lib/chain/plain"
import { applyPrefs, prefsSnapshot, subscribePrefs } from "@/lib/prefs"

const links = [
  { href: "/request/new", label: "Ask" },
  { href: "/helper", label: "Offer" },
  { href: "/fund", label: "Fund" },
  { href: "/wallet", label: "Money" },
]

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const seen = useRef<string | null>(null)
  const prefs = useSyncExternalStore(subscribePrefs, prefsSnapshot, () => ({
    theme: "dark" as const,
    textSize: "normal" as const,
    font: "default" as const,
    reduceMotion: null,
    haptics: false,
    speak: false,
  }))

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
    <>
      <a className="skip" href="#main">Skip to main content</a>
      <header>
        <div className="wide bar">
          <Link className="brand" href="/" aria-label="HelpMesh Home">
            <span className="brand-bars" aria-hidden="true">
              <span className="brand-bar" />
              <span className="brand-bar" />
              <span className="brand-bar" />
            </span>
            HelpMesh
          </Link>
          <nav aria-label="Main">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={path === link.href || path.startsWith(`${link.href}/`) ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <div className="status-pill" title={liveChain ? "Connected to Base Sepolia testnet" : "Running on local browser demo chain"}>
              <span className="status-dot" aria-hidden="true" />
              <span>{liveChain ? "Base Sepolia" : "Demo Mesh"}</span>
            </div>
            <button
              type="button"
              className="theme-pill-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${isLight ? "dark" : "light"} theme`}
            >
              {isLight ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                  </svg>
                  <span>Dark</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                  </svg>
                  <span>Light</span>
                </>
              )}
            </button>
            <Link className="help-link" href="/help">Help</Link>
          </div>
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        <div className="wrap">
          <LiveRegions />
          {children}
        </div>
      </main>
      <footer>
        <div className="wrap">
          <p>{liveChain ? "Test money on Base Sepolia. It has no cash value." : "Demo chain. Balances stay in this browser."}</p>
          <p>HelpMesh is not an emergency service.</p>
          <p>
            <Link href="/onboarding">Your setup</Link>
            {" · "}
            <Link href="/settings/accessibility">Display &amp; Accessibility</Link>
          </p>
        </div>
      </footer>
    </>
  )
}
