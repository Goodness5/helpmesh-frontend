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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", marginBottom: "0.5rem" }}>
        <h2 id={titleId} style={{ margin: 0, fontSize: "1.35rem" }}>{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          style={{
            background: "var(--surface-raised)",
            border: "1px solid var(--line)",
            color: "var(--muted)",
            cursor: "pointer",
            fontSize: "0.85rem",
            width: "1.75rem",
            height: "1.75rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "9999px",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          ✕
        </button>
      </div>
      <p id={descriptionId} style={{ color: "var(--muted)", fontSize: "0.925rem", lineHeight: 1.55, margin: "0.5rem 0 1.25rem" }}>
        {description}
      </p>
      {children}
    </dialog>
  )
}
