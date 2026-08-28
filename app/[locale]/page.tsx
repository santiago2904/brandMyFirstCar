import { createServerClient } from '@/lib/supabase/server'
import { Hero } from '@/components/Hero'
import { Countdown } from '@/components/Countdown'
import { SpotSelector } from '@/components/SpotSelector'
import { HowItWorks } from '@/components/HowItWorks'
import { Benefits } from '@/components/Benefits'
import { Faq } from '@/components/Faq'
import { SponsorWall } from '@/components/SponsorWall'
import type { Spot, Sponsor, Campaign } from '@/lib/types'

export default async function Page() {
  const supabase = createServerClient()

  const [{ data: spots }, { data: sponsors }, { data: campaign }] = await Promise.all([
    supabase.from('spots').select('*').order('starting_price', { ascending: false }),
    supabase.from('sponsors').select('*').eq('approved', true),
    supabase.from('campaign').select('*').eq('id', 1).single(),
  ])

  return (
    <main>
      <Hero />
      {campaign && <Countdown endDate={(campaign as Campaign).end_date} />}
      <SpotSelector initialSpots={(spots as Spot[]) ?? []} />
      <HowItWorks />
      <Benefits />
      <Faq />
      <SponsorWall sponsors={(sponsors as Sponsor[]) ?? []} />
    </main>
  )
}
