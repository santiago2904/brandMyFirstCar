import { useTranslations } from 'next-intl'
import type { Sponsor } from '@/lib/types'

export function SponsorWall({ sponsors }: { sponsors: Sponsor[] }) {
  const t = useTranslations('sponsorWall')
  return (
    <section className="border-t border-border bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {sponsors.length === 0 && <p className="text-sm text-muted">{t('empty')}</p>}
          {sponsors.map((sponsor) => (
            <a
              key={sponsor.id}
              href={sponsor.website ?? '#'}
              className="flex items-center justify-center rounded-xl border border-border bg-background p-4 transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-sm motion-reduce:hover:translate-y-0"
            >
              {sponsor.logo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sponsor.logo_url} alt={sponsor.brand_name} className="max-h-12" />
              ) : (
                <span className="text-sm font-medium">{sponsor.brand_name}</span>
              )}
            </a>
          ))}
        </div>
      </div>
    </section>
  )
}
