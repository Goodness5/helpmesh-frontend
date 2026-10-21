import type { Metadata } from "next"
import { SettingsForm } from "@/components/settings-form"

export const metadata: Metadata = {
  title: "Display settings",
  description: "Text size, theme, contrast, motion, and a font that is easier to read.",
}

export default function SettingsPage() {
  return <SettingsForm />
}
