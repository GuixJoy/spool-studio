"use client"

import type { JSX } from "react"
import { motion } from "framer-motion"
import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import { ArrowRight, CalendarDays, CheckCircle2, Kanban, Sparkles } from "lucide-react"
import { useState } from "react"
import { StatusBadge } from "@/components/assets/status-badge"
import { KanbanBoard } from "@/components/kanban/board"
import { MonthView } from "@/app/dashboard/calendar/page"
import type { CalendarClientOption } from "@/components/calendar/calendar-filters"
import { AskSpoolInput } from "@/components/chat/ask-spool/AskSpoolInput"
import { AskSpoolMessage } from "@/components/chat/ask-spool/AskSpoolMessage"
import { formatDateKey } from "@/lib/calendar-utils"
import type { Asset, AssetStatus, CalendarEvent } from "@/types/index"

// Mux motion token: plain ease, quick entrances. One movement vocabulary.
const EASE = [0.25, 0.1, 0.25, 1] as const

interface Feature {
  id: string
  index: string
  title: string
  headline: string
  description: string
  points: string[]
  href: string
  icon: LucideIcon
}

const FEATURES: Feature[] = [
  {
    id: "pipeline",
    index: "01",
    title: "Production Pipeline",
    headline: "Every asset, one board",
    description:
      "Track each piece of client content from draft to published. No status meetings, no lost files.",
    points: [
      "Draft → Review → Approval → Published",
      "Assign teammates, filter by client",
      "Spot blockers before publish day",
    ],
    href: "/login",
    icon: Kanban,
  },
  {
    id: "calendar",
    index: "02",
    title: "Calendar & Planning",
    headline: "The month, at a glance",
    description:
      "Content cycles, schedules, and publish dates in one view. Know what's shipping this week.",
    points: [
      "Month, week, and day views",
      "Contracts and queue overlaid",
      "Recurring content cycles",
    ],
    href: "/login",
    icon: CalendarDays,
  },
  {
    id: "approvals",
    index: "03",
    title: "Client Review",
    headline: "Approvals without accounts",
    description:
      "Clients review and approve through a token link. No seats, no logins, no friction.",
    points: [
      "Approve, reject, request changes",
      "Comments on the exact file version",
      "Full approval history per asset",
    ],
    href: "/login",
    icon: CheckCircle2,
  },
  {
    id: "assets-ai",
    index: "04",
    title: "Assets & AI",
    headline: "A library that answers",
    description:
      "One library for reels and posters — plus Ask Spool AI to move work and surface answers.",
    points: [
      "Previews, versions, comments",
      "Upload queue with retry",
      "Ask: approvals, moves, summaries",
    ],
    href: "/login",
    icon: Sparkles,
  },
]

/* CSS-built product illustrations. Real status vocabulary, zero stock photos. */

function LiveBoard() {
  const now = new Date()
  const make = (
    id: string,
    title: string,
    type: Asset["type"],
    status: Asset["status"],
  ): Asset => ({
    id,
    clientId: "demo-halcyon",
    title,
    type,
    status,
    uploadedAt: null,
    createdBy: null,
    createdAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: now,
    scheduledAt: null,
    publishedAt: null,
    approvedAt: null,
    assignedTo: [],
    revisions: [],
    comments: [],
  })
  const [assets, setAssets] = useState<Asset[]>([
    make("demo-1", "Reel_04.mp4", "reel", "draft"),
    make("demo-2", "Poster_02.png", "poster", "draft"),
    make("demo-3", "Reel_03.mp4", "reel", "ready_for_review"),
    make("demo-4", "Poster_01.png", "poster", "revision_requested"),
    make("demo-5", "Reel_01.mp4", "reel", "approved"),
  ])

  return (
    <div>
      <p className="mb-3 font-mono text-[12px] tracking-[0.14em] !text-[#71717a]">
        Live demo — drag a card · sample data
      </p>
      <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-3 sm:p-4">
        <KanbanBoard
          assets={assets}
          canApprove
          onStatusChange={(assetId, newStatus) =>
            setAssets((prev) =>
              prev.map((a) => (a.id === assetId ? { ...a, status: newStatus } : a)),
            )
          }
          onQuickApprove={(assetId) =>
            setAssets((prev) =>
              prev.map((a) =>
                a.id === assetId
                  ? { ...a, status: "approved", approvedAt: new Date() }
                  : a,
              ),
            )
          }
        />
      </div>
    </div>
  )
}

function demoEvent(
  id: string,
  title: string,
  kind: CalendarEvent["kind"],
  daysFromNow: number,
): CalendarEvent {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  d.setHours(10, 0, 0, 0)
  return {
    id,
    kind,
    title,
    clientId: "demo-halcyon",
    clientName: "Halcyon Studio",
    start: d.toISOString(),
    href: null,
    assetId: null,
    uploadQueueId: null,
    platform: null,
    status: null,
    note: null,
    caption: null,
    contractEndDate: null,
  }
}

const DEMO_CLIENTS = new Map<string, CalendarClientOption>([
  ["demo-halcyon", { id: "demo-halcyon", name: "Halcyon Studio", brandColor: "#35A774" }],
])

function CalendarLive() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    demoEvent("cal-1", "Reel_04 publish", "publish", 2),
    demoEvent("cal-2", "Poster_02 approval", "approval", 5),
    demoEvent("cal-3", "Reel_05 upload", "upload", 7),
    demoEvent("cal-4", "Poster_03 publish", "publish", 11),
  ])
  const [dragId, setDragId] = useState<string | null>(null)
  const [selected, setSelected] = useState<CalendarEvent | null>(null)

  const getEventsForDate = (d: Date) => {
    const key = formatDateKey(d)
    return events.filter((e) => formatDateKey(new Date(e.start)) === key)
  }

  return (
    <div>
      <p className="mb-3 font-mono text-[12px] tracking-[0.14em] !text-[#71717a]">
        Live demo — drag an event to reschedule · sample data
      </p>
      <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-3">
        <MonthView
          currentDate={new Date()}
          getEventsForDate={getEventsForDate}
          events={events}
          clientsById={DEMO_CLIENTS}
          onSelectDate={() => setSelected(null)}
          onSelectEvent={(e) => setSelected(e)}
          onScheduleDate={() => undefined}
          onDropDate={({ date }) => {
            if (!dragId) return
            setEvents((prev) =>
              prev.map((e) => {
                if (e.id !== dragId) return e
                const start = new Date(e.start)
                const next = new Date(date)
                next.setHours(start.getHours(), start.getMinutes(), 0, 0)
                return { ...e, start: next.toISOString() }
              }),
            )
            setDragId(null)
          }}
          onDragStartEvent={(id) => setDragId(id)}
        />
      </div>
      <p className="mt-2 min-h-[18px] font-mono text-[11px] !text-[#5FBD91]">
        {selected ? `${selected.title} · ${selected.clientName ?? ""}` : ""}
      </p>
    </div>
  )
}

function PortalVisual() {
  const [approved, setApproved] = useState(false)
  return (
    <div className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-black p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate font-mono text-[11px] !text-[#ededed]">Reel_04.mp4</p>
        <StatusBadge status={approved ? "approved" : "revision_requested"} />
      </div>
      <p className="mt-2 text-[12px] leading-relaxed !text-[#a1a1aa]">
        “Swap the cover frame at 0:03, then good to go.”
      </p>
      {approved ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <p className="font-mono text-[11px] !text-[#5FBD91]">
            Approved · logged · designer notified
          </p>
          <button
            onClick={() => setApproved(false)}
            className="shrink-0 font-mono text-[11px] !text-[#71717a] underline-offset-4 hover:!text-[#a1a1aa] hover:underline"
          >
            Replay
          </button>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setApproved(true)}
            className="rounded-full bg-[#35A774] px-3 py-1 text-[11px] font-medium !text-black transition-colors hover:bg-[#5FBD91]"
          >
            Approve
          </button>
          <span className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-[11px] !text-[#a1a1aa]">
            Request changes
          </span>
        </div>
      )}
      <p className="mt-2.5 font-mono text-[10px] !text-[#525252]">
        halcyon-studio · token link · no account needed
      </p>
    </div>
  )
}

interface ChatLine {
  role: "user" | "assistant"
  text: string
  approvals?: AssetStatus[]
  moved?: string
}

function ChatDemo() {
  const [lines, setLines] = useState<ChatLine[]>([
    { role: "user", text: "approvals for Halcyon?" },
    {
      role: "assistant",
      text: "2 pending right now:",
      approvals: ["ready_for_review", "revision_requested"],
    },
  ])
  const [input, setInput] = useState("")

  const send = () => {
    const text = input.trim()
    if (!text) return
    setInput("")
    const lower = text.toLowerCase()
    if (lower.includes("move")) {
      setLines((prev) => [
        ...prev,
        { role: "user", text },
        { role: "assistant", text: "Done.", moved: "Reel_04 → review" },
      ])
    } else if (lower.includes("approv")) {
      setLines((prev) => [
        ...prev,
        { role: "user", text },
        {
          role: "assistant",
          text: "2 pending right now:",
          approvals: ["ready_for_review", "revision_requested"],
        },
      ])
    } else {
      setLines((prev) => [
        ...prev,
        { role: "user", text },
        { role: "assistant", text: "Try “approvals” or “move Reel_04 to review”." },
      ])
    }
  }

  return (
    <div>
      <p className="mb-3 font-mono text-[12px] tracking-[0.14em] !text-[#71717a]">
        Live demo — type below · sample data
      </p>
      <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-black">
        <div className="space-y-2.5 p-3">
          {lines.map((line, i) => (
            // SAFETY: demo lines are append-only; index keys are stable here.
            <AskSpoolMessage
              key={i}
              role={line.role}
              tone="light"
            >
              <span style={{ color: "#000" }}>{line.text}</span>
              {line.approvals && (
                <span className="mt-2 flex flex-wrap gap-1.5">
                  {line.approvals.map((s) => (
                    <StatusBadge key={s} status={s} />
                  ))}
                </span>
              )}
              {line.moved && (
                <span className="mt-1.5 block font-mono text-[11px] !text-[#0a2e1f]">
                  ✓ {line.moved} · logged
                </span>
              )}
            </AskSpoolMessage>
          ))}
        </div>
        <div className="border-t border-[rgba(255,255,255,0.07)]">
          <AskSpoolInput
            value={input}
            onChange={setInput}
            onSubmit={send}
            disabled={false}
            streaming={false}
            alwaysActive
          />
        </div>
      </div>
    </div>
  )
}

const VISUALS: Record<string, () => JSX.Element> = {
  calendar: CalendarLive,
  approvals: PortalVisual,
  "assets-ai": ChatDemo,
}

function FeatureText({ feature }: { feature: Feature }) {
  const Icon = feature.icon
  return (
    <>
      <p className="font-mono text-[12px] tracking-[0.14em] !text-[#35A774]">
        {feature.index} — {feature.title}
      </p>
      <h3 className="mt-3 font-mono text-[1.65rem] font-bold leading-[1.15] !text-[#ededed] sm:text-[2rem]">
        {feature.headline}
      </h3>
      <p className="mt-4 max-w-md text-[14px] leading-relaxed !text-[#a1a1a1] sm:text-[15px]">
        {feature.description}
      </p>
      <ul className="mt-6 space-y-2.5">
        {feature.points.map((point) => (
          <li
            key={point}
            className="flex items-start gap-2.5 text-[13px] leading-snug !text-[#cfcfcf] sm:text-[14px]"
          >
            <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 !text-[#35A774]" />
            {point}
          </li>
        ))}
      </ul>
      <Link
        href={feature.href}
        className="mt-7 inline-flex items-center gap-1.5 text-[14px] font-medium !text-[#5FBD91] no-underline transition-colors hover:!text-[#7fd4ad] hover:no-underline"
      >
        Open the app
        <ArrowRight className="h-4 w-4" />
      </Link>
    </>
  )
}

function FeatureRow({ feature, flip }: { feature: Feature; flip: boolean }) {
  // Pipeline gets the real interactive board, full width below its copy.
  if (feature.id === "pipeline") {
    return (
      <article className="border-t border-[rgba(255,255,255,0.08)] py-14 sm:py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="max-w-2xl"
        >
          <FeatureText feature={feature} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
          className="mt-10"
        >
          <LiveBoard />
        </motion.div>
      </article>
    )
  }

  const Visual = VISUALS[feature.id] ?? ChatDemo
  return (
    <article className="grid items-center gap-8 border-t border-[rgba(255,255,255,0.08)] py-14 sm:py-20 lg:grid-cols-2 lg:gap-14">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4, ease: EASE }}
        className={flip ? "lg:order-2" : ""}
      >
        <FeatureText feature={feature} />
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.4, ease: EASE, delay: 0.08 }}
        aria-hidden="true"
        className={flip ? "lg:order-1" : ""}
      >
        <Visual />
      </motion.div>
    </article>
  )
}

export function Features() {
  return (
    <section id="product" className="w-full scroll-mt-24 bg-black">
      <div className="w-full px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="pb-4 pt-16 sm:pt-20">
          <p className="font-mono text-[12px] tracking-[0.14em] !text-[#35A774]">
            Product
          </p>
          <h2 className="mt-3 max-w-xl font-mono text-[1.75rem] font-bold leading-tight !text-[#ededed] sm:text-[2.25rem]">
            Four tools. One workspace.
          </h2>
        </div>
        {FEATURES.map((feature, i) => (
          <FeatureRow key={feature.id} feature={feature} flip={i % 2 === 1} />
        ))}
      </div>
    </section>
  )
}
