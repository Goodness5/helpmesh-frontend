import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { PageTitle } from "@/components/page-title"
import { ProfileStats, SupportButton } from "@/components/support-button"
import { HELPERS } from "@/lib/model"

export function generateStaticParams() {
  return HELPERS.map((helper) => ({ id: helper.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const helper = HELPERS.find((item) => item.id === id)
  if (!helper) return { title: "Helper" }
  return {
    title: helper.name,
    description: `${helper.name} helps nearby. Reputation comes only from confirmed help.`,
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const helper = HELPERS.find((item) => item.id === id)
  if (!helper) notFound()
  return (
    <>
      <PageTitle>{helper.name}</PageTitle>
      <ProfileStats helperId={helper.id} />
      <p>Reputation comes only from confirmed help. Money cannot raise it.</p>
      <ul className="timeline">
        <li>{helper.verified ? "Identity checked." : "Identity not checked."}</li>
        <li>{helper.distanceM} meters {helper.direction}.</li>
        <li>{helper.acceptsFree ? "Accepts free requests." : "Does not take free requests."}</li>
        <li>{helper.acceptsPaid ? "Accepts rewards." : "Does not take rewards."}</li>
        <li>Communicates by {helper.communicate.join(" and ")}.</li>
      </ul>
      <SupportButton helperId={helper.id} helperName={helper.name} />
      <p><Link href="/helper">Back to requests</Link></p>
    </>
  )
}
