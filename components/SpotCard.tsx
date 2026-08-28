'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'
import { computeMinNextBid } from '@/lib/bidding'
import { placeBid } from '@/actions/bids'

export function SpotCard({ spot }: { spot: Spot }) {
  const t = useTranslations('spot')
  const [submitting, setSubmitting] = useState(false)
  const [email, setEmail] = useState('')
  const [brandName, setBrandName] = useState('')
  const minNextBid = computeMinNextBid(spot.current_bid, spot.starting_price)
  const [amount, setAmount] = useState(minNextBid)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const result = await placeBid({
      spotId: spot.id,
      sponsorEmail: email,
      brandName,
      amount,
    })
    setSubmitting(false)
    if ('checkoutUrl' in result) {
      window.location.href = result.checkoutUrl
    } else {
      alert(result.error)
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <h3 className="font-semibold">{spot.zone_name}</h3>
      <p className="text-sm text-gray-500">{spot.size}</p>
      <p className="mt-2">
        {spot.current_bid ? t('currentBid') : t('startingAt')}:{' '}
        <strong>€{spot.current_bid ?? spot.starting_price}</strong>
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <input
          type="text"
          placeholder="Brand name"
          required
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          className="w-full rounded border px-2 py-1"
        />
        <input
          type="email"
          placeholder="Email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded border px-2 py-1"
        />
        <input
          type="number"
          min={minNextBid}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full rounded border px-2 py-1"
        />
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-black py-2 text-white disabled:opacity-50"
        >
          {t('bidButton')}
        </button>
      </form>
    </div>
  )
}
