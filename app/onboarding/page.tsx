import type { Metadata } from "next"
import { Onboarding } from "@/components/onboarding"

export const metadata: Metadata = {
  title: "Set up",
  description: "Choose how you use HelpMesh and how the app looks. You can skip any question.",
}

export default function OnboardingPage() {
  return <Onboarding />
}
