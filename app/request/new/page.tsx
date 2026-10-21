import type { Metadata } from "next"
import { NewRequest } from "@/components/new-request"

export const metadata: Metadata = {
  title: "Ask for help",
  description: "Describe what you need. Choose free help, a reward, or a fund. You review everything before it is sent.",
}

export default function NewRequestPage() {
  return <NewRequest />
}
