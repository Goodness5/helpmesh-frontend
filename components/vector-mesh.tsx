"use client"

import { useEffect, useRef } from "react"

export function VectorMesh({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationFrameId: number
    let width = 0
    let height = 0
    let dpr = 1

    // Default target towards center-right
    let targetX = 0
    let targetY = 0
    let currentX = 0
    let currentY = 0
    let hasMouseMoved = false

    const reduceMotion =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.motion === "reduce")

    function resize() {
      if (!canvas) return
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = canvas.parentElement?.clientWidth || window.innerWidth
      height = canvas.parentElement?.clientHeight || window.innerHeight
      canvas.width = width * dpr
      canvas.height = height * dpr
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      if (!hasMouseMoved) {
        targetX = width * 0.75
        targetY = height * 0.35
        currentX = targetX
        currentY = targetY
      }
    }

    function onMouseMove(e: MouseEvent) {
      const rect = canvas?.getBoundingClientRect()
      if (!rect) return
      targetX = e.clientX - rect.left
      targetY = e.clientY - rect.top
      hasMouseMoved = true
    }

    window.addEventListener("resize", resize)
    window.addEventListener("mousemove", onMouseMove, { passive: true })
    resize()

    const step = 34
    const lineLen = 14

    function render() {
      if (!ctx || !canvas) return

      // Smooth cursor interpolation
      if (!reduceMotion) {
        currentX += (targetX - currentX) * 0.08
        currentY += (targetY - currentY) * 0.08
      } else {
        currentX = targetX
        currentY = targetY
      }

      ctx.save()
      ctx.scale(dpr, dpr)
      ctx.clearRect(0, 0, width, height)

      const isLight = document.documentElement.dataset.theme === "light" ||
        (!document.documentElement.dataset.theme && window.matchMedia("(prefers-color-scheme: light)").matches)

      const cols = Math.ceil(width / step) + 1
      const rows = Math.ceil(height / step) + 1

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * step
          const y = j * step

          let angle = -Math.PI / 4 // 45 deg default
          let dist = 1000

          if (!reduceMotion) {
            const dx = currentX - x
            const dy = currentY - y
            dist = Math.sqrt(dx * dx + dy * dy)
            angle = Math.atan2(dy, dx)
          }

          // Subtle opacity increase closer to cursor
          const proximity = Math.max(0, 1 - dist / 500)
          const alpha = isLight
            ? 0.12 + proximity * 0.2
            : 0.14 + proximity * 0.24

          ctx.strokeStyle = isLight
            ? `rgba(9, 9, 11, ${alpha.toFixed(3)})`
            : `rgba(255, 255, 255, ${alpha.toFixed(3)})`
          ctx.lineWidth = 1.35
          ctx.lineCap = "round"

          const half = lineLen / 2
          const cos = Math.cos(angle)
          const sin = Math.sin(angle)

          ctx.beginPath()
          ctx.moveTo(x - cos * half, y - sin * half)
          ctx.lineTo(x + cos * half, y + sin * half)
          ctx.stroke()
        }
      }

      ctx.restore()

      if (!reduceMotion) {
        animationFrameId = requestAnimationFrame(render)
      }
    }

    render()

    return () => {
      window.removeEventListener("resize", resize)
      window.removeEventListener("mousemove", onMouseMove)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 z-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  )
}
