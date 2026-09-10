"use client"

import { ContactForm } from "@/components/landing/contact-form"

const STEPS = [
  {
    n: "01",
    title: "Self-host it",
    body: "Clone the repo, run the migrations, done. AGPL-3.0, your servers, your data.",
  },
  {
    n: "02",
    title: "Or have us host it",
    body: "We deploy on your cloud or ours — SSO, backups, and updates handled.",
  },
  {
    n: "03",
    title: "Bring the team",
    body: "Onboarding, workflow setup, and integrations with the tools you already use.",
  },
]

export function ContactLayout() {
  return (
    <section
      id="contact"
      className="w-full scroll-mt-24 border-t border-[rgba(255,255,255,0.08)] bg-black"
    >
      <div className="grid w-full gap-12 px-6 py-16 sm:px-10 sm:py-20 lg:grid-cols-2 lg:gap-20 lg:px-16 xl:px-24">
        <div>
          <p className="font-mono text-[12px] tracking-[0.14em] !text-[#35A774]">
            Contact
          </p>
          <h2 className="mt-3 font-mono text-[1.75rem] font-bold leading-tight !text-[#ededed] sm:text-[2.25rem]">
            Run Spool your way.
          </h2>
          <div className="mt-10 space-y-8">
            {STEPS.map((step) => (
              <div key={step.n} className="flex gap-4">
                <span className="font-mono text-[13px] !text-[#35A774]">
                  {step.n}
                </span>
                <div>
                  <p className="text-[15px] font-medium !text-[#ededed]">
                    {step.title}
                  </p>
                  <p className="mt-1 max-w-sm text-[14px] leading-relaxed !text-[#a1a1a1]">
                    {step.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-start">
          <ContactForm className="w-full" />
        </div>
      </div>
    </section>
  )
}
