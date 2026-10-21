"use client"

import { useSyncExternalStore } from "react"
import { useAnnounce } from "@/components/announce"
import { faucet, useDemo } from "@/components/demo"
import { PageTitle } from "@/components/page-title"
import { addresses, EXPLORER } from "@/lib/chain/addresses"
import { liveChain } from "@/lib/chain/plain"
import { accountFor } from "@/lib/chain/session"
import { formatTestMoney } from "@/lib/model"

function yourAddress() {
  if (!liveChain || typeof window === "undefined") return ""
  return accountFor("you").address
}

export function WalletScreen() {
  const demo = useDemo()
  const announce = useAnnounce()
  const address = useSyncExternalStore(() => () => {}, yourAddress, () => "")

  const loading = !demo.ready || (liveChain && !demo.funded)

  return (
    <>
      <p className="kicker">{liveChain ? "Test money" : "Demo chain"}</p>
      <PageTitle>Your money</PageTitle>
      {loading ? <p>Loading your balance.</p> : <p className="balance">{formatTestMoney(demo.balance)}</p>}
      <p className="lede">
        {liveChain
          ? "This is test money on a practice network. It has no cash value. Amounts you hold stay there until you confirm the help."
          : "Demo chain. This balance stays in this browser and is not on a network."}
      </p>
      <div className="row">
        {liveChain && (
          <button
            type="button"
            className="btn primary"
            onClick={() => {
              announce("Sending this now.")
              void faucet().then((message) => announce(message))
            }}
          >
            Add test money
          </button>
        )}
        <button type="button" className="btn" onClick={() => announce("Test money cannot be cashed out.")}>
          Cash out
        </button>
      </div>
      <h2>History</h2>
      {demo.activity.length === 0 ? <p>Nothing here yet.</p> : (
        <ul className="timeline">
          {demo.activity.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
        </ul>
      )}
      <details className="advanced">
        <summary>Advanced</summary>
        {liveChain ? (
          <>
            <p>Practice network: Base Sepolia.</p>
            <p>Your address: <span className="address">{address || "Loading"}</span></p>
            <p>
              <a href={`${EXPLORER}/address/${addresses.mockUsdc}`}>View the test money contract</a>
            </p>
          </>
        ) : (
          <p>Demo chain is on. No address is used.</p>
        )}
      </details>
    </>
  )
}
