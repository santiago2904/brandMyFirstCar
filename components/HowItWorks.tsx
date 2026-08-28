import { useTranslations } from 'next-intl'

export function HowItWorks() {
  const t = useTranslations('howItWorks')
  const steps = [
    { title: t('step1Title'), body: t('step1Body') },
    { title: t('step2Title'), body: t('step2Body') },
    { title: t('step3Title'), body: t('step3Body') },
  ]
  return (
    <section id="how-it-works" className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <ol className="mt-8 grid gap-8 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={i}>
              <span className="text-3xl font-bold text-border">{i + 1}</span>
              <h3 className="mt-2 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
