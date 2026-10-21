"use client"

import { useState } from "react"
import { useAnnounce } from "@/components/announce"
import { PageTitle } from "@/components/page-title"
import { donate, useDemo } from "@/components/demo"
import { Dialog } from "@/components/dialog"
import { liveChain } from "@/lib/chain/plain"
import { formatTestMoney, FUND_MAX, parseAmount } from "@/lib/model"

export function FundScreen() {
  const demo = useDemo()
  const announce = useAnnounce()
  const [amountText, setAmountText] = useState("20")
  const [open, setOpen] = useState(false)
  const amount = parseAmount(amountText)
  const paid = demo.requests.filter((request) => request.mode === "sponsored" && (request.status === "done" || request.status === "resolved")).length

  return (
    <>
      <p className="kicker">Community</p>
      <PageTitle>Accessibility Fund</PageTitle>
      <p className="lede">{!demo.ready || (liveChain && !demo.funded) ? "Loading the fund." : `The fund holds ${formatTestMoney(demo.poolBalance)}.`}</p>
      <p>It has paid for {paid} {paid === 1 ? "request" : "requests"}.</p>
      <h2>Rules</h2>
      <p>Pays up to {formatTestMoney(FUND_MAX)} for mobility, vision, or hearing help. A donation cannot be taken back. It can only leave the fund through an eligible request.</p>
      <label className="field" htmlFor="gift">
        <span>Amount to add</span>
        <input id="gift" inputMode="decimal" autoComplete="off" value={amountText} onChange={(event) => setAmountText(event.target.value)} />
      </label>
      <button
        type="button"
        className="btn primary"
        onClick={() => {
          if (!amount) {
            announce("Enter an amount like 20 or 20.00.")
            return
          }
          setOpen(true)
        }}
      >
        Add to the fund
      </button>
      <Dialog
        open={open}
        title={amount ? `Add ${formatTestMoney(amount)} to the Accessibility Fund` : "Add to the fund"}
        description="This donation cannot be taken back. It can only leave the fund through an eligible request. Escape cancels."
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
              void donate(amount).then(announce)
            }}
          >
            Add {amount ? formatTestMoney(amount) : "the amount"}
          </button>
          <button type="button" className="btn quiet" onClick={() => setOpen(false)}>Go back</button>
        </div>
      </Dialog>
    </>
  )
}
