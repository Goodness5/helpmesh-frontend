import { generatePrivateKey, privateKeyToAccount, type PrivateKeyAccount } from "viem/accounts"
import type { Hex } from "viem"

export type SignerRole = "you" | "device" | "daniel" | "priya"

const STORAGE = "helpmesh.signers.v1"

type Stored = Partial<Record<SignerRole, Hex>>

function read(): Stored {
  if (typeof window === "undefined") return {}
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE) ?? "{}")
    if (!parsed || typeof parsed !== "object") return {}
    return parsed as Stored
  } catch {
    return {}
  }
}

function write(stored: Stored) {
  localStorage.setItem(STORAGE, JSON.stringify(stored))
}

/** Keys stay in this browser. The screen never shows them. */
export function accountFor(role: SignerRole): PrivateKeyAccount {
  const stored = read()
  let key = stored[role]
  if (!key) {
    key = generatePrivateKey()
    stored[role] = key
    write(stored)
  }
  return privateKeyToAccount(key)
}

export function helperRole(helperId: string | null): SignerRole {
  if (helperId === "daniel" || helperId === "priya") return helperId
  if (helperId === "you") return "you"
  return "device"
}
