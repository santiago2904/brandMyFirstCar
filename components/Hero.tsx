import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'
import { FUNDING_GOAL_USD } from '@/lib/constants'

export function Hero({ spots }: { spots: Spot[] }) {
  const t = useTranslations('hero')
  const raised = spots.reduce((sum, s) => sum + (s.current_bid ?? 0), 0)
  const pct = Math.min(100, Math.round((raised / FUNDING_GOAL_USD) * 100))

  return (
    <section className="px-6 py-20 text-center">
      <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
        {t('eyebrow')}
      </span>
      <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">{t('title')}</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t('subtitle')}</p>

      <div className="mx-auto mt-10 max-w-sm">
        <div className="flex items-baseline justify-center gap-2">
          <span className="text-2xl font-bold tabular-nums">${raised.toLocaleString()}</span>
          <span className="text-sm text-muted">
            {t('raisedOf', { goal: `$${FUNDING_GOAL_USD.toLocaleString()}` })}
          </span>
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">{t('funded', { pct })}</p>
      </div>
    </section>
  )
}
