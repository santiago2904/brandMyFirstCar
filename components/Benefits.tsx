import { useTranslations } from 'next-intl'

export function Benefits() {
  const t = useTranslations('benefits')
  const items = [
    { title: t('devTitle'), body: t('devBody') },
    { title: t('contentTitle'), body: t('contentBody') },
    { title: t('callTitle'), body: t('callBody') },
  ]
  return (
    <section className="border-t border-border bg-gray-50 px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {items.map((item, i) => (
            <div key={i} className="rounded-xl border border-border bg-background p-5">
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
