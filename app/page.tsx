import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"
import { Reach } from "@/components/reach"

export const metadata: Metadata = {
  title: { absolute: "HelpMesh" },
  description: "Ask someone nearby for help, offer help, or fund it.",
}

export default function HomePage() {
  return (
    <>
      <section className="stage">
        <div>
          <p className="eyebrow">Nearby</p>
          <PageTitle>A person nearby can help.</PageTitle>
          <p className="lede">Need a guide, a hand with stairs, or company for a short while? Post what you need. Someone close can take it on. A community fund can cover the cost.</p>
          <div className="row">
            <Link className="btn primary" href="/request/new">Ask for help</Link>
            <Link className="btn" href="/helper">Offer help</Link>
          </div>
          <p className="setup"><Link href="/onboarding">Set how HelpMesh works for you</Link></p>
        </div>
        <Reach />
      </section>
      <section className="paths" aria-label="How help is paid">
        <article>
          <h2>Volunteer</h2>
          <p>No payment. Someone helps because they can.</p>
        </article>
        <article>
          <h2>Reward</h2>
          <p>You hold test money. It is paid only after you say the help is done.</p>
        </article>
        <article>
          <h2>From a fund</h2>
          <p>The Accessibility Fund pays when the request fits its rules.</p>
          <p><Link href="/fund">See the fund</Link></p>
        </article>
      </section>
    </>
  )
}
