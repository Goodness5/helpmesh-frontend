import type { Metadata } from "next"
import { FundScreen } from "@/components/fund-screen"

export const metadata: Metadata = {
  title: "Accessibility Fund",
  description: "Add to a fund that pays for eligible help. Donations cannot be taken back.",
}

export default function FundPage() {
  return <FundScreen />
}
