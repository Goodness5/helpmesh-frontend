import type { Metadata } from "next"
import { HelperBoard } from "@/components/helper-board"

export const metadata: Metadata = {
  title: "Help someone",
  description: "Open requests nearby, as a list. Each one shows the need, distance, and how to communicate.",
}

export default function HelperPage() {
  return <HelperBoard />
}
