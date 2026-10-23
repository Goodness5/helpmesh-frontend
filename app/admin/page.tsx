import type { Metadata } from "next"
import { AdminDashboard } from "./admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Platform administration and monitoring dashboard.",
}

export default function AdminPage() {
  return <AdminDashboard />
}
