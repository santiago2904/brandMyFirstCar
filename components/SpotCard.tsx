'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'
import { computeMinNextBid } from '@/lib/bidding'
import { placeBid } from '@/actions/bids'

export function SpotCard({ spot }: { spot: Spot }) {
  const t = useTranslations('spot')
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [brandName, setBrandName] = useState('')
  const minNextBid = computeMinNextBid(spot.current_bid, spot.starting_price)
  const [amount, setAmount] = useState(minNextBid)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const result = await placeBid({
      spotId: spot.id,
      sponsorEmail: email,
      brandName,
      amount,
    })
    if ('checkoutUrl' in result) {
      window.location.href = result.checkoutUrl
      return
    }
    setSubmitting(false)
    setError(result.error)
  }

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="py-4 pr-4">
          <div className="font-medium">{spot.zone_name}</div>
          <div className="text-sm text-muted">{spot.size}</div>
        </td>
        <td className="py-4 pr-4 tabular-nums">
          <span className="text-xs text-muted">
            {spot.current_bid ? t('currentBid') : t('startingAt')}
          </span>
          <div className="font-medium">${spot.current_bid ?? spot.starting_price}</div>
        </td>
        <td className="py-4 text-right">
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="cursor-pointer rounded-full border border-foreground px-4 py-2 text-sm font-medium hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {expanded ? t('cancel') : t('bidButton')}
          </button>
        </td>
      </tr>
      {expanded && (
        <tr className="border-b border-border last:border-0">
          <td colSpan={3} className="pb-4">
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 rounded-lg bg-background/50 p-4 sm:flex-row sm:items-center"
            >
              <input
                type="text"
                placeholder={t('brandNamePlaceholder')}
                aria-label={t('brandNamePlaceholder')}
                required
                autoComplete="organization"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                className="flex-1 rounded border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              />
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                aria-label={t('emailPlaceholder')}
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 rounded border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              />
              <input
                type="number"
                min={minNextBid}
                aria-label={t('currentBid')}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-28 rounded border border-border px-3 py-2 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
              />
              <button
                type="submit"
                disabled={submitting}
                className="cursor-pointer rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t('submitBid')}
              </button>
            </form>
            {error && (
              <p role="alert" className="mt-2 text-sm text-red-600">
                {error}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  )
}
