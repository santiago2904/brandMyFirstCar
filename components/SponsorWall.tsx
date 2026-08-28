import { useTranslations } from 'next-intl'
import type { Sponsor } from '@/lib/types'

export function SponsorWall({ sponsors }: { sponsors: Sponsor[] }) {
  const t = useTranslations('sponsorWall')
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sponsors.length === 0 && <p className="text-gray-500">{t('empty')}</p>}
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.id}
            href={sponsor.website ?? '#'}
            className="flex items-center justify-center rounded border p-4"
          >
            {sponsor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logo_url} alt={sponsor.brand_name} className="max-h-12" />
            ) : (
              sponsor.brand_name
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
