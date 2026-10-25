"use client"

import { useEffect, useSyncExternalStore } from "react"
import { toHex, type Hex } from "viem"
import {
  chainAssign,
  chainBalance,
  chainDeposit,
  chainEscrow,
  chainFaucet,
  chainFundPool,
  chainFundReward,
  chainTip,
  chainVolunteer,
  readMesh,
} from "@/lib/chain/calls"
import { liveChain, plainError, requestKey as makeRequestKey } from "@/lib/chain/plain"
import { accountFor, helperRole } from "@/lib/chain/session"
import {
  addMessage,
  attachEscrow,
  cancelRequest,
  chooseHelper,
  confirmHelp,
  createRequest,
  depositPool,
  disputeRequest,
  dripFaucet,
  formatTestMoney,
  holdReward,
  markComplete,
  markStarted,
  resolveDispute,
  seed,
  sendTip,
  type Draft,
  type HelpRequest,
  type Profile,
  type State,
} from "@/lib/model"

const KEY = "helpmesh.v2" // v2: removed mock data
const serverState = seed()
let memory: State = serverState
let hydrated = false
let moneyReady = !liveChain
let inflight = false
const listeners = new Set<() => void>()
let channel: BroadcastChannel | null = null

function emit(remote: boolean) {
  if (!remote && typeof window !== "undefined") {
    localStorage.setItem(KEY, JSON.stringify(memory))
    channel?.postMessage(memory)
  }
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function read() {
  return memory
}

function isState(value: unknown): value is State {
  if (!value || typeof value !== "object") return false
  const state = value as State
  return Array.isArray(state.requests) && typeof state.balance === "number" && !!state.profile
}

function merge(saved: State): State {
  // Only keep user's own requests, no mock data merging
  return { 
    ...serverState, 
    ...saved, 
    profile: { ...serverState.profile, ...saved.profile }, 
    requests: saved.requests.filter((r) => !r.example) // Remove any example/mock requests
  }
}

export function hydrateDemo() {
  if (hydrated || typeof window === "undefined") return
  hydrated = true
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (isState(parsed)) memory = merge(parsed)
    }
  } catch {
    memory = seed()
  }
  if (!channel && "BroadcastChannel" in window) {
    channel = new BroadcastChannel("helpmesh")
    channel.onmessage = (event: MessageEvent<State>) => {
      if (!isState(event.data)) return
      memory = event.data
      emit(true)
    }
  }
  emit(true)
}

function change(update: (state: State) => { state: State; message: string }) {
  const result = update(memory)
  memory = result.state
  emit(false)
  return result.message
}

export function saveProfile(profile: Profile) {
  memory = { ...memory, profile }
  emit(false)
}

export function saveTrusted(name: string) {
  memory = { ...memory, trustedName: name }
  emit(false)
}

export function resetDemo() {
  memory = seed()
  emit(false)
}

function requestById(id: string) {
  return memory.requests.find((item) => item.id === id)
}

function usesChain(request: HelpRequest | undefined): request is HelpRequest & { chainKey: string } {
  return Boolean(liveChain && request && !request.example && request.chainKey)
}

async function guard(work: () => Promise<string>) {
  if (inflight) return "Please wait for the last step to finish."
  inflight = true
  try {
    return await work()
  } catch (error) {
    return plainError(error)
  } finally {
    inflight = false
  }
}

async function refreshMoney() {
  if (!liveChain || typeof window === "undefined") return
  const snap = await chainBalance()
  memory = { ...memory, balance: snap.balance, poolBalance: snap.poolBalance, faucetNext: snap.faucetNext }
  moneyReady = true
  emit(false)
}

function withBalance(amount: number) {
  return { ...memory, balance: memory.balance + amount }
}

function dropRequest(id: string) {
  memory = { ...memory, requests: memory.requests.filter((request) => request.id !== id) }
  emit(false)
}

export async function sendRequest(draft: Draft): Promise<{ id: string | null; message: string }> {
  if (inflight) return { id: null, message: "Please wait for the last step to finish." }
  const id = `req_${crypto.randomUUID().slice(0, 8)}`
  let chain: { chainKey: string; salt: string } | undefined
  if (liveChain) {
    const salt = toHex(crypto.getRandomValues(new Uint8Array(32)))
    chain = { chainKey: makeRequestKey(id, salt), salt }
  }
  const created = createRequest(memory, draft, id, chain, !liveChain)
  const saved = created.state.requests.some((request) => request.id === id)
  if (!saved) return { id: null, message: created.message }
  memory = created.state
  emit(false)
  
  // Publish to shared mesh API so other users can see it
  try {
    const meshRes = await fetch("/api/mesh/requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        id,
        owner: "me", // In production, use wallet address
        requesterName: memory.trustedName || "Someone",
        title: draft.title,
        description: draft.description,
        category: draft.category,
        mode: draft.mode,
        amount: draft.amount,
        place: draft.place,
        minutes: draft.minutes,
        communicate: draft.communicate,
        needsSummary: draft.needsSummary,
        shareNeeds: draft.shareNeeds,
      }),
    })
    const meshData = await meshRes.json()
    if (!meshData.ok) {
      console.error("[Mesh] Failed to broadcast request:", meshData.message || meshData.error)
    } else {
      console.log("[Mesh] Request broadcasted:", meshData.source, meshData.request?.id)
    }
  } catch (err) {
    console.error("[Mesh] Network error broadcasting request:", err)
  }
  
  if (!(liveChain && draft.mode === "sponsored" && chain)) return { id, message: created.message }

  inflight = true
  try {
    const funded = await chainFundPool(chain.chainKey as Hex, BigInt(draft.amount), draft.category)
    if (!funded.ok) {
      dropRequest(id)
      return { id: null, message: funded.message }
    }
    const snap = await readMesh(accountFor("you").address, chain.chainKey as Hex)
    if (snap.escrowState < 1) {
      dropRequest(id)
      return { id: null, message: "The fund has not recorded this yet. Try again." }
    }
    memory = {
      ...attachEscrow(memory, id, "pool", "The fund is holding the amount."),
      balance: snap.balance,
      poolBalance: snap.poolBalance,
      faucetNext: snap.faucetNext,
    }
    moneyReady = true
    emit(false)
    return { id, message: "The fund is holding the amount. We are looking for a helper." }
  } catch (error) {
    dropRequest(id)
    return { id: null, message: plainError(error) }
  } finally {
    inflight = false
  }
}

export function hold(id: string) {
  return guard(async () => {
    const request = requestById(id)
    if (!usesChain(request)) return change((state) => holdReward(state, id))
    const funded = await chainFundReward(request.chainKey as Hex, BigInt(request.amount))
    if (!funded.ok) return funded.message
    const snap = await readMesh(accountFor("you").address, request.chainKey as Hex)
    if (snap.escrowState < 1) return "The amount is not held yet. Try again."
    const local = holdReward(withBalance(request.amount), id)
    memory = { ...local.state, balance: snap.balance, poolBalance: snap.poolBalance, faucetNext: snap.faucetNext }
    emit(false)
    return local.message
  })
}

export function choose(id: string, helperId: string) {
  return guard(async () => {
    const request = requestById(id)
    
    // If request not in local state, it might be a shared request from the API
    // Import it to local state first
    if (!request) {
      try {
        // Update status in the database
        const res = await fetch("/api/mesh/requests", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id,
            status: "assigned",
            helperId: helperId === "me" ? "helper" : helperId,
            helperName: helperId === "me" ? memory.trustedName || "A helper" : undefined,
          }),
        })
        const data = await res.json()
        
        if (!data.ok) {
          console.error("[Choose] API error:", data.message)
          return data.message || "Could not accept this request."
        }
        
        // Create a minimal local request for navigation
        const localRequest: HelpRequest = {
          id,
          owner: "shared", // Mark as not mine
          requesterName: "Someone",
          title: "Accepted Request",
          description: "",
          category: "other",
          mode: "volunteer",
          amount: 0,
          place: "",
          minutes: 20,
          status: "assigned",
          helperId: helperId === "me" ? "me" : helperId,
          communicate: "Text",
          needsSummary: "",
          shareNeeds: false,
          example: false,
          events: ["You accepted this request."],
          messages: [],
          startedAt: null,
          escrow: null,
          chainKey: null,
          salt: null,
        }
        
        memory = {
          ...memory,
          requests: [...memory.requests, localRequest],
        }
        emit(false)
        
        return "You accepted! Opening the session now."
      } catch (err) {
        console.error("[Choose] Network error:", err)
        return "Network error. Please try again."
      }
    }
    
    // Original flow for local requests
    if (usesChain(request) && request.escrow) {
      const assigned = await chainAssign(request.chainKey as Hex, helperId)
      if (!assigned.ok) return assigned.message
      const snap = await readMesh(accountFor("you").address, request.chainKey as Hex)
      if (snap.escrowState < 2) return "The helper was not recorded yet. Try again."
    }
    
    // Also update in database if this was a shared request
    try {
      await fetch("/api/mesh/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          status: "assigned",
          helperId: helperId === "me" ? "helper" : helperId,
          helperName: helperId === "me" ? memory.trustedName || "A helper" : undefined,
        }),
      })
    } catch {
      // Continue even if API fails - local state will work
    }
    
    return change((state) => chooseHelper(state, id, helperId))
  })
}

export function startHelp(id: string) {
  return guard(async () => {
    const request = requestById(id)
    if (usesChain(request) && request.escrow) {
      const started = await chainEscrow(helperRole(request.helperId), request.chainKey as Hex, "start")
      if (!started.ok) return started.message
    }
    return change((state) => markStarted(state, id, Date.now()))
  })
}

export function completeHelp(id: string) {
  return guard(async () => {
    const request = requestById(id)
    if (usesChain(request) && request.escrow) {
      const done = await chainEscrow(helperRole(request.helperId), request.chainKey as Hex, "complete")
      if (!done.ok) return done.message
    }
    return change((state) => markComplete(state, id))
  })
}

export function confirm(id: string) {
  return guard(async () => {
    const request = requestById(id)
    if (usesChain(request)) {
      if (request.escrow) {
        const paid = await chainEscrow("you", request.chainKey as Hex, "confirm")
        if (!paid.ok) return paid.message
        const snap = await readMesh(accountFor("you").address, request.chainKey as Hex)
        if (snap.escrowState !== 5) return "The payment is not finished yet. Try again."
      } else if (request.mode === "volunteer" && request.helperId) {
        const proved = await chainVolunteer(request.chainKey as Hex, request.helperId)
        if (!proved.ok) return proved.message
      }
    }
    const local = change((state) => confirmHelp(state, id))
    await refreshMoney().catch(() => undefined)
    return local
  })
}

export function cancel(id: string, reason: string) {
  return guard(async () => {
    const request = requestById(id)
    if (usesChain(request) && request.escrow && request.escrow.state < 5) {
      const stopped = await chainEscrow("you", request.chainKey as Hex, "cancel")
      if (!stopped.ok) return stopped.message
    }
    const local = change((state) => cancelRequest(state, id, Date.now(), reason))
    await refreshMoney().catch(() => undefined)
    return local
  })
}

export function dispute(id: string) {
  return guard(async () => {
    const request = requestById(id)
    if (usesChain(request) && request.escrow) {
      const role = request.owner === "me" ? "you" : helperRole(request.helperId)
      const opened = await chainEscrow(role, request.chainKey as Hex, "dispute")
      if (!opened.ok) return opened.message
    }
    return change((state) => disputeRequest(state, id))
  })
}

export function resolve(id: string) {
  return change((state) => resolveDispute(state, id))
}

export function tip(helperId: string, amount: number, requestId?: string) {
  return guard(async () => {
    if (liveChain) {
      const request = requestId ? requestById(requestId) : undefined
      const sent = await chainTip(helperId, BigInt(amount), request?.chainKey as Hex | null | undefined)
      if (!sent.ok) return sent.message
      const local = sendTip(withBalance(amount), helperId, amount, requestId)
      memory = local.state
      await refreshMoney().catch(() => undefined)
      return local.message
    }
    return change((state) => sendTip(state, helperId, amount, requestId))
  })
}

export function donate(amount: number) {
  return guard(async () => {
    if (liveChain) {
      const sent = await chainDeposit(BigInt(amount))
      if (!sent.ok) return sent.message
      const local = depositPool(withBalance(amount), amount)
      memory = local.state
      await refreshMoney().catch(() => undefined)
      return local.message
    }
    return change((state) => depositPool(state, amount))
  })
}

export function faucet() {
  return guard(async () => {
    if (!liveChain) return change((state) => dripFaucet(state, Date.now()))
    const sent = await chainFaucet()
    if (!sent.ok) return sent.message
    await refreshMoney()
    const money = formatTestMoney(100 * 1_000_000)
    memory = { ...memory, activity: [`Added ${money}.`, ...memory.activity] }
    emit(false)
    return `Added ${money}.`
  })
}
export function chat(id: string, from: string, body: string) {
  memory = addMessage(memory, id, from, body)
  emit(false)
}

export function useDemo() {
  const state = useSyncExternalStore(subscribe, read, () => serverState)
  const ready = useSyncExternalStore(subscribe, () => hydrated, () => false)
  const funded = useSyncExternalStore(subscribe, () => moneyReady, () => !liveChain)
  useEffect(() => {
    hydrateDemo()
    if (!liveChain) return
    void refreshMoney().catch(() => {
      memory = { ...memory, balance: 0, poolBalance: 0 }
      moneyReady = true
      emit(true)
    })
  }, [])
  return { ...state, ready, funded }
}
