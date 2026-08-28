'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase/client'
import { SpotCard } from './SpotCard'

// The 3D scene touches WebGL/window on load — never render it on the server.
const CarScene = dynamic(() => import('./CarScene').then((m) => m.CarScene), {
  ssr: false,
  loading: () => <div className="h-64 w-full sm:h-80" />,
})

export function SpotSelector({ initialSpots }: { initialSpots: Spot[] }) {
  const t = useTranslations('spot')
  const [spots, setSpots] = useState(initialSpots)

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel('spots-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'spots' },
        async (payload) => {
          // The realtime payload only carries the changed columns, not the
          // joined sponsor — refetch the row so the leader's logo stays correct.
          const { data } = await supabase
            .from('spots')
            .select('*, current_leader:sponsors(logo_url, brand_name)')
            .eq('id', payload.new.id)
            .single()
          if (data) {
            setSpots((current) => current.map((s) => (s.id === data.id ? (data as Spot) : s)))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <section id="spots" className="mx-auto max-w-3xl px-6 py-16">
      <CarScene spots={spots} />
      <p className="mb-8 mt-2 text-center text-xs text-muted">{t('carHint')}</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-left">
          <thead>
            <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
              <th className="pb-3 font-medium">{t('zone')}</th>
              <th className="pb-3 font-medium">{t('currentBid')}</th>
              <th className="pb-3" />
            </tr>
          </thead>
          <tbody>
            {spots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
