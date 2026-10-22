import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested route does not exist on HelpMesh.",
}

export default function NotFound() {
  return (
    <div style={{ marginTop: "3rem", textAlign: "center" }}>
      <p className="kicker">
        <span>404 Error</span>
      </p>
      <PageTitle>Page not found</PageTitle>
      <p className="lede" style={{ margin: "1rem auto 2rem", maxWidth: "28rem" }}>
        The link may be outdated, or the assistance session has expired.
      </p>
      <Link className="btn primary" href="/">
        <span>Return to Home Mesh</span>
        <span className="btn-arrow-badge" aria-hidden="true">↗</span>
      </Link>
    </div>
  )
}
