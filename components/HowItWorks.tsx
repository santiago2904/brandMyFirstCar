import { useTranslations } from 'next-intl'

export function HowItWorks() {
  const t = useTranslations('howItWorks')
  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
  ]
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <ol className="mt-6 grid gap-6 sm:grid-cols-3">
        {steps.map((step, i) => (
          <li key={i}>
            <span className="text-3xl font-bold text-gray-300">{i + 1}</span>
            <h3 className="font-semibold">{step.title}</h3>
            <p className="text-sm text-gray-600">{step.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
