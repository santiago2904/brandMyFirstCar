'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function Faq() {
  const t = useTranslations('faq')
  const items = [
    { q: t('paymentQ'), a: t('paymentA') },
    { q: t('outbidQ'), a: t('outbidA') },
    { q: t('approvalQ'), a: t('approvalA') },
  ]
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section id="faq" className="border-t border-border px-6 py-16">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-bold tracking-tight">{t('title')}</h2>
        <dl className="mt-6 divide-y divide-border border-t border-border">
          {items.map((item, i) => {
            const open = openIndex === i
            return (
              <div key={i}>
                <dt>
                  <button
                    onClick={() => setOpenIndex(open ? null : i)}
                    className="flex w-full items-center justify-between py-4 text-left font-medium"
                  >
                    {item.q}
                    <span className="text-muted">{open ? '−' : '+'}</span>
                  </button>
                </dt>
                {open && <dd className="pb-4 text-sm text-muted">{item.a}</dd>}
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
