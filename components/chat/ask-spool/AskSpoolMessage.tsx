"use client"

import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export type ChatRole = "user" | "assistant"

interface AskSpoolMessageProps {
  role: ChatRole
  children: ReactNode
  /** Light bubble (white bg, black text) for demo contexts. Defaults to dashboard dark. */
  tone?: "dark" | "light"
}

/**
 * A single chat bubble. User messages align right on a muted surface; assistant
 * messages align left on the card surface. Extra inline content (tool cards,
 * denial banners) is passed as children below the main text.
 */
export function AskSpoolMessage({ role, children, tone = "dark" }: AskSpoolMessageProps) {
  const isUser = role === "user"
  const light = tone === "light"
  return (
    <div
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-xl px-3 py-2 text-[13px] leading-relaxed",
          isUser
            ? light
              ? "rounded-br-sm bg-[#35A774] !text-black"
              : "rounded-br-sm bg-[var(--primary)]/90 text-[var(--primary-foreground)]"
            : light
              ? "rounded-bl-sm border border-transparent bg-white !text-black"
              : "rounded-bl-sm bg-[var(--surface-card)] text-[var(--color-text-primary)] border border-[rgba(255,255,255,0.06)]",
        )}
      >
        {children}
      </div>
    </div>
  )
}
