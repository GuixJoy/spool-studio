"use client"

import { useState, type FormEvent } from "react"
import { cn } from "@/lib/utils"

const FIELD =
  "w-full rounded-lg border border-[#5FBD91]/40 bg-black/40 px-3.5 py-2.5 text-[14px] !text-[#ededed] outline-none transition-colors placeholder:!text-[#a1a1a1]/70 focus:border-[#35A774] focus:ring-2 focus:ring-[#35A774]/25"

const LABEL = "mb-1.5 block text-[12px] font-medium tracking-wide !text-[#a1a1a1]"

type ContactFormProps = {
  className?: string
}

export function ContactForm({ className }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-[#5FBD91]/50 bg-[#0a0a0a] p-5 sm:p-7 lg:p-8",
        className
      )}
    >
      <div className="mb-6">
        <h3 className="text-[1.25rem] font-semibold tracking-[-0.02em] !text-[#ededed]">
          Get in touch
        </h3>
        <p className="mt-1.5 text-[14px] leading-relaxed !text-[#a1a1a1]">
          Tell us about your team — we&apos;ll follow up shortly.
        </p>
      </div>

      {submitted ? (
        <p className="rounded-lg border border-[#35A774]/40 bg-[#35A774]/10 px-4 py-3 text-[14px] !text-[#5FBD91]">
          Thanks — your message is ready to send. We&apos;ll be in touch soon.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Line 1: Full Name + Email */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-full-name" className={LABEL}>
                Full Name
              </label>
              <input
                id="contact-full-name"
                name="fullName"
                type="text"
                required
                autoComplete="name"
                placeholder="Jane Doe"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="contact-email" className={LABEL}>
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jane@studio.com"
                className={FIELD}
              />
            </div>
          </div>

          {/* Line 2: Mobile + Subject */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="contact-mobile" className={LABEL}>
                Mobile
              </label>
              <input
                id="contact-mobile"
                name="mobile"
                type="tel"
                required
                autoComplete="tel"
                placeholder="+1 555 000 0000"
                className={FIELD}
              />
            </div>
            <div>
              <label htmlFor="contact-subject" className={LABEL}>
                Subject
              </label>
              <input
                id="contact-subject"
                name="subject"
                type="text"
                required
                placeholder="Partnership inquiry"
                className={FIELD}
              />
            </div>
          </div>

          {/* Line 3: Message */}
          <div>
            <label htmlFor="contact-message" className={LABEL}>
              Message
            </label>
            <textarea
              id="contact-message"
              name="message"
              required
              rows={5}
              placeholder="How can we help?"
              className={cn(FIELD, "min-h-[120px] resize-y")}
            />
          </div>

          <button
            type="submit"
            className="mt-1 inline-flex w-full items-center justify-center rounded-full bg-[#35A774] px-6 py-2.5 text-[14px] font-medium !text-black transition-colors hover:bg-[#5FBD91] sm:w-auto sm:self-end"
          >
            Submit
          </button>
        </form>
      )}
    </div>
  )
}
