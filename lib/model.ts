/** Plain data and money rules. Screens call these. No network. */

export const UNIT = 1_000_000
export const MAX_AMOUNT = 10_000 * UNIT
export const FUND_MAX = 20 * UNIT
export const FAUCET_AMOUNT = 100 * UNIT
export const DAY = 24 * 60 * 60 * 1000

export const FUND_CATEGORIES = ["mobility", "vision", "hearing"] as const

export type Mode = "volunteer" | "reward" | "sponsored"
export type Status =
  | "open"
  | "assigned"
  | "started"
  | "awaiting_confirm"
  | "done"
  | "cancelled"
  | "disputed"
  | "resolved"
  | "refunded"

export type Escrow = {
  state: number
  source: "requester" | "pool"
  helperAmount?: number
  refundAmount?: number
}

export type HelpRequest = {
  id: string
  owner: string // User ID or wallet address
  requesterName: string
  title: string
  description: string
  category: string
  mode: Mode
  amount: number
  place: string
  minutes: number
  status: Status
  helperId: string | null
  communicate: string
  needsSummary: string
  shareNeeds: boolean
  escrow: Escrow | null
  chainKey: string | null
  salt: string | null
  example: boolean
  events: string[]
  messages: { from: string; body: string }[]
  startedAt: number | null
}

export type RepKind = "confirmed" | "disputed" | "tipped" | "supported"

export type RepRecord = { kind: RepKind; helperId: string }

export type Profile = {
  role: "help" | "helper" | "fund" | null
  disabilities: string[]
  communicate: string[]
  needsSummary: string
  shareWithHelper: boolean
}

export type State = {
  balance: number
  faucetNext: number
  poolBalance: number
  trustedName: string
  profile: Profile
  requests: HelpRequest[]
  activity: string[]
  records: RepRecord[]
}

export type Helper = {
  id: string
  name: string
  distanceM: number
  direction: string
  verified: boolean
  completions: number
  acceptsFree: boolean
  acceptsPaid: boolean
  skills: string[]
  communicate: string[]
}

// No mock helpers - real helpers will connect via the mesh network
export const HELPERS: Helper[] = []

export const TEMPLATES = [
  { id: "stairs", label: "Help with stairs or steps", category: "mobility", need: "I need help with stairs or a step.", minutes: 15 },
  { id: "guide", label: "Guide me", category: "vision", need: "I need someone to guide me.", minutes: 20 },
  { id: "read", label: "Read something for me", category: "vision", need: "I need someone to read something for me.", minutes: 15 },
  { id: "carry", label: "Carry something", category: "errand", need: "I need help carrying something.", minutes: 20 },
  { id: "company", label: "Company or conversation", category: "companionship", need: "I would like company or a conversation.", minutes: 30 },
  { id: "other", label: "Something else", category: "other", need: "", minutes: 20 },
] as const

const emptyProfile: Profile = {
  role: null,
  disabilities: [],
  communicate: [],
  needsSummary: "",
  shareWithHelper: false,
}

export function seed(): State {
  return {
    balance: 100 * UNIT,
    faucetNext: 0,
    poolBalance: 500 * UNIT,
    trustedName: "",
    profile: emptyProfile,
    activity: [],
    records: [],
    requests: [],
  }
}

export function formatTestMoney(units: number): string {
  const negative = units < 0
  const abs = Math.abs(Math.trunc(units))
  const dollars = Math.floor(abs / UNIT)
  const cents = Math.floor((abs % UNIT) / 10_000)
  const text = `$${dollars}.${String(cents).padStart(2, "0")}`
  return negative ? `-${text}` : text
}

/** Accepts "10", "$10", and "10.00". Returns 6-decimal units, or null. */
export function parseAmount(input: string): number | null {
  const cleaned = input.trim().replace(/[$,\s]/g, "")
  if (!/^\d+(\.\d{0,2})?$/.test(cleaned)) return null
  const [whole, frac = ""] = cleaned.split(".")
  const cents = Number((frac + "00").slice(0, 2))
  const units = Number(whole) * UNIT + cents * 10_000
  if (!Number.isSafeInteger(units) || units <= 0 || units > MAX_AMOUNT) return null
  return units
}

export function formatWhen(time: number): string {
  return new Intl.DateTimeFormat("en", {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  }).format(time)
}

export function escrowSentence(input: {
  state: number
  amount: number
  helperName: string
  source: "requester" | "pool"
  helperAmount?: number
  refundAmount?: number
}): string {
  const money = formatTestMoney(input.amount)
  const name = input.helperName
  if (input.source === "pool" && input.state >= 1 && input.state <= 3) {
    return `The fund is holding ${money} safely`
  }
  switch (input.state) {
    case 1:
      return `Your ${money} is held safely while we find a helper`
    case 2:
      return `${name} accepted. Your ${money} is still held safely`
    case 3:
      return `${name} is helping. Your ${money} is held safely`
    case 4:
      return `${name} says the help is done. Please confirm.`
    case 5:
      return input.source === "pool"
        ? `${money} from the fund was paid to ${name}`
        : `${money} was paid to ${name}`
    case 6:
      return input.source === "pool"
        ? "The sponsored reward went back to the pool"
        : `Your ${money} was returned`
    case 7:
      return "We're looking into this. Your money is safe."
    case 8: {
      const paid = formatTestMoney(input.helperAmount ?? 0)
      return `This was reviewed. ${paid} was paid to ${name}. The rest went back to its source.`
    }
    default:
      return ""
  }
}

export function distanceText(helper: Helper): string {
  return `${helper.distanceM} meters ${helper.direction}`
}

/** Distance, skill, and verified help. Payment never changes the score. */
export function rankHelpers(helpers: Helper[], request: { mode: Mode; category: string }) {
  return helpers
    .filter((helper) => {
      if (request.mode === "volunteer") return helper.acceptsFree
      return helper.acceptsPaid || helper.acceptsFree
    })
    .map((helper) => {
      const skill = helper.skills.includes(request.category) ? 30 : 0
      const verified = helper.verified ? 20 : 0
      const done = Math.min(helper.completions, 100) / 5
      const distance = Math.max(0, 40 - helper.distanceM / 25)
      return { helper, score: skill + verified + done + distance }
    })
    .sort((a, b) => b.score - a.score || a.helper.distanceM - b.helper.distanceM)
}

export function reputationScore(records: { kind: RepKind }[]): number {
  let score = 0
  for (const record of records) {
    if (record.kind === "confirmed") score += 1
    if (record.kind === "disputed") score -= 1
  }
  return Math.max(0, score)
}

export function helperStats(helper: Helper, records: RepRecord[]) {
  const mine = records.filter((record) => record.helperId === helper.id)
  const helped = helper.completions + mine.filter((record) => record.kind === "confirmed").length
  const score = Math.max(0, helped - mine.filter((record) => record.kind === "disputed").length)
  return { helped, score }
}

export function helperById(id: string | null): Helper | undefined {
  return HELPERS.find((helper) => helper.id === id)
}

export function personName(id: string | null, viewerIsHelper: boolean): string {
  if (!id) return "a helper"
  if (id === "me") return viewerIsHelper ? "you" : "your helper"
  return helperById(id)?.name ?? "your helper"
}

export function sponsorshipBlock(category: string, amount: number, pool: number): string | null {
  if (!FUND_CATEGORIES.includes(category as (typeof FUND_CATEGORIES)[number])) {
    return "This fund does not cover that kind of help."
  }
  if (amount > FUND_MAX) return "That amount is above what this fund allows per request."
  if (amount > pool) return "The sponsorship pool does not have enough for this request."
  return null
}

const EMERGENCY =
  /\b(emergency|911|ambulance|heart attack|stroke|overdose|unconscious|unresponsive|not breathing|cannot breathe|can't breathe|chest pain|bleeding heavily|suicidal|kill myself)\b/i

export function looksLikeEmergency(text: string): boolean {
  return EMERGENCY.test(text)
}

export type Draft = {
  title: string
  description: string
  category: string
  mode: Mode
  amount: number
  place: string
  minutes: number
  communicate: string
  needsSummary: string
  shareNeeds: boolean
}

export function createRequest(
  state: State,
  draft: Draft,
  id: string,
  chain?: { chainKey: string; salt: string },
  localMoney = true,
): { state: State; message: string } {
  let next = state
  let escrow: Escrow | null = null
  if (draft.mode === "sponsored") {
    const block = sponsorshipBlock(draft.category, draft.amount, localMoney ? state.poolBalance : Number.MAX_SAFE_INTEGER)
    if (block) return { state, message: block }
    if (localMoney) {
      next = { ...state, poolBalance: state.poolBalance - draft.amount }
      escrow = { state: 1, source: "pool" }
    }
  }
  const request: HelpRequest = {
    id,
    owner: "me",
    requesterName: "You",
    title: draft.title,
    description: draft.description,
    category: draft.category,
    mode: draft.mode,
    amount: draft.mode === "volunteer" ? 0 : draft.amount,
    place: draft.place,
    minutes: draft.minutes,
    status: "open",
    helperId: null,
    communicate: draft.communicate || "Text",
    needsSummary: draft.shareNeeds ? draft.needsSummary : "",
    shareNeeds: draft.shareNeeds,
    escrow,
    chainKey: chain?.chainKey ?? null,
    salt: chain?.salt ?? null,
    example: false,
    events: [escrow ? "The fund is holding the amount." : "Request sent."],
    messages: [],
    startedAt: null,
  }
  const message =
    draft.mode === "sponsored"
      ? "The fund is holding the amount. We are looking for a helper."
      : draft.mode === "reward"
        ? "Request saved. Lock escrow collateral when you are ready."
        : "Request sent. We are looking for a helper."
  return { state: { ...next, requests: [request, ...next.requests] }, message }
}

export function attachEscrow(state: State, id: string, source: "requester" | "pool", event: string): State {
  return edit(
    state,
    id,
    (item) => ({
      ...item,
      escrow: { state: 1, source },
      events: [event, ...item.events],
    }),
    event,
  )
}

function edit(state: State, id: string, change: (request: HelpRequest) => HelpRequest, activity?: string): State {
  return {
    ...state,
    activity: activity ? [activity, ...state.activity] : state.activity,
    requests: state.requests.map((request) => (request.id === id ? change(request) : request)),
  }
}

export function holdReward(state: State, id: string): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request) return { state, message: "We can't find that request." }
  if (request.escrow) return { state, message: "This request was already recorded." }
  if (request.amount > MAX_AMOUNT) return { state, message: "That amount is above the limit." }
  if (state.balance < request.amount) return { state, message: "You don't have enough." }
  const money = formatTestMoney(request.amount)
  return {
    message: `${money} is held safely. It is paid only after you confirm.`,
    state: edit(
      { ...state, balance: state.balance - request.amount },
      id,
      (item) => ({
        ...item,
        escrow: { state: 1, source: "requester" },
        events: [`${money} is held safely.`, ...item.events],
      }),
      `${money} held for “${request.title}”.`,
    ),
  }
}

export function chooseHelper(state: State, id: string, helperId: string): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request || request.status !== "open") return { state, message: "That request is no longer open." }
  if (request.mode === "reward" && request.escrow?.state !== 1) {
    return { state, message: "Set the amount aside before a helper is chosen." }
  }
  const name = helperId === "me" ? "You" : helperById(helperId)?.name ?? "A helper"
  return {
    message: `${name} accepted.`,
    state: edit(state, id, (item) => ({
      ...item,
      status: "assigned",
      helperId,
      escrow: item.escrow ? { ...item.escrow, state: 2 } : null,
      events: [`${name} accepted.`, ...item.events],
    })),
  }
}

export function markStarted(state: State, id: string, now: number): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request || request.status !== "assigned") return { state, message: "Help has not been accepted yet." }
  return {
    message: "Help has started.",
    state: edit(state, id, (item) => ({
      ...item,
      status: "started",
      startedAt: now,
      escrow: item.escrow ? { ...item.escrow, state: 3 } : null,
      events: ["Help started.", ...item.events],
    })),
  }
}

export function markComplete(state: State, id: string): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request || request.status !== "started") return { state, message: "Help has not started yet." }
  return {
    message: "Marked done. Waiting for confirmation.",
    state: edit(state, id, (item) => ({
      ...item,
      status: "awaiting_confirm",
      escrow: item.escrow ? { ...item.escrow, state: 4 } : null,
      events: ["Helper says the help is done.", ...item.events],
    })),
  }
}

export function confirmHelp(state: State, id: string): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request || request.status !== "awaiting_confirm") {
    return { state, message: "There is nothing to confirm yet." }
  }
  if (request.owner === "me" && request.helperId === "me") {
    return { state, message: "You can't confirm your own help." }
  }
  const helperId = request.helperId ?? "daniel"
  const name = personName(helperId, false)
  const paid = request.escrow ? formatTestMoney(request.amount) : ""
  return {
    message: request.escrow ? `${paid} was paid to ${name}.` : "Help confirmed. No money moved.",
    state: edit(
      { ...state, records: [...state.records, { kind: "confirmed", helperId }] },
      id,
      (item) => ({
        ...item,
        status: "done",
        escrow: item.escrow ? { ...item.escrow, state: 5 } : null,
        events: [request.escrow ? `${paid} was paid to ${name}.` : "Help confirmed.", ...item.events],
      }),
      request.escrow ? `${paid} paid to ${name}.` : `Confirmed help for “${request.title}”.`,
    ),
  }
}

export function cancelRequest(state: State, id: string, now: number, reason = "Cancelled"): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request) return { state, message: "We can't find that request." }
  const open = request.status === "open" || request.status === "assigned"
  const leftLongEnough =
    request.status === "started" && request.startedAt !== null && now - request.startedAt >= DAY
  if (!open && !leftLongEnough) {
    return { state, message: "You can cancel after the help session has been left for 24 hours." }
  }
  if (request.status === "awaiting_confirm" || request.status === "done") {
    return { state, message: "This help is already marked done." }
  }
  let balance = state.balance
  let poolBalance = state.poolBalance
  if (request.escrow && request.escrow.state < 5) {
    if (request.escrow.source === "requester") balance += request.amount
    else poolBalance += request.amount
  }
  const message = request.escrow
    ? escrowSentence({
        state: 6,
        amount: request.amount,
        helperName: personName(request.helperId, false),
        source: request.escrow.source,
      })
    : "Request cancelled."
  return {
    message,
    state: edit(
      { ...state, balance, poolBalance },
      id,
      (item) => ({
        ...item,
        status: item.escrow ? "refunded" : "cancelled",
        escrow: item.escrow ? { ...item.escrow, state: 6 } : null,
        events: [`${message} Reason: ${reason}`, ...item.events],
      }),
      message,
    ),
  }
}

export function disputeRequest(state: State, id: string): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request) return { state, message: "We can't find that request." }
  if (request.status !== "started" && request.status !== "awaiting_confirm") {
    return { state, message: "A dispute can start only while help is underway." }
  }
  const helperId = request.helperId ?? "daniel"
  return {
    message: "We're looking into this. Your money is safe.",
    state: edit(
      { ...state, records: [...state.records, { kind: "disputed", helperId }] },
      id,
      (item) => ({
        ...item,
        status: "disputed",
        escrow: item.escrow ? { ...item.escrow, state: 7 } : null,
        events: ["A problem was reported.", ...item.events],
      }),
    ),
  }
}

/** DEMO-SIMULATED: a platform review splits the test money in half. */
export function resolveDispute(state: State, id: string): { state: State; message: string } {
  const request = state.requests.find((item) => item.id === id)
  if (!request || request.status !== "disputed") return { state, message: "There is no open dispute." }
  const helperAmount = Math.floor(request.amount / 2)
  const refundAmount = request.amount - helperAmount
  let balance = state.balance
  let poolBalance = state.poolBalance
  if (request.escrow?.source === "requester") balance += refundAmount
  if (request.escrow?.source === "pool") poolBalance += refundAmount
  const name = personName(request.helperId, false)
  const message = escrowSentence({
    state: 8,
    amount: request.amount,
    helperName: name,
    source: request.escrow?.source ?? "requester",
    helperAmount,
    refundAmount,
  })
  return {
    message,
    state: edit(
      { ...state, balance, poolBalance },
      id,
      (item) => ({
        ...item,
        status: "resolved",
        escrow: item.escrow ? { ...item.escrow, state: 8, helperAmount, refundAmount } : null,
        events: [message, ...item.events],
      }),
      message,
    ),
  }
}

export function sendTip(state: State, helperId: string, amount: number, requestId?: string): { state: State; message: string } {
  if (state.balance < amount) return { state, message: "You don't have enough." }
  const name = personName(helperId, false)
  const money = formatTestMoney(amount)
  const note = requestId ? `Tip of ${money} for a request.` : `Support of ${money} for ${name}.`
  return {
    message: `${money} was sent to ${name}.`,
    state: {
      ...state,
      balance: state.balance - amount,
      activity: [note, ...state.activity],
      records: [...state.records, { kind: requestId ? "tipped" : "supported", helperId }],
    },
  }
}

export function depositPool(state: State, amount: number): { state: State; message: string } {
  if (state.balance < amount) return { state, message: "You don't have enough." }
  const money = formatTestMoney(amount)
  return {
    message: `${money} is now in the fund. This donation cannot be taken back.`,
    state: {
      ...state,
      balance: state.balance - amount,
      poolBalance: state.poolBalance + amount,
      activity: [`Donated ${money} to the Accessibility Fund.`, ...state.activity],
    },
  }
}

export function dripFaucet(state: State, now: number): { state: State; message: string } {
  if (state.faucetNext > now) {
    return { state, message: `More funds are available at ${formatWhen(state.faucetNext)}.` }
  }
  return {
    message: "Added $100.00.",
    state: {
      ...state,
      balance: state.balance + FAUCET_AMOUNT,
      faucetNext: now + DAY,
      activity: ["Added $100.00.", ...state.activity],
    },
  }
}

export function addMessage(state: State, id: string, from: string, body: string): State {
  return edit(state, id, (item) => ({
    ...item,
    messages: [...item.messages, { from, body }],
  }))
}

export function headline(request: HelpRequest, asHelper: boolean): string {
  const name = request.helperId ? personName(request.helperId, asHelper) : "A helper"
  const who = name.charAt(0).toUpperCase() + name.slice(1)
  if (asHelper) {
    switch (request.status) {
      case "open":
        return `${request.requesterName} needs help`
      case "assigned":
        return "You accepted"
      case "started":
        return "You are helping"
      case "awaiting_confirm":
        return `Waiting for ${request.requesterName} to confirm`
      case "done":
        return "Help completed"
      case "cancelled":
      case "refunded":
        return "Cancelled"
      case "disputed":
        return "We're looking into this"
      case "resolved":
        return "This was reviewed"
      default:
        return "Request"
    }
  }
  switch (request.status) {
    case "open":
      return request.mode === "reward" && !request.escrow
        ? "Set the amount aside to start looking"
        : "Looking for helpers"
    case "assigned":
      return `${who} accepted`
    case "started":
      return `${who} is helping`
    case "awaiting_confirm":
    case "done":
      return "Help completed"
    case "cancelled":
    case "refunded":
      return "Cancelled"
    case "disputed":
      return "We're looking into this"
    case "resolved":
      return "This was reviewed"
    default:
      return "Request"
  }
}

export function modeLabel(mode: Mode, amount: number): string {
  if (mode === "volunteer") return "Volunteer"
  if (mode === "sponsored") return `Fund pays ${formatTestMoney(amount)}`
  return formatTestMoney(amount)
}
