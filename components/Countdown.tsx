'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

function remaining(endDate: string) {
  const diff = Math.max(0, new Date(endDate).getTime() - Date.now())
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds }
}

export function Countdown({ endDate }: { endDate: string }) {
  const t = useTranslations('countdown')
  const [time, setTime] = useState(() => remaining(endDate))

  useEffect(() => {
    const id = setInterval(() => setTime(remaining(endDate)), 1000)
    return () => clearInterval(id)
  }, [endDate])

  return (
    <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="text-muted">{t('endsIn')}</span>
      <span className="font-mono font-medium tabular-nums">
        {time.days}d {time.hours}h {time.minutes}m {time.seconds}s
      </span>
    </div>
  )
}
