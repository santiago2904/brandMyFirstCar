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
  // Start null so server and first client render match exactly; the real
  // value is computed client-side only, avoiding a Date.now() hydration
  // mismatch between server render time and client hydration time.
  const [time, setTime] = useState<ReturnType<typeof remaining> | null>(null)

  useEffect(() => {
    // Deferred via setTimeout(0) rather than called synchronously in the
    // effect body, per react-hooks/set-state-in-effect.
    const tick = () => setTime(remaining(endDate))
    const firstTick = window.setTimeout(tick, 0)
    const id = window.setInterval(tick, 1000)
    return () => {
      window.clearTimeout(firstTick)
      window.clearInterval(id)
    }
  }, [endDate])

  return (
    <div className="mx-auto mb-2 inline-flex items-center gap-2 rounded-full border border-border px-4 py-1.5 text-sm">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      <span className="text-muted">{t('endsIn')}</span>
      <span className="font-mono font-medium tabular-nums">
        {time ? `${time.days}d ${time.hours}h ${time.minutes}m ${time.seconds}s` : '—'}
      </span>
    </div>
  )
}
