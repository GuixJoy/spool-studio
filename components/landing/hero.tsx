"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { Check, Copy, Github, Server } from "lucide-react"
import { useState } from "react"
import type { ReactNode } from "react"
import { siCloudflare, siPostgresql, siVercel } from "simple-icons"

const EASE = [0.25, 0.1, 0.25, 1] as const

const CLONE_CMD = "git clone https://github.com/IntegerAlex/spool-studio.git"

function ChromeMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path d="M12,12 L12,2 A10,10 0 0,1 20.66,17 Z" fill="#EA4335" />
      <path d="M12,12 L20.66,17 A10,10 0 0,1 3.34,17 Z" fill="#34A853" />
      <path d="M12,12 L3.34,17 A10,10 0 0,1 12,2 Z" fill="#FBBC05" />
      <circle cx={12} cy={12} r={5.4} fill="#FFFFFF" />
      <circle cx={12} cy={12} r={4.2} fill="#4285F4" />
    </svg>
  )
}

function BrandMark({ path, fill }: { path: string; fill: string }) {
  return (
    <svg width={56} height={56} viewBox="0 0 24 24" aria-hidden style={{ fill }}>
      <path d={path} />
    </svg>
  )
}

function TopoNode({ mark, lines, label }: { mark: ReactNode; lines: string[]; label: string }) {
  return (
    <div title={label} className="flex h-[88px] shrink-0 items-center gap-4">
      {mark}
      <div>
        {lines.map((line, j) => (
          <p
            key={line}
            className={`whitespace-nowrap font-mono text-[13px] ${
              j === 0 ? "font-bold !text-[#ededed]" : "!text-[#71717a]"
            }`}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  )
}

/**
 * Where Spool runs: your browser talks to the app, which talks to Postgres
 * and S3-compatible storage — every box on hardware you control.
 */
function OwnershipCard() {
  const [copied, setCopied] = useState(false)

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(CLONE_CMD)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard unavailable — leave the button as-is.
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#0a0a0a] p-5 sm:p-6">
      <p className="font-mono text-[12px] tracking-[0.14em] !text-[#71717a]">
        Where it runs
      </p>
      <div className="mt-4 overflow-x-auto">
        <div className="flex min-w-[660px] items-center justify-between gap-2" role="list" aria-label="Infrastructure flow">
          <div role="listitem">
            <TopoNode
              mark={<ChromeMark size={56} />}
              lines={["browser"]}
              label="you · browser"
            />
          </div>
          <div aria-hidden className="h-px w-16 shrink-0 bg-[rgba(95,189,145,0.35)]" />
          <div role="listitem">
            <TopoNode
              // eslint-disable-next-line @next/next/no-img-element
              mark={<img src="/Spool_logo.png" alt="" width={56} height={56} className="h-14 w-14 object-contain" />}
              lines={[":3000", "AGPL-3.0"]}
              label="spool app"
            />
            <div aria-hidden className="ml-7 h-4 w-px bg-[rgba(95,189,145,0.35)]" />
            <div className="flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-black px-2.5 py-1 font-mono text-[11px] !text-[#cfcfcf]">
                <svg width={12} height={12} viewBox="0 0 24 24" aria-hidden style={{ fill: "#FFFFFF" }}>
                  <path d={siVercel.path} />
                </svg>
                Vercel
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.1)] bg-black px-2.5 py-1 font-mono text-[11px] !text-[#cfcfcf]">
                <Server className="h-3 w-3 !text-[#5FBD91]" />
                any VM
              </span>
            </div>
          </div>
          <div aria-hidden className="h-px w-6 shrink-0 bg-[rgba(95,189,145,0.35)]" />
          <div className="relative">
            <div aria-hidden className="absolute bottom-[44px] left-0 top-[44px] w-px bg-[rgba(95,189,145,0.35)]" />
            <div className="flex flex-col gap-6 pl-6">
              <div role="listitem">
                <TopoNode
                  mark={<BrandMark path={siPostgresql.path} fill={`#${siPostgresql.hex}`} />}
                  lines={["your data"]}
                  label="postgres"
                />
              </div>
              <div role="listitem">
                <TopoNode
                  mark={<BrandMark path={siCloudflare.path} fill={`#${siCloudflare.hex}`} />}
                  lines={["your files"]}
                  label="r2 storage"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      <p className="mt-4 font-mono text-[11px] !text-[#525252]">
        everything runs on hardware you control
      </p>
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[rgba(255,255,255,0.07)] pt-4">
        <code className="min-w-0 flex-1 break-all rounded-full border border-[rgba(255,255,255,0.1)] bg-black px-4 py-2 font-mono text-[12px] !text-[#cfcfcf]">
          <span className="mr-2 select-none !text-[#35A774]">$</span>
          {CLONE_CMD}
        </code>
        <button
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[rgba(255,255,255,0.13)] px-4 py-2 font-mono text-[12px] !text-[#a1a1aa] transition-colors hover:border-[rgba(255,255,255,0.25)] hover:!text-[#ededed]"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 !text-[#35A774]" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  )
}

export function Hero() {
  return (
    <section className="relative w-full overflow-hidden border-b border-[rgba(255,255,255,0.08)] bg-black">
      <div className="grid w-full items-center gap-12 px-6 pb-20 pt-32 sm:px-10 sm:pt-36 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-16 lg:pt-44 xl:px-24">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE }}
        >
          <h1 className="font-mono text-5xl font-bold leading-[1.05] tracking-[-0.01em] !text-[#ededed] sm:text-7xl lg:text-8xl">
            Client content, approved on time.
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed !text-[#a1a1a1] sm:text-base">
            Open-source content ops (AGPL-3.0). Self-host free, or we host it
            for you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href="https://github.com/IntegerAlex/spool-studio"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#ededed] px-6 py-2.5 text-[14px] font-medium !text-[#0a0a0a] transition-colors duration-150 hover:bg-white"
            >
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
            <Link
              href="#contact"
              className="inline-flex items-center gap-2 rounded-full border border-[rgba(255,255,255,0.13)] px-6 py-2.5 text-[14px] !text-[#a1a1a1] transition-colors duration-150 hover:border-[rgba(255,255,255,0.25)] hover:!text-[#ededed]"
            >
              We host it for you
              <span aria-hidden>→</span>
            </Link>
          </div>

          <p className="mt-10 font-mono text-[12px] tracking-[0.14em] !text-[#525252]">
            AGPL-3.0 · SELF-HOSTED · NO PER-SEAT PRICING
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE, delay: 0.15 }}
        >
          <OwnershipCard />
        </motion.div>
      </div>
    </section>
  )
}
