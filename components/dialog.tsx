"use client"

import { useEffect, useId, useRef, type ReactNode } from "react"

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
      onClose={() => {
        onClose()
        returnTo.current?.focus()
      }}
    >
      <h2 id={titleId}>{title}</h2>
      <p id={descriptionId}>{description}</p>
      {children}
    </dialog>
  )
}
