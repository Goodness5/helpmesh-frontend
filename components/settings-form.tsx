"use client"

import Link from "next/link"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { resetDemo } from "@/components/demo"
import { PrefsFields, usePrefs } from "@/components/prefs-fields"
import { applyPrefs } from "@/lib/prefs"

export function SettingsForm() {
  const announce = useAnnounce()
  const prefs = usePrefs()

  return (
    <>
      <PageTitle>Display settings</PageTitle>
      <p>Changes apply now and stay on this device.</p>
      <PrefsFields
        prefs={prefs}
        onChange={(next) => {
          applyPrefs(next)
          announce("Display updated.")
        }}
      />
      <h2>Your details</h2>
      <p>What you share with a helper, and how you use HelpMesh.</p>
      <p><Link className="btn" href="/onboarding">Edit your setup</Link></p>
      <h2>On this device</h2>
      <p>Clears requests saved in this browser. Test money already sent stays on the practice network.</p>
      <button
        type="button"
        className="btn"
        onClick={() => {
          resetDemo()
          announce("Saved data cleared.")
        }}
      >
        Clear saved data
      </button>
    </>
  )
}
