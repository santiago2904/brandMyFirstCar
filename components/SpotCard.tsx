'use client'

import { useEffect, useRef, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Spot } from '@/lib/types'
import { computeDeposit, computeMinNextBid, computeRemainingBalance } from '@/lib/bidding'
import { placeBid } from '@/actions/bids'
import { uploadSponsorLogo } from '@/actions/uploadLogo'

const TRANSITION_MS = 200

export function SpotCard({ spot }: { spot: Spot }) {
  const t = useTranslations('spot')
  const [mounted, setMounted] = useState(false)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [brandName, setBrandName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const minNextBid = computeMinNextBid(spot.current_bid, spot.starting_price)
  const [amount, setAmount] = useState(minNextBid)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const firstFieldRef = useRef<HTMLInputElement>(null)

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setLogoFile(file)
    setLogoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return file ? URL.createObjectURL(file) : null
    })
  }

  const deposit = computeDeposit(amount)
  const remaining = computeRemainingBalance(amount, deposit)

  function openModal() {
    setAmount(minNextBid)
    setError(null)
    setMounted(true)
    // Mount first, then flip to open on the next frame so the transition runs.
    requestAnimationFrame(() => setOpen(true))
  }

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview)
    }
  }, [logoPreview])

  function closeModal() {
    setOpen(false)
    window.setTimeout(() => {
      setMounted(false)
      setLogoFile(null)
      setLogoPreview(null)
    }, TRANSITION_MS)
  }

  useEffect(() => {
    if (!mounted) return
    firstFieldRef.current?.focus()
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [mounted])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    let logoUrl: string | undefined
    if (logoFile) {
      setUploadingLogo(true)
      const formData = new FormData()
      formData.set('logo', logoFile)
      const uploadResult = await uploadSponsorLogo(formData)
      setUploadingLogo(false)
      if ('error' in uploadResult) {
        setSubmitting(false)
        setError(uploadResult.error)
        return
      }
      logoUrl = uploadResult.url
    }

    const result = await placeBid({
      spotId: spot.id,
      sponsorEmail: email,
      brandName,
      amount,
      logoUrl,
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
            ref={triggerRef}
            onClick={openModal}
            className="cursor-pointer rounded-full border border-foreground px-4 py-2 text-sm font-medium transition-colors duration-200 hover:bg-foreground hover:text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          >
            {t('bidButton')}
          </button>
        </td>
      </tr>

      {mounted && (
        <tr>
          <td colSpan={3} className="p-0">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={`bid-modal-title-${spot.id}`}
              className={`fixed inset-0 z-20 flex items-center justify-center p-4 transition-opacity duration-200 motion-reduce:transition-none ${
                open ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={closeModal}
              />
              <div
                className={`relative w-full max-w-sm rounded-2xl border border-border bg-background p-6 shadow-xl transition-all duration-200 motion-reduce:transition-none ${
                  open ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                }`}
              >
                <button
                  type="button"
                  onClick={closeModal}
                  aria-label={t('close')}
                  className="absolute right-4 top-4 cursor-pointer text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                >
                  ✕
                </button>

                <h3 id={`bid-modal-title-${spot.id}`} className="pr-6 font-semibold">
                  {spot.zone_name} · {spot.size}
                </h3>
                <p className="mt-1 text-sm text-muted">
                  {spot.current_bid ? t('currentBid') : t('startingAt')}: $
                  {spot.current_bid ?? spot.starting_price}
                </p>

                <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor={`amount-${spot.id}`}
                      className="text-xs font-medium text-muted"
                    >
                      {t('yourBid')}
                    </label>
                    <input
                      id={`amount-${spot.id}`}
                      type="number"
                      min={minNextBid}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="mt-1 w-full rounded border border-border px-3 py-2 text-sm tabular-nums focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                    />
                    <p className="mt-1 text-xs text-muted">
                      {t('minimum', { amount: `$${minNextBid}` })}
                    </p>
                  </div>

                  <div className="rounded-lg bg-gray-50 p-3 text-sm">
                    <div className="flex justify-between text-muted">
                      <span>{t('depositLabel')}</span>
                      <span className="tabular-nums">${deposit.toFixed(0)}</span>
                    </div>
                    <div className="mt-1 flex justify-between font-medium">
                      <span>{t('dueNow')}</span>
                      <span className="tabular-nums">${deposit.toFixed(0)}</span>
                    </div>
                    <p className="mt-2 text-xs text-muted">
                      {t('depositExplain', { remaining: `$${remaining.toFixed(0)}` })}
                    </p>
                  </div>

                  <input
                    ref={firstFieldRef}
                    type="text"
                    placeholder={t('brandNamePlaceholder')}
                    aria-label={t('brandNamePlaceholder')}
                    required
                    autoComplete="organization"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    className="w-full rounded border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  />
                  <input
                    type="email"
                    placeholder={t('emailPlaceholder')}
                    aria-label={t('emailPlaceholder')}
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded border border-border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
                  />

                  <div>
                    <label
                      htmlFor={`logo-${spot.id}`}
                      className="text-xs font-medium text-muted"
                    >
                      {t('logoLabel')}
                    </label>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-gray-50">
                        {logoPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={logoPreview}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <span className="text-lg text-muted">+</span>
                        )}
                      </div>
                      <input
                        id={`logo-${spot.id}`}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="flex-1 text-xs text-muted file:mr-2 file:rounded-full file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-xs file:font-medium file:transition-colors file:duration-200 file:cursor-pointer hover:file:bg-gray-50"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full cursor-pointer rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background transition-opacity duration-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploadingLogo
                      ? t('logoUploading')
                      : t('submitBid', { amount: `$${amount}` })}
                  </button>

                  {error && (
                    <p role="alert" className="text-sm text-red-600">
                      {error}
                    </p>
                  )}
                </form>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
