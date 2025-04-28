import * as React from "react"
import { cn } from "../../lib/utils"

export interface GlowProps {
  children: React.ReactNode
  className?: string
}

export function Glow({ children, className }: GlowProps) {
  return (
    <div
      className={cn(
        "relative before:absolute before:inset-0 before:rounded-[inherit] before:bg-gradient-to-r before:from-primary/20 before:to-primary/10 before:blur-3xl",
        className
      )}
    >
      {children}
    </div>
  )
} 