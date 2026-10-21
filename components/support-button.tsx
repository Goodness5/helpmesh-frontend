"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { tip, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { formatTestMoney, HELPERS, helperStats, parseAmount } from "@/lib/model"

export function ProfileStats({ helperId }: { helperId: string }) {
  const demo = useDemo()
  const helper = HELPERS.find((item) => item.id === helperId)
  if (!helper) return null
  const stats = helperStats(helper, demo.records)
  return <p className="lede">{stats.helped} people helped. Reputation {stats.score}.</p>
}

export function SupportButton({ helperId, helperName }: { helperId: string; helperName: string }) {
  const announce = useAnnounce()
  const [amountText, setAmountText] = useState("5")
  const [open, setOpen] = useState(false)
  const amount = parseAmount(amountText)

  return (
    <section>
      <h2>Support {helperName}</h2>
      <p>This is a gift. It does not change reputation.</p>
      <label className="field" htmlFor="support">
        <span>Amount</span>
        <input id="support" inputMode="decimal" autoComplete="off" value={amountText} onChange={(event) => setAmountText(event.target.value)} />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          if (!amount) {
            announce("Enter an amount like 5 or 5.00.")
            return
          }
          setOpen(true)
        }}
      >
        Support this helper
      </button>
      <Dialog
        open={open}
        title={amount ? `Send ${formatTestMoney(amount)} to ${helperName}` : `Support ${helperName}`}
        description="This gift does not confirm help and does not change reputation. Escape cancels."
        onClose={() => setOpen(false)}
      >
        <div className="row">
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              if (!amount) return
              setOpen(false)
              announce("Sending this now.")
              void tip(helperId, amount).then(announce)
            }}
          >
            Send {amount ? formatTestMoney(amount) : "gift"}
          </button>
          <button type="button" className="btn quiet" onClick={() => setOpen(false)}>Go back</button>
        </div>
      </Dialog>
    </section>
  )
}
