import type { Metadata } from "next"
import Link from "next/link"
import { PageTitle } from "@/components/page-title"
import { Compass, ArrowUpRight } from "lucide-react"

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested route does not exist on HelpMesh.",
}

export default function NotFound() {
  return (
    <div className="w-full py-16 sm:py-24 text-center font-mono space-y-6">
      <div className="size-20 rounded-3xl bg-zinc-900 border border-zinc-800 mx-auto flex items-center justify-center text-[#25f497]">
        <Compass className="size-10 stroke-[1.6]" />
      </div>

      <div className="space-y-2">
        <span className="text-xs uppercase tracking-widest text-[#25f497] bg-[#25f497]/10 px-3.5 py-1.5 rounded-full border border-[#25f497]/20">
          404 Not Found
        </span>
        <PageTitle>Page not found</PageTitle>
        <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto leading-relaxed pt-2">
          The link may be outdated, or the assistance session has expired from the peer mesh.
        </p>
      </div>

      <div className="pt-4">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 bg-[#25f497] hover:bg-[#1ee088] text-black font-semibold px-7 py-3.5 rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_24px_rgba(37,244,151,0.2)] text-sm"
        >
          <span>Return to Home Mesh</span>
          <span className="flex items-center justify-center size-5 rounded-full bg-black text-[#25f497]">
            <ArrowUpRight className="size-3 stroke-[2.5]" />
          </span>
        </Link>
      </div>
    </div>
  )
}
