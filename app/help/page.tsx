import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"

export const metadata: Metadata = {
  title: "Help with this app",
  description: "How to ask for help, how money is held, and the words this app uses.",
}

export default function HelpPage() {
  return (
    <>
      <PageTitle>Help with this app</PageTitle>
      <p className="lede">Every page works with a keyboard, a screen reader, or large text.</p>
      <h2>Ask for help</h2>
      <p>Start from a common need or write your own. You always see a summary before it is sent. A list tells you who is close and in which direction.</p>
      <h2>Money</h2>
      <p>A reward is test money held safely. It is paid to the helper only after you confirm. A donation to the fund cannot be taken back. It can only leave the fund through an eligible request.</p>
      <h2>Words we use</h2>
      <dl className="stack">
        <div>
          <dt><strong>Held safely</strong></dt>
          <dd>The amount is set aside. It is not paid yet.</dd>
        </div>
        <div>
          <dt><strong>Fund</strong></dt>
          <dd>A pool that can pay for help that fits its rules.</dd>
        </div>
        <div>
          <dt><strong>Reputation</strong></dt>
          <dd>Confirmed help, minus disputes. A gift does not change it.</dd>
        </div>
      </dl>
      <h2>If you are in danger</h2>
      <p>HelpMesh is not an emergency or medical service. Call your local emergency number. In the United States, call 911.</p>
      <p><Link href="/settings/accessibility">Display</Link></p>
    </>
  )
}
