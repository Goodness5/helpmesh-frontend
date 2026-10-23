import type { Metadata } from "next"
import { ProfileContent } from "./profile-content"

export const metadata: Metadata = {
  title: "My Profile",
  description: "View your help history, connections, and manage your profile.",
}

export default function ProfilePage() {
  return <ProfileContent />
}
