import { isAddress, type Address, type Hex } from "viem"
import { handleMesh, limited, readSnapshot } from "@/lib/server/mesh"


function clientKey(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local"
}

export async function GET(request: Request) {
  if (limited(`read:${clientKey(request)}`)) {
    return Response.json({ ok: false, message: "Please wait a moment, then try again." }, { status: 429 })
  }
  const url = new URL(request.url)
  const rawAddress = url.searchParams.get("address")
  const rawRequest = url.searchParams.get("request")
  const address = rawAddress && isAddress(rawAddress) ? (rawAddress as Address) : null
  const requestKey = rawRequest && /^0x[0-9a-fA-F]{64}$/.test(rawRequest) ? (rawRequest as Hex) : null
  if (rawAddress && !address) {
    return Response.json({ ok: false, message: "That did not go through. Try again." }, { status: 400 })
  }
  try {
    const snapshot = await readSnapshot(address, requestKey)
    return Response.json({ ok: true, snapshot })
  } catch {
    return Response.json(
      { ok: false, message: "The network did not respond. Try again." },
      { status: 503 },
    )
  }
}

export async function POST(request: Request) {
  if (limited(`write:${clientKey(request)}`)) {
    return Response.json({ ok: false, message: "Please wait a moment, then try again." }, { status: 429 })
  }
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, message: "That did not go through. Try again." }, { status: 400 })
  }
  const result = await handleMesh(body)
  return Response.json(result, { status: result.ok ? 200 : 400 })
}
