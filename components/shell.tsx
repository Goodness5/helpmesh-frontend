"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, type ReactNode } from "react"
import { LiveRegions } from "@/components/announce"
import { liveChain } from "@/lib/chain/plain"

const links = [
  { href: "/request/new", label: "Ask" },
  { href: "/helper", label: "Offer" },
  { href: "/fund", label: "Fund" },
  { href: "/wallet", label: "Money" },
]

export function Shell({ children }: { children: ReactNode }) {
  const path = usePathname()
  const seen = useRef<string | null>(null)

  useEffect(() => {
    if (seen.current === null || seen.current === path) {
      seen.current = path
      return
    }
    seen.current = path
    const heading = document.querySelector("main h1")
    if (heading instanceof HTMLElement) heading.focus()
  }, [path])

  return (
    <>
      <a className="skip" href="#main">Skip to main content</a>
      <header>
        <div className="wide bar">
          <Link className="brand" href="/"><span className="mark" aria-hidden="true" />HelpMesh</Link>
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
          <Link className="help-link" href="/help">Help</Link>
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
          <p>{liveChain ? "Test money. It has no cash value." : "Demo chain. Balances stay in this browser."}</p>
          <p>HelpMesh is not an emergency service.</p>
          <p>
            <Link href="/onboarding">Your setup</Link>
            {" · "}
            <Link href="/settings/accessibility">Display</Link>
          </p>
        </div>
      </footer>
    </>
  )
}
