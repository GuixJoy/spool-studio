import { Github } from "lucide-react"
import Link from "next/link"

const NAV_LINKS = [
  { label: "Product", href: "/#product", external: false },
  {
    label: "Docs",
    href: "https://github.com/IntegerAlex/spool-studio#readme",
    external: true,
  },
  { label: "Contact", href: "/#contact", external: false },
] as const

export function Navbar() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-3 pt-4 sm:px-4 sm:pt-5">
      <nav
        className="
          pointer-events-auto
          flex w-full items-center justify-between gap-4
          rounded-full border border-white/30
          bg-[#111111]/90 px-4 py-2.5
          backdrop-blur-xl
          sm:px-6 sm:py-3
        "
        aria-label="Primary"
      >
        {/* Brand */}
        <Link
          href="/"
          className="shrink-0 font-sans text-[15px] font-bold uppercase tracking-wide !text-[#35A774] no-underline transition-opacity duration-200 hover:opacity-80 hover:no-underline"
        >
          SPOOL
        </Link>

        {/* Center links */}
        <ul className="flex items-center gap-4 sm:gap-5 md:gap-6">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              {link.external ? (
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block whitespace-nowrap text-[13px] font-medium !text-[#a1a1aa] no-underline transition-colors duration-200 hover:!text-white hover:no-underline"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  href={link.href}
                  className="inline-block whitespace-nowrap text-[13px] font-medium !text-[#a1a1aa] no-underline transition-colors duration-200 hover:!text-white hover:no-underline"
                >
                  {link.label}
                </Link>
              )}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <a
            href="https://github.com/IntegerAlex/spool-studio"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[#eeeeee] px-4 py-1.5 text-[13px] font-medium !text-black no-underline transition-colors duration-200 hover:bg-white hover:no-underline"
          >
            <Github className="h-3.5 w-3.5" />
            Star
          </a>
        </div>
      </nav>
    </header>
  )
}
