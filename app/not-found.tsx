import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"

export const metadata: Metadata = {
  title: "Page not found",
  description: "That page is not on HelpMesh.",
}

export default function NotFound() {
  return (
    <>
      <PageTitle>That page is not here</PageTitle>
      <p className="lede">The link may be old, or the page was moved.</p>
      <Link className="btn primary" href="/">Back to HelpMesh</Link>
    </>
  )
}
