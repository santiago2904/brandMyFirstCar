import { useTranslations } from 'next-intl'

export function Faq() {
  const t = useTranslations('faq')
  const items = [
    { q: t('paymentQ'), a: t('paymentA') },
    { q: t('outbidQ'), a: t('outbidA') },
    { q: t('approvalQ'), a: t('approvalA') },
  ]
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <dl className="mt-6 space-y-4">
        {items.map((item, i) => (
          <div key={i}>
            <dt className="font-semibold">{item.q}</dt>
            <dd className="text-gray-600">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
