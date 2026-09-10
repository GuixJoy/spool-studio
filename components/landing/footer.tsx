import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  BookOpen,
  Github,
  LayoutGrid,
  Sparkles,
  UserCheck,
} from "lucide-react"

const FOOTER_BG = "#0a2e1f"
const FOOTER_TEXT = "#ffffff"

const columns: {
  heading: string
  icon: React.ReactNode
  links: { label: string; href: string; external?: boolean }[]
}[] = [
  {
    heading: "Product",
    icon: <LayoutGrid className="h-3.5 w-3.5" />,
    links: [
      { label: "Sign in", href: "/login" },
      { label: "Pipeline", href: "/#product" },
      { label: "Calendar", href: "/#product" },
      { label: "Client portal", href: "/#product" },
      { label: "Ask Spool AI", href: "/#product" },
    ],
  },
  {
    heading: "Resources",
    icon: <BookOpen className="h-3.5 w-3.5" />,
    links: [
      {
        label: "Documentation",
        href: "https://github.com/IntegerAlex/spool-studio#readme",
        external: true,
      },
      {
        label: "Self-hosting guide",
        href: "https://github.com/IntegerAlex/spool-studio#readme",
        external: true,
      },
      {
        label: "Changelog",
        href: "https://github.com/IntegerAlex/spool-studio/releases",
        external: true,
      },
    ],
  },
  {
    heading: "Company",
    icon: <Boxes className="h-3.5 w-3.5" />,
    links: [
      {
        label: "Source code",
        href: "https://github.com/IntegerAlex/spool-studio",
        external: true,
      },
      {
        label: "Issues",
        href: "https://github.com/IntegerAlex/spool-studio/issues",
        external: true,
      },
      {
        label: "License",
        href: "https://github.com/IntegerAlex/spool-studio/blob/main/LICENSE",
        external: true,
      },
    ],
  },
]

function ExternalLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group/link inline-flex items-center gap-1 text-[13px] !text-white transition-colors hover:!text-[#8ACDAE]"
    >
      {label}
      <ArrowRight className="h-3 w-3 -translate-x-1 opacity-0 transition-[opacity,transform] duration-150 group-hover/link:translate-x-0 group-hover/link:opacity-100" />
    </a>
  )
}

function BottomFooter() {
  return (
    <div
      className="w-full overflow-hidden"
      style={{ backgroundColor: FOOTER_BG }}
    >
      <div className="flex h-[20vh] w-full items-center justify-center overflow-hidden px-6 sm:px-10 lg:px-16">
        <h2
          className="
            whitespace-nowrap
            text-center
            font-black
            uppercase
            leading-none
            tracking-[-0.07em]
            !text-[#8ACDAE]
            text-[clamp(5rem,17vw,14rem)]
          "
        >
          SPOOL STUDIO
        </h2>
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <div style={{ backgroundColor: FOOTER_BG }}>
      <footer
        className="relative overflow-hidden border-t border-white/20 !text-white"
        style={{ backgroundColor: FOOTER_BG, color: FOOTER_TEXT }}
      >
        <div className="relative w-full px-6 pb-10 pt-20 sm:px-10 lg:px-16 xl:px-24">
          {/* Brand + columns */}
          <div className="grid gap-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
            <div>
              <Link
                href="/"
                className="text-[14px] font-semibold uppercase tracking-wider !text-white transition-colors hover:!text-[#8ACDAE]"
              >
                Spool<span className="!text-white">.</span>
              </Link>
              <p className="mt-4 max-w-[260px] text-[13px] leading-relaxed !text-white">
                Content and asset operations for creative teams. Plan, produce,
                review, approve, and publish — from one workspace.
              </p>
              <a
                href="https://github.com/IntegerAlex/spool-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-[13px] !text-white transition-colors hover:border-[#8ACDAE] hover:bg-white/10 hover:!text-[#8ACDAE]"
              >
                <Github className="h-4 w-4" />
                Star on GitHub
              </a>
            </div>

            {columns.map((col) => (
              <div key={col.heading}>
                <p className="inline-flex items-center gap-1.5 text-[12px] font-medium uppercase tracking-wider !text-white">
                  {col.icon}
                  {col.heading}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      {link.external ? (
                        <ExternalLink label={link.label} href={link.href} />
                      ) : (
                        <Link
                          href={link.href}
                          className="text-[13px] !text-white transition-colors hover:!text-[#8ACDAE]"
                        >
                          {link.label}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Bottom bar */}
          <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/25 pt-8 text-[12px] !text-white sm:flex-row">
            <div className="flex items-center gap-4">
              <span className="inline-flex items-center gap-1.5 !text-white">
                <UserCheck className="h-3.5 w-3.5 !text-white" />
                AGPL-3.0 · Open source
              </span>
              <span className="!text-white">
                © {new Date().getFullYear()} Spool Studio
              </span>
            </div>
            <div className="flex items-center gap-5">
              <span className="inline-flex items-center gap-1.5 !text-white">
                <Sparkles className="h-3.5 w-3.5 !text-white" />
                v1.0
              </span>
              <a
                href="https://github.com/IntegerAlex/spool-studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 !text-white transition-colors hover:!text-[#8ACDAE]"
              >
                <Github className="h-3.5 w-3.5" />
                GitHub
              </a>
            </div>
          </div>
        </div>
      </footer>
      <BottomFooter />
    </div>
  )
}
