import { encodePacked, keccak256, toBytes, toHex, type Hex } from "viem"

const FUND_CATEGORIES = ["mobility", "vision", "hearing"]
const FUND_MAX = 20_000_000n

export const liveChain = process.env.NEXT_PUBLIC_DEMO_MODE !== "true"

/** Canonical rules text. Its hash is what the pool stores. */
export const RULES_TEXT =
  '{"categories":["hearing","mobility","vision"],"maxPerRequest":"20000000","name":"Accessibility Fund"}'

export function rulesHash(): Hex {
  return keccak256(toBytes(RULES_TEXT))
}

export function requestKey(uuid: string, salt: Hex): Hex {
  return keccak256(encodePacked(["bytes", "bytes32"], [toHex(toBytes(uuid)), salt]))
}

export function assignMessage(requestKeyHex: string, helper: string) {
  return `HelpMesh assign\n${requestKeyHex}\n${helper.toLowerCase()}`
}

export function fundMessage(requestKeyHex: string, amount: string, category: string) {
  return `HelpMesh fund\n${requestKeyHex}\n${amount}\n${category}`
}

export function categoryAllowed(category: string) {
  return (FUND_CATEGORIES as readonly string[]).includes(category)
}

export function amountAllowed(amount: bigint) {
  return amount > 0n && amount <= FUND_MAX
}

function formatChainTime(seconds: number) {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(seconds * 1000)
}

const SENTENCES: [string, string][] = [
  ["EnforcedPause", "New rewards are paused. Money already held can still be confirmed or returned."],
  ["AmountTooHigh", "That amount is above the maximum escrow limit."],
  ["TokenNotAllowed", "Only verified USDC collateral can be used here."],
  ["AlreadyExists", "This request was already recorded."],
  ["AlreadyConfirmed", "This request was already recorded."],
  ["SessionActive", "You can cancel after the help session has been left for 24 hours."],
  ["TooEarly", "The waiting period is not over yet."],
  ["Expired", "That request or approval has expired."],
  ["InvalidSignature", "The approval did not match. Try again."],
  ["NotRequester", "Only the person who made this request, or the assigned helper, can do that."],
  ["NotHelper", "Only the person who made this request, or the assigned helper, can do that."],
  ["NotParty", "Only the person who made this request, or the assigned helper, can do that."],
  ["HelperIsRequester", "You can't confirm your own help."],
  ["SameParty", "You can't confirm your own help."],
  ["InsufficientPool", "The sponsorship pool does not have enough for this request."],
  ["PoolIsPaused", "This sponsorship pool is paused."],
  ["ERC20InsufficientBalance", "You don't have enough collateral balance."],
  ["BadState", "That step is not available right now. Try again."],
]

export function plainError(error: unknown): string {
  const text = errorText(error)
  if (/failed to fetch|network|timeout|ECONN|fetch failed/i.test(text)) {
    return "The network did not respond. Try again."
  }
  if (text.includes("FaucetCooldown")) {
    const match = text.match(/FaucetCooldown\((\d+)\)/) ?? text.match(/nextAt[^0-9]*(\d{9,})/)
    if (match?.[1]) return `More funds are available at ${formatChainTime(Number(match[1]))}.`
    return "More funds are available later. Try again then."
  }
  for (const [name, sentence] of SENTENCES) {
    if (text.includes(name)) return sentence
  }
  return "That did not go through. Try again."
}

function errorText(error: unknown): string {
  if (!error) return ""
  if (typeof error === "string") return error
  if (error instanceof Error) {
    const extra = "cause" in error ? errorText(error.cause) : ""
    const short = "shortMessage" in error && typeof error.shortMessage === "string" ? error.shortMessage : ""
    return `${error.message}\n${short}\n${extra}`
  }
  return String(error)
}
