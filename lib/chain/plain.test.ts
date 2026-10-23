import assert from "node:assert/strict"
import test from "node:test"
import { keccak256, toBytes } from "viem"
import { amountAllowed, categoryAllowed, plainError, requestKey, RULES_TEXT, rulesHash } from "./plain.ts"

test("request ids hash the id and salt, and the salt is not the id", () => {
  const salt = `0x${"ab".repeat(32)}` as const
  const key = requestKey("req_123", salt)
  assert.equal(key.startsWith("0x"), true)
  assert.equal(key.length, 66)
  assert.notEqual(key, salt)
  assert.equal(key, requestKey("req_123", salt))
  assert.notEqual(key, requestKey("req_124", salt))
})

test("rules hash is stable", () => {
  assert.equal(rulesHash(), keccak256(toBytes(RULES_TEXT)))
  assert.equal(RULES_TEXT.includes("wheelchair"), false)
})

test("fund rules match the written limits", () => {
  assert.equal(categoryAllowed("mobility"), true)
  assert.equal(categoryAllowed("errand"), false)
  assert.equal(amountAllowed(20_000_000n), true)
  assert.equal(amountAllowed(20_000_001n), false)
})

test("reverts become plain sentences", () => {
  assert.match(plainError(new Error("execution reverted: FaucetCooldown(1893456000)")), /More funds are available at/)
  assert.equal(
    plainError(new Error("EnforcedPause()")),
    "New rewards are paused. Money already held can still be confirmed or returned.",
  )
  assert.equal(plainError(new Error("InsufficientPool()")), "The sponsorship pool does not have enough for this request.")
  assert.equal(plainError(new Error("something unexpected")), "That did not go through. Try again.")
  assert.equal(plainError(new Error("fetch failed")), "The network did not respond. Try again.")
})
