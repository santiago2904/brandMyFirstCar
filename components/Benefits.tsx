import { useTranslations } from 'next-intl'

export function Benefits() {
  const t = useTranslations('benefits')
  const items = [
    { title: t('devTitle'), body: t('devBody') },
    { title: t('contentTitle'), body: t('contentBody') },
    { title: t('callTitle'), body: t('callBody') },
  ]
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        {items.map((item, i) => (
          <div key={i} className="rounded-lg border p-4">
            <h3 className="font-semibold">{item.title}</h3>
            <p className="text-sm text-gray-600">{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
