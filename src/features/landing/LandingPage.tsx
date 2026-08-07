import { Closing } from '@/features/landing/sections/Closing'
import { Hero } from '@/features/landing/sections/Hero'
import { Platform } from '@/features/landing/sections/Platform'

/** The single JMAC landing page. It represents the platform, not HRMS or POS —
 *  neither product name appears on it. */
export function LandingPage() {
  return (
    <>
      <Hero />
      <Platform />
      <Closing />
    </>
  )
}
