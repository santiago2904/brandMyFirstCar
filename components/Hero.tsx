import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <section className="px-6 py-16 text-center">
      <h1 className="text-4xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
    </section>
  )
}
