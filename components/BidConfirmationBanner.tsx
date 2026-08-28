'use client'

import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function BidConfirmationBanner() {
  const t = useTranslations('confirmation')
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // Derived directly from the URL — dismissing just strips the query param,
  // which naturally hides the banner on the next render. No local state needed.
  const visible = searchParams.get('bid') === 'confirmed'

  if (!visible) return null

  return (
    <div className="mx-auto max-w-3xl px-6 pt-4">
      <div className="flex items-start justify-between gap-4 rounded-lg border border-accent/30 bg-accent/10 p-4">
        <div>
          <p className="font-medium">{t('title')}</p>
          <p className="mt-1 text-sm text-muted">{t('body')}</p>
        </div>
        <button
          onClick={() => router.replace(pathname)}
          aria-label={t('dismiss')}
          className="cursor-pointer text-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          ✕
        </button>
      </div>
    </div>
  )
}
