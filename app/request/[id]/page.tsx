import type { Metadata } from "next"
import { RequestScreen } from "@/components/request-screen"

export const metadata: Metadata = {
  title: "Request",
  description: "The status of a help request, in words.",
}

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <RequestScreen id={id} />
}
