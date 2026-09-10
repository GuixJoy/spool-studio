import { redirect } from "next/navigation"
import { Plus_Jakarta_Sans } from "next/font/google"
import { getCurrentUser } from "@/lib/auth"
import { Hero } from "@/components/landing/hero"
import { Features } from "@/components/landing/features"
import { Navbar } from "@/components/landing/navbar"
import { ContactLayout } from "@/components/landing/contact-layout"
import { Footer } from "@/components/landing/footer"

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
})

export default async function LandingPage() {
  const user = await getCurrentUser()
  if (user) redirect("/dashboard")

  return (
    <main className={`relative min-h-screen bg-black ${jakarta.className}`}>
      <Navbar />
      <Hero />
      <Features />
      <ContactLayout />
      <Footer />
    </main>
  )
}
