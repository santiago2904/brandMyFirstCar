'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { createBrowserClient } from '@/lib/supabase/client'

export function StatsBar({ totalVisits }: { totalVisits: number }) {
  const t = useTranslations('stats')
  const [viewingNow, setViewingNow] = useState(1)

  useEffect(() => {
    const supabase = createBrowserClient()
    const key = crypto.randomUUID()
    const channel = supabase.channel('site-presence', {
      config: { presence: { key } },
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setViewingNow(Object.keys(state).length || 1)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() })
        }
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 py-2 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-accent" />
        {viewingNow.toLocaleString()} {t('viewingNow')}
      </span>
      <span aria-hidden="true">·</span>
      <span>
        {totalVisits.toLocaleString()} {t('totalVisits')}
      </span>
    </div>
  )
}
