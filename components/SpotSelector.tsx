'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase/client'
import { SpotCard } from './SpotCard'

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
        (payload) => {
          setSpots((current) =>
            current.map((s) => (s.id === payload.new.id ? { ...s, ...payload.new } : s))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <section id="spots" className="mx-auto max-w-3xl px-6 py-16">
      <table className="w-full text-left">
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
    </section>
  )
}
