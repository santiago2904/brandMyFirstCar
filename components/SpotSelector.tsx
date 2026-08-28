'use client'

import { useEffect, useState } from 'react'
import type { Spot } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase/client'
import { SpotCard } from './SpotCard'

export function SpotSelector({ initialSpots }: { initialSpots: Spot[] }) {
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
    <section className="grid grid-cols-1 gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot) => (
        <SpotCard key={spot.id} spot={spot} />
      ))}
    </section>
  )
}
