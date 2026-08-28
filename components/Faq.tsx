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
                    aria-expanded={open}
                    className="flex w-full cursor-pointer items-center justify-between py-4 text-left font-medium transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  >
                    {item.q}
                    <span
                      className="text-muted transition-transform duration-200 motion-reduce:transition-none"
                      style={{ transform: open ? 'rotate(45deg)' : 'none' }}
                    >
                      +
                    </span>
                  </button>
                </dt>
                <div
                  className="grid transition-all duration-300 ease-out motion-reduce:transition-none"
                  style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
                >
                  <div className="overflow-hidden">
                    <dd className="pb-4 text-sm text-muted">{item.a}</dd>
                  </div>
                </div>
              </div>
            )
          })}
        </dl>
      </div>
    </section>
  )
}
