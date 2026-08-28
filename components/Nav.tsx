import { useTranslations } from 'next-intl'

export function Nav() {
  const t = useTranslations('nav')
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <span className="font-semibold">{t('brand')}</span>
        <nav className="hidden gap-6 text-sm text-muted sm:flex">
          <a href="#spots" className="hover:text-foreground">
            {t('spots')}
          </a>
          <a href="#how-it-works" className="hover:text-foreground">
            {t('howItWorks')}
          </a>
          <a href="#faq" className="hover:text-foreground">
            {t('faq')}
          </a>
        </nav>
        <a
          href="#spots"
          className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
        >
          {t('cta')}
        </a>
      </div>
    </header>
  )
}
