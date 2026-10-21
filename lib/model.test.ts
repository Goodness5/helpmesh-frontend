import assert from "node:assert/strict"
import test from "node:test"
import {
  escrowSentence,
  formatTestMoney,
  HELPERS,
  parseAmount,
  rankHelpers,
  reputationScore,
  seed,
  sponsorshipBlock,
} from "./model.ts"

test("formats test money from 6 decimal units", () => {
  assert.equal(formatTestMoney(10_000_000), "$10.00")
  assert.equal(formatTestMoney(10_500_000), "$10.50")
  assert.equal(formatTestMoney(0), "$0.00")
})

test("parses plain amounts", () => {
  assert.equal(parseAmount("10"), 10_000_000)
  assert.equal(parseAmount("$10"), 10_000_000)
  assert.equal(parseAmount("10.00"), 10_000_000)
  assert.equal(parseAmount("10.50"), 10_500_000)
  assert.equal(parseAmount("0"), null)
  assert.equal(parseAmount("10001"), null)
  assert.equal(parseAmount("abc"), null)
})

test("escrow copy matches the contract states", () => {
  const base = { amount: 10_000_000, helperName: "Daniel", helperAmount: 0, refundAmount: 0 }
  assert.equal(
    escrowSentence({ ...base, state: 1, source: "requester" }),
    "Your $10.00 is held safely while we find a helper",
  )
  assert.equal(
    escrowSentence({ ...base, state: 6, source: "requester" }),
    "Your $10.00 was returned",
  )
  assert.equal(
    escrowSentence({ ...base, state: 6, source: "pool" }),
    "The sponsored reward went back to the pool",
  )
  assert.equal(
    escrowSentence({ ...base, state: 5, source: "pool" }),
    "$10.00 from the fund was paid to Daniel",
  )
  assert.match(escrowSentence({ ...base, state: 8, source: "requester", helperAmount: 4_000_000 }), /\$4\.00 was paid to Daniel/)
})

test("a closer helper ranks above a farther one, and pay does not change order", () => {
  const [near, far] = HELPERS
  const reward = rankHelpers([far, near], { mode: "reward", category: "mobility" })
  assert.equal(reward[0]?.helper.id, "daniel")
  const again = rankHelpers([far, near], { mode: "reward", category: "mobility" })
  assert.deepEqual(
    reward.map((item) => item.helper.id),
    again.map((item) => item.helper.id),
  )
  const volunteer = rankHelpers(
    [{ ...near, acceptsFree: false, acceptsPaid: true }],
    { mode: "volunteer", category: "mobility" },
  )
  assert.equal(volunteer.length, 0)
})

test("tips and support do not change reputation", () => {
  const help = [{ kind: "confirmed" as const }, { kind: "confirmed" as const }, { kind: "disputed" as const }]
  const withMoney = [...help, { kind: "tipped" as const }, { kind: "supported" as const }]
  assert.equal(reputationScore(help), 1)
  assert.equal(reputationScore(withMoney), reputationScore(help))
})

test("the fund blocks requests it does not cover", () => {
  const pool = seed().poolBalance
  assert.equal(sponsorshipBlock("errand", 10_000_000, pool), "This fund does not cover that kind of help.")
  assert.equal(sponsorshipBlock("mobility", 25_000_000, pool), "That amount is above what this fund allows per request.")
  assert.equal(sponsorshipBlock("mobility", 10_000_000, pool), null)
})
