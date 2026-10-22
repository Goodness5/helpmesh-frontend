"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

export function Dialog({
  open,
  title,
  description,
  onClose,
  children,
}: {
  open: boolean
  title: string
  description: string
  onClose: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()
  const descriptionId = useId()

  const returnTo = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) {
      returnTo.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
      el.showModal()
    }
    if (!open && el.open) el.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="m-auto max-w-lg w-[calc(100%-2rem)] rounded-3xl border border-zinc-800 bg-zinc-950 p-6 sm:p-8 text-zinc-100 shadow-2xl backdrop:bg-black/80 backdrop:backdrop-blur-sm focus:outline-none"
      onClose={() => {
        onClose()
        returnTo.current?.focus()
      }}
    >
      <div className="flex items-start justify-between gap-4 mb-2">
        <h2 id={titleId} className="text-xl sm:text-2xl font-mono font-medium text-white tracking-tight">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="flex items-center justify-center size-8 rounded-full border border-zinc-800 bg-zinc-900/80 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shrink-0"
        >
          <X className="size-4" />
        </button>
      </div>
      <p id={descriptionId} className="text-sm font-mono text-zinc-400 leading-relaxed mb-6">
        {description}
      </p>
      {children}
    </dialog>
  )
}
