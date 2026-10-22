import type { ReactNode } from "react"

export function PageTitle({ children }: { children: ReactNode }) {
  return (
    <h1
      tabIndex={-1}
      className="text-3xl sm:text-4xl md:text-5xl font-mono font-medium tracking-tight text-white outline-none focus:outline-none"
    >
      {children}
    </h1>
  )
}
