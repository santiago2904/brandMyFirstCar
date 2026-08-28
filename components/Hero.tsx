import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'

export function Hero({ spots }: { spots: Spot[] }) {
  const t = useTranslations('hero')
  const claimed = spots.filter((s) => s.current_bid !== null).length
  const total = spots.length || 1
  const pct = Math.round((claimed / total) * 100)

  return (
    <section className="px-6 py-20 text-center">
      <span className="inline-block rounded-full border border-border px-3 py-1 text-xs font-medium text-muted">
        {t('eyebrow')}
      </span>
      <h1 className="mt-6 text-5xl font-bold tracking-tight sm:text-6xl">{t('title')}</h1>
      <p className="mx-auto mt-4 max-w-xl text-lg text-muted">{t('subtitle')}</p>

      <div className="mx-auto mt-10 max-w-sm">
        <div className="h-2 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-accent transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-muted">
          {claimed} / {total} {t('spotsClaimed')}
        </p>
      </div>
    </section>
  )
}
