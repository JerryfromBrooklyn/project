import * as React from "react"
import { cn } from "../../lib/utils"

export interface MockupProps {
  children: React.ReactNode
  className?: string
}

export function Mockup({ children, className }: MockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto max-w-[320px] rounded-[2.5rem] border-[14px] border-background bg-background p-1 shadow-xl",
        className
      )}
    >
      {children}
    </div>
  )
} 