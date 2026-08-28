# brandMyFirstCar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a live-auction landing page where sponsors bid on sticker spots on the
user's first car, pay a deposit via Lemon Squeezy, get refunded automatically if
outbid, and pay the remaining balance if they win — in ES/EN.

**Architecture:** Next.js App Router on Vercel, Supabase Postgres for spots/bids/sponsors,
Lemon Squeezy as Merchant of Record for all payments (checkout + refunds via API,
confirmed via webhook), next-intl for ES/EN routing.

**Tech Stack:** Next.js 14 (App Router, TypeScript), Tailwind CSS, Supabase JS client,
next-intl, Lemon Squeezy REST API (fetch-based, no SDK needed), Vitest for unit tests.

**Spec:** `docs/superpowers/specs/2026-08-28-brandmyfirstcar-design.md`

## Global Constraints

- Testing is lightweight: only `lib/bidding.ts` (bid validation, min increment,
  remaining balance) and `lib/lemonsqueezy.ts` (request building) get unit tests.
  No test coverage required for pages/components.
- i18n: two locales, `es` (default) and `en`. All user-facing copy lives in
  `messages/es.json` / `messages/en.json` — no hardcoded strings in components.
- Minimum bid increment: +€10 over current bid (spec §5).
- Deposit: 20% of bid amount, minimum €10 (spec §3).
- Auction duration: 1 week. Sponsor exposure: 6 months (spec §5).
- Placeholder zone data (spec §5) ships as the seed — 6 zones, prices as listed there.
- Lemon Squeezy has no auth-hold; "refund on outbid" is a real refund via their
  Refunds API, not a hold release (spec §3, §8).

---

## File Structure

```
brandmyfirstcar/
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx              # next-intl provider, fonts, global CSS
│   │   └── page.tsx                # assembles Hero, SpotSelector, HowItWorks, Faq, SponsorWall, Countdown
│   └── api/
│       └── webhooks/
│           └── lemonsqueezy/
│               └── route.ts        # verifies signature, confirms deposit, updates bid status
├── actions/
│   └── bids.ts                     # server actions: placeBid, checkoutWinnerBalance
├── components/
│   ├── Hero.tsx
│   ├── Countdown.tsx
│   ├── SpotSelector.tsx            # grid of SpotCard, client component (live state)
│   ├── SpotCard.tsx
│   ├── HowItWorks.tsx
│   ├── Faq.tsx
│   └── SponsorWall.tsx
├── lib/
│   ├── bidding.ts                  # pure functions: computeDeposit, validateBid, computeMinNextBid, computeRemainingBalance
│   ├── bidding.test.ts
│   ├── lemonsqueezy.ts             # createCheckout, refundOrder, verifyWebhookSignature
│   ├── lemonsqueezy.test.ts
│   ├── supabase/
│   │   ├── client.ts                # browser client
│   │   └── server.ts                # server client (service role, for actions/webhooks)
│   └── types.ts                    # Spot, Bid, Sponsor, Campaign types
├── messages/
│   ├── es.json
│   └── en.json
├── i18n/
│   └── request.ts                  # next-intl config
├── middleware.ts                   # locale routing
├── supabase/
│   └── migrations/
│       └── 0001_init.sql           # spots, bids, sponsors, campaign tables + seed
├── .env.example
└── vitest.config.ts
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.mjs`, `tailwind.config.ts`,
  `postcss.config.js`, `app/globals.css`, `.gitignore`, `.env.example`,
  `vitest.config.ts`

**Interfaces:**
- Produces: a runnable `npm run dev` Next.js + TypeScript + Tailwind project with
  Vitest configured.

- [ ] **Step 1: Scaffold Next.js app**

Run:
```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*" --use-npm
```
Answer "No" to any prompt about overwriting existing files if it conflicts with the
`docs/` folder already present — keep `docs/`.

- [ ] **Step 2: Install runtime deps**

```bash
npm install @supabase/supabase-js next-intl
npm install -D vitest @vitejs/plugin-react
```

- [ ] **Step 3: Add Vitest config**

`vitest.config.ts`:
```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    globals: true,
  },
})
```

- [ ] **Step 4: Add `.env.example`**

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
```

- [ ] **Step 5: Add `test` script to package.json**

Edit `package.json` scripts block to add: `"test": "vitest run"`.

- [ ] **Step 6: Verify dev server boots**

Run: `npm run dev` then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200` (kill the dev server after, e.g. `pkill -f "next dev"`).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js + Tailwind + Vitest project"
```

---

## Task 2: i18n setup (next-intl, ES/EN)

**Files:**
- Create: `messages/es.json`, `messages/en.json`, `i18n/request.ts`, `middleware.ts`
- Modify: `next.config.mjs`, `app/[locale]/layout.tsx` (new location for the layout
  create-next-app generated at `app/layout.tsx` — move it)

**Interfaces:**
- Produces: `useTranslations()` available in any component under `app/[locale]/**`;
  routes `/es/...` and `/en/...`, default locale `es` at `/`.

- [ ] **Step 1: Create message dictionaries**

`messages/es.json`:
```json
{
  "hero": {
    "title": "Tu marca, en mi primer carro.",
    "subtitle": "Tu logo viaja conmigo durante 6 meses. Elegí tu espacio, hacé tu oferta."
  },
  "howItWorks": {
    "title": "Cómo funciona",
    "step1Title": "Elegí tu zona y tamaño",
    "step1Body": "Seis zonas del carro, precios según visibilidad.",
    "step2Title": "Ganá la puja",
    "step2Body": "La oferta más alta al cierre de la semana gana. Te contacto para el saldo.",
    "step3Title": "Tu logo viaja",
    "step3Body": "Imprimo tu logo como sticker de vinilo y tu marca viaja conmigo 6 meses."
  },
  "faq": {
    "title": "Preguntas frecuentes",
    "paymentQ": "¿Cómo funciona el pago?",
    "paymentA": "Al pujar se cobra un depósito del 20% (mínimo el equivalente a €10). Si te superan, se reembolsa automático. Si ganás, cuenta para el total y te mando el link del saldo.",
    "outbidQ": "¿Qué pasa si me superan?",
    "outbidA": "Recibís el reembolso completo y podés volver a pujar. La nueva oferta debe superar la actual por al menos €10.",
    "approvalQ": "¿Cualquier marca puede participar?",
    "approvalA": "Reviso cada sponsor a mano antes de que aparezca. Si tu oferta no se aprueba, el depósito se devuelve completo."
  },
  "sponsorWall": {
    "title": "Las marcas que vienen conmigo",
    "empty": "Tu marca podría estar acá"
  },
  "countdown": {
    "endsIn": "La subasta termina en"
  },
  "spot": {
    "currentBid": "Oferta actual",
    "startingAt": "Desde",
    "bidButton": "Ofertar",
    "leading": "Liderando",
    "outbid": "Superado"
  }
}
```

`messages/en.json`:
```json
{
  "hero": {
    "title": "Your brand, on my first car.",
    "subtitle": "Your logo rides with me for 6 months. Pick your spot, place your bid."
  },
  "howItWorks": {
    "title": "How it works",
    "step1Title": "Pick your spot and size",
    "step1Body": "Six zones on the car, priced by visibility.",
    "step2Title": "Win the bid",
    "step2Body": "The top bid at week's end wins. I'll reach out to arrange the balance.",
    "step3Title": "Your logo rides along",
    "step3Body": "I print your logo as a vinyl sticker and your brand travels with me for 6 months."
  },
  "faq": {
    "title": "Questions & Answers",
    "paymentQ": "How does payment work?",
    "paymentA": "Bidding takes a 20% deposit (minimum equivalent to €10). If you're outbid, it's refunded automatically. If you win, it counts toward the total and I send a payment link for the remainder.",
    "outbidQ": "What if someone outbids me?",
    "outbidA": "You get a full refund and the chance to swing back. A new bid must beat the current one by at least €10.",
    "approvalQ": "Can any brand join?",
    "approvalA": "I approve every sponsor by hand before it appears. If your bid is refused, your deposit comes back in full."
  },
  "sponsorWall": {
    "title": "The brands coming along",
    "empty": "Your brand could be here"
  },
  "countdown": {
    "endsIn": "Auction ends in"
  },
  "spot": {
    "currentBid": "Current bid",
    "startingAt": "Starting at",
    "bidButton": "Place bid",
    "leading": "Leading",
    "outbid": "Outbid"
  }
}
```

- [ ] **Step 2: Add next-intl request config**

`i18n/request.ts`:
```ts
import { getRequestConfig } from 'next-intl/server'

export const locales = ['es', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'es'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !locales.includes(locale as Locale)) {
    locale = defaultLocale
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 3: Add middleware for locale routing**

`middleware.ts`:
```ts
import createMiddleware from 'next-intl/middleware'
import { locales, defaultLocale } from './i18n/request'

export default createMiddleware({
  locales,
  defaultLocale,
})

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
}
```

- [ ] **Step 4: Wire next-intl plugin into next.config.mjs**

`next.config.mjs`:
```js
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

/** @type {import('next').NextConfig} */
const nextConfig = {}

export default withNextIntl(nextConfig)
```

- [ ] **Step 5: Move layout under `[locale]` and wrap with NextIntlClientProvider**

```bash
mkdir -p app/\[locale\]
git mv app/page.tsx app/\[locale\]/page.tsx
git mv app/layout.tsx app/\[locale\]/layout.tsx
```

`app/[locale]/layout.tsx`:
```tsx
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { locales } from '@/i18n/request'
import '../globals.css'

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }))
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Verify locale routing works**

Run: `npm run dev`, then:
```bash
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/es
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/en
```
Expected: both `200`. Kill dev server after.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add ES/EN i18n routing with next-intl"
```

---

## Task 3: Supabase schema + client wrappers

**Files:**
- Create: `supabase/migrations/0001_init.sql`, `lib/supabase/client.ts`,
  `lib/supabase/server.ts`, `lib/types.ts`

**Interfaces:**
- Produces: `createBrowserClient()` (anon key, for client components),
  `createServerClient()` (service role key, for server actions/webhooks), and
  TypeScript types `Spot`, `Bid`, `Sponsor`, `Campaign`.

- [ ] **Step 1: Write the migration + seed**

`supabase/migrations/0001_init.sql`:
```sql
create table sponsors (
  id uuid primary key default gen_random_uuid(),
  brand_name text not null,
  email text not null,
  logo_url text,
  website text,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table spots (
  id uuid primary key default gen_random_uuid(),
  zone_name text not null,
  size text not null check (size in ('S', 'M', 'L')),
  starting_price numeric not null,
  current_bid numeric,
  current_leader_sponsor_id uuid references sponsors(id)
);

create table bids (
  id uuid primary key default gen_random_uuid(),
  spot_id uuid not null references spots(id),
  sponsor_id uuid not null references sponsors(id),
  amount numeric not null,
  deposit_paid boolean not null default false,
  lemon_squeezy_order_id text,
  status text not null default 'active'
    check (status in ('active', 'outbid', 'refunded', 'won')),
  created_at timestamptz not null default now()
);

create table campaign (
  id int primary key default 1,
  start_date timestamptz not null,
  end_date timestamptz not null,
  sponsor_exposure_months int not null default 6,
  constraint single_row check (id = 1)
);

insert into spots (zone_name, size, starting_price) values
  ('Capó', 'L', 300),
  ('Puerta izquierda', 'L', 300),
  ('Puerta derecha', 'L', 300),
  ('Baúl', 'M', 180),
  ('Parachoques trasero', 'M', 180),
  ('Espejos', 'S', 90);
```

- [ ] **Step 2: Write shared types**

`lib/types.ts`:
```ts
export type SpotSize = 'S' | 'M' | 'L'
export type BidStatus = 'active' | 'outbid' | 'refunded' | 'won'

export interface Spot {
  id: string
  zone_name: string
  size: SpotSize
  starting_price: number
  current_bid: number | null
  current_leader_sponsor_id: string | null
}

export interface Bid {
  id: string
  spot_id: string
  sponsor_id: string
  amount: number
  deposit_paid: boolean
  lemon_squeezy_order_id: string | null
  status: BidStatus
  created_at: string
}

export interface Sponsor {
  id: string
  brand_name: string
  email: string
  logo_url: string | null
  website: string | null
  approved: boolean
}

export interface Campaign {
  start_date: string
  end_date: string
  sponsor_exposure_months: number
}
```

- [ ] **Step 3: Browser client**

`lib/supabase/client.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export function createBrowserClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

- [ ] **Step 4: Server client (service role — server actions and webhooks only)**

`lib/supabase/server.ts`:
```ts
import { createClient } from '@supabase/supabase-js'

export function createServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

- [ ] **Step 5: Apply migration to the Supabase project**

Run (requires `supabase` CLI logged in and linked, or paste the SQL into the
Supabase SQL editor manually):
```bash
supabase db push
```
Expected: `spots`, `bids`, `sponsors`, `campaign` tables exist with 6 seeded rows in
`spots`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Supabase schema, seed data, and client wrappers"
```

---

## Task 4: Core bidding logic (tested)

**Files:**
- Create: `lib/bidding.ts`, `lib/bidding.test.ts`

**Interfaces:**
- Consumes: nothing (pure functions, no I/O).
- Produces: `computeDeposit(bidAmount: number): number`,
  `computeMinNextBid(currentBid: number | null, startingPrice: number): number`,
  `validateBid(amount: number, currentBid: number | null, startingPrice: number): { valid: boolean; reason?: string }`,
  `computeRemainingBalance(winningBid: number, depositPaid: number): number`.
  These are the functions `actions/bids.ts` (Task 6) calls.

- [ ] **Step 1: Write the failing tests**

`lib/bidding.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import {
  computeDeposit,
  computeMinNextBid,
  validateBid,
  computeRemainingBalance,
} from './bidding'

describe('computeDeposit', () => {
  it('is 20% of the bid amount', () => {
    expect(computeDeposit(1000)) .toBe(200)
  })

  it('floors at the €10 minimum', () => {
    expect(computeDeposit(30)).toBe(10)
  })
})

describe('computeMinNextBid', () => {
  it('is the starting price when there is no current bid', () => {
    expect(computeMinNextBid(null, 300)).toBe(300)
  })

  it('is current bid + €10 when there is a current bid', () => {
    expect(computeMinNextBid(450, 300)).toBe(460)
  })
})

describe('validateBid', () => {
  it('rejects a bid below the starting price when there is no current bid', () => {
    expect(validateBid(250, null, 300)).toEqual({
      valid: false,
      reason: 'below_minimum',
    })
  })

  it('rejects a bid that does not beat the current bid by at least €10', () => {
    expect(validateBid(455, 450, 300)).toEqual({
      valid: false,
      reason: 'below_minimum',
    })
  })

  it('accepts a bid that meets the minimum', () => {
    expect(validateBid(460, 450, 300)).toEqual({ valid: true })
  })

  it('accepts the starting price as the first bid', () => {
    expect(validateBid(300, null, 300)).toEqual({ valid: true })
  })
})

describe('computeRemainingBalance', () => {
  it('is the winning bid minus the deposit already paid', () => {
    expect(computeRemainingBalance(1000, 200)).toBe(800)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/bidding.test.ts`
Expected: FAIL — `lib/bidding.ts` does not exist / exports undefined.

- [ ] **Step 3: Implement**

`lib/bidding.ts`:
```ts
const MIN_INCREMENT = 10
const MIN_DEPOSIT = 10
const DEPOSIT_RATE = 0.2

export function computeDeposit(bidAmount: number): number {
  return Math.max(bidAmount * DEPOSIT_RATE, MIN_DEPOSIT)
}

export function computeMinNextBid(
  currentBid: number | null,
  startingPrice: number
): number {
  if (currentBid === null) return startingPrice
  return currentBid + MIN_INCREMENT
}

export function validateBid(
  amount: number,
  currentBid: number | null,
  startingPrice: number
): { valid: boolean; reason?: string } {
  const minNextBid = computeMinNextBid(currentBid, startingPrice)
  if (amount < minNextBid) {
    return { valid: false, reason: 'below_minimum' }
  }
  return { valid: true }
}

export function computeRemainingBalance(
  winningBid: number,
  depositPaid: number
): number {
  return winningBid - depositPaid
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/bidding.test.ts`
Expected: PASS, 7 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/bidding.ts lib/bidding.test.ts
git commit -m "feat: add bidding logic (deposit, min increment, validation, balance)"
```

---

## Task 5: Lemon Squeezy API wrapper (tested)

**Files:**
- Create: `lib/lemonsqueezy.ts`, `lib/lemonsqueezy.test.ts`

**Interfaces:**
- Consumes: `process.env.LEMONSQUEEZY_API_KEY`, `process.env.LEMONSQUEEZY_STORE_ID`,
  `process.env.LEMONSQUEEZY_WEBHOOK_SECRET`.
- Produces: `createCheckoutUrl(params: { variantId: string; amountCents: number; email: string; custom: Record<string,string> }): Promise<string>`,
  `refundOrder(orderId: string): Promise<void>`,
  `verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean`.
  These are called from `actions/bids.ts` (Task 6) and the webhook route (Task 7).

- [ ] **Step 1: Write the failing tests**

`lib/lemonsqueezy.test.ts`:
```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCheckoutUrl, refundOrder, verifyWebhookSignature } from './lemonsqueezy'
import crypto from 'node:crypto'

const originalFetch = global.fetch

beforeEach(() => {
  process.env.LEMONSQUEEZY_API_KEY = 'test-key'
  process.env.LEMONSQUEEZY_STORE_ID = 'store-1'
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'shhh'
})

describe('createCheckoutUrl', () => {
  it('posts to the checkouts endpoint and returns the hosted URL', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: { attributes: { url: 'https://brandmyfirstcar.lemonsqueezy.com/checkout/abc' } },
      }),
    }) as unknown as typeof fetch

    const url = await createCheckoutUrl({
      variantId: 'v1',
      amountCents: 20000,
      email: 'sponsor@brand.com',
      custom: { bidId: 'bid-1' },
    })

    expect(url).toBe('https://brandmyfirstcar.lemonsqueezy.com/checkout/abc')
    expect(fetch).toHaveBeenCalledWith(
      'https://api.lemonsqueezy.com/v1/checkouts',
      expect.objectContaining({ method: 'POST' })
    )
  })

  global.fetch = originalFetch
})

describe('refundOrder', () => {
  it('posts a refund request for the given order id', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch

    await refundOrder('order-42')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.lemonsqueezy.com/v1/orders/order-42/refund',
      expect.objectContaining({ method: 'POST' })
    )
    global.fetch = originalFetch
  })
})

describe('verifyWebhookSignature', () => {
  it('accepts a signature that matches the HMAC of the body', () => {
    const body = '{"test":true}'
    const signature = crypto
      .createHmac('sha256', 'shhh')
      .update(body)
      .digest('hex')

    expect(verifyWebhookSignature(body, signature)).toBe(true)
  })

  it('rejects a signature that does not match', () => {
    expect(verifyWebhookSignature('{"test":true}', 'deadbeef')).toBe(false)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/lemonsqueezy.test.ts`
Expected: FAIL — module does not exist.

- [ ] **Step 3: Implement**

`lib/lemonsqueezy.ts`:
```ts
import crypto from 'node:crypto'

const API_BASE = 'https://api.lemonsqueezy.com/v1'

function authHeaders() {
  return {
    Accept: 'application/vnd.api+json',
    'Content-Type': 'application/vnd.api+json',
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  }
}

export async function createCheckoutUrl(params: {
  variantId: string
  amountCents: number
  email: string
  custom: Record<string, string>
}): Promise<string> {
  const res = await fetch(`${API_BASE}/checkouts`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: params.email,
            custom: params.custom,
          },
          checkout_options: { embed: false },
          product_options: {},
          preview: false,
          custom_price: params.amountCents,
        },
        relationships: {
          store: {
            data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID },
          },
          variant: {
            data: { type: 'variants', id: params.variantId },
          },
        },
      },
    }),
  })
  if (!res.ok) {
    throw new Error(`Lemon Squeezy checkout creation failed: ${res.status}`)
  }
  const json = await res.json()
  return json.data.attributes.url as string
}

export async function refundOrder(orderId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/orders/${orderId}/refund`, {
    method: 'POST',
    headers: authHeaders(),
  })
  if (!res.ok) {
    throw new Error(`Lemon Squeezy refund failed for order ${orderId}: ${res.status}`)
  }
}

export function verifyWebhookSignature(rawBody: string, signatureHeader: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET!)
    .update(rawBody)
    .digest('hex')
  const expectedBuf = Buffer.from(expected, 'utf8')
  const actualBuf = Buffer.from(signatureHeader, 'utf8')
  if (expectedBuf.length !== actualBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, actualBuf)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/lemonsqueezy.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/lemonsqueezy.ts lib/lemonsqueezy.test.ts
git commit -m "feat: add Lemon Squeezy checkout, refund, and webhook verification"
```

---

## Task 6: Server action — place a bid

**Files:**
- Create: `actions/bids.ts`

**Interfaces:**
- Consumes: `validateBid`, `computeDeposit` from `lib/bidding.ts`;
  `createCheckoutUrl`, `refundOrder` from `lib/lemonsqueezy.ts`;
  `createServerClient` from `lib/supabase/server.ts`; `Spot`, `Bid` from `lib/types.ts`.
- Produces: `placeBid(input: { spotId: string; sponsorEmail: string; brandName: string; amount: number }): Promise<{ checkoutUrl: string } | { error: string }>`
  — this is what `SpotSelector.tsx` (Task 9) calls on bid submit.

- [ ] **Step 1: Implement `placeBid`**

`actions/bids.ts`:
```ts
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { validateBid, computeDeposit } from '@/lib/bidding'
import { createCheckoutUrl, refundOrder } from '@/lib/lemonsqueezy'

const CHECKOUT_VARIANT_ID = process.env.LEMONSQUEEZY_DEPOSIT_VARIANT_ID!

export async function placeBid(input: {
  spotId: string
  sponsorEmail: string
  brandName: string
  amount: number
}): Promise<{ checkoutUrl: string } | { error: string }> {
  const supabase = createServerClient()

  const { data: spot, error: spotError } = await supabase
    .from('spots')
    .select('*')
    .eq('id', input.spotId)
    .single()

  if (spotError || !spot) {
    return { error: 'spot_not_found' }
  }

  const validation = validateBid(input.amount, spot.current_bid, spot.starting_price)
  if (!validation.valid) {
    return { error: validation.reason! }
  }

  // Refund the previous leader, if any.
  if (spot.current_leader_sponsor_id) {
    const { data: previousBid } = await supabase
      .from('bids')
      .select('*')
      .eq('spot_id', spot.id)
      .eq('status', 'active')
      .single()

    if (previousBid?.lemon_squeezy_order_id) {
      await refundOrder(previousBid.lemon_squeezy_order_id)
      await supabase
        .from('bids')
        .update({ status: 'refunded' })
        .eq('id', previousBid.id)
    }
  }

  // Upsert the sponsor.
  const { data: sponsor, error: sponsorError } = await supabase
    .from('sponsors')
    .upsert(
      { email: input.sponsorEmail, brand_name: input.brandName },
      { onConflict: 'email' }
    )
    .select()
    .single()

  if (sponsorError || !sponsor) {
    return { error: 'sponsor_upsert_failed' }
  }

  const { data: bid, error: bidError } = await supabase
    .from('bids')
    .insert({
      spot_id: spot.id,
      sponsor_id: sponsor.id,
      amount: input.amount,
      status: 'active',
      deposit_paid: false,
    })
    .select()
    .single()

  if (bidError || !bid) {
    return { error: 'bid_creation_failed' }
  }

  const deposit = computeDeposit(input.amount)

  const checkoutUrl = await createCheckoutUrl({
    variantId: CHECKOUT_VARIANT_ID,
    amountCents: Math.round(deposit * 100),
    email: input.sponsorEmail,
    custom: { bidId: bid.id, spotId: spot.id },
  })

  await supabase
    .from('spots')
    .update({ current_bid: input.amount, current_leader_sponsor_id: sponsor.id })
    .eq('id', spot.id)

  return { checkoutUrl }
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, then in a Node REPL or a temporary script, call `placeBid` with a
seeded spot id and confirm it returns a `checkoutUrl` string (Lemon Squeezy sandbox
credentials must be in `.env.local` for this to succeed end to end; if not yet
available, confirm it returns `{ error: 'spot_not_found' }` for an invalid id, which
proves the Supabase read path works).

- [ ] **Step 3: Commit**

```bash
git add actions/bids.ts
git commit -m "feat: add placeBid server action (validate, refund leader, checkout)"
```

---

## Task 7: Lemon Squeezy webhook handler

**Files:**
- Create: `app/api/webhooks/lemonsqueezy/route.ts`

**Interfaces:**
- Consumes: `verifyWebhookSignature` from `lib/lemonsqueezy.ts`,
  `createServerClient` from `lib/supabase/server.ts`.
- Produces: `POST /api/webhooks/lemonsqueezy` — marks a bid's `deposit_paid = true` and
  `lemon_squeezy_order_id` on the `order_created` event, matched via the `bidId`
  custom field set in Task 6's `createCheckoutUrl` call.

- [ ] **Step 1: Implement the route handler**

`app/api/webhooks/lemonsqueezy/route.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/lemonsqueezy'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('x-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  const eventName = payload.meta?.event_name

  if (eventName === 'order_created') {
    const bidId = payload.meta?.custom_data?.bidId
    const orderId = payload.data?.id

    if (bidId && orderId) {
      const supabase = createServerClient()
      await supabase
        .from('bids')
        .update({ deposit_paid: true, lemon_squeezy_order_id: orderId })
        .eq('id', bidId)
    }
  }

  return NextResponse.json({ received: true })
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`, then simulate a webhook call:
```bash
BODY='{"meta":{"event_name":"order_created","custom_data":{"bidId":"<seed a real bid id>"}},"data":{"id":"order-test-1"}}'
SIG=$(node -e "console.log(require('crypto').createHmac('sha256', process.env.LEMONSQUEEZY_WEBHOOK_SECRET).update(process.argv[1]).digest('hex'))" "$BODY")
curl -s -X POST http://localhost:3000/api/webhooks/lemonsqueezy \
  -H "x-signature: $SIG" -H "Content-Type: application/json" -d "$BODY"
```
Expected: `{"received":true}` and the corresponding `bids` row now has
`deposit_paid = true` and `lemon_squeezy_order_id = 'order-test-1'`.

- [ ] **Step 3: Commit**

```bash
git add app/api/webhooks/lemonsqueezy/route.ts
git commit -m "feat: add Lemon Squeezy webhook handler for deposit confirmation"
```

---

## Task 8: Hero + Countdown components

**Files:**
- Create: `components/Hero.tsx`, `components/Countdown.tsx`

**Interfaces:**
- Consumes: `useTranslations` from `next-intl`, `Campaign` type from `lib/types.ts`.
- Produces: `<Hero />`, `<Countdown endDate={string} />` — used by
  `app/[locale]/page.tsx` (Task 11).

- [ ] **Step 1: Implement Hero**

`components/Hero.tsx`:
```tsx
import { useTranslations } from 'next-intl'

export function Hero() {
  const t = useTranslations('hero')
  return (
    <section className="px-6 py-16 text-center">
      <h1 className="text-4xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-lg text-gray-600">{t('subtitle')}</p>
    </section>
  )
}
```

- [ ] **Step 2: Implement Countdown (client component, ticks every second)**

`components/Countdown.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'

function remaining(endDate: string) {
  const diff = Math.max(0, new Date(endDate).getTime() - Date.now())
  const days = Math.floor(diff / 86_400_000)
  const hours = Math.floor((diff % 86_400_000) / 3_600_000)
  const minutes = Math.floor((diff % 3_600_000) / 60_000)
  const seconds = Math.floor((diff % 60_000) / 1000)
  return { days, hours, minutes, seconds }
}

export function Countdown({ endDate }: { endDate: string }) {
  const t = useTranslations('countdown')
  const [time, setTime] = useState(() => remaining(endDate))

  useEffect(() => {
    const id = setInterval(() => setTime(remaining(endDate)), 1000)
    return () => clearInterval(id)
  }, [endDate])

  return (
    <div className="text-center">
      <p className="text-sm uppercase text-gray-500">{t('endsIn')}</p>
      <p className="text-2xl font-mono">
        {time.days}d {time.hours}h {time.minutes}m {time.seconds}s
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/Hero.tsx components/Countdown.tsx
git commit -m "feat: add Hero and Countdown components"
```

---

## Task 9: Spot selector (bidding UI)

**Files:**
- Create: `components/SpotCard.tsx`, `components/SpotSelector.tsx`

**Interfaces:**
- Consumes: `Spot` type from `lib/types.ts`, `placeBid` from `actions/bids.ts`,
  `computeMinNextBid` from `lib/bidding.ts`, `createBrowserClient` from
  `lib/supabase/client.ts`, `useTranslations` from `next-intl`.
- Produces: `<SpotSelector initialSpots={Spot[]} />` — used by `app/[locale]/page.tsx`
  (Task 11). Subscribes to Supabase realtime changes on the `spots` table so bids
  update live across viewers.

- [ ] **Step 1: Implement SpotCard**

`components/SpotCard.tsx`:
```tsx
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
```

- [ ] **Step 2: Implement SpotSelector with realtime subscription**

`components/SpotSelector.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'
import type { Spot } from '@/lib/types'
import { createBrowserClient } from '@/lib/supabase/client'
import { SpotCard } from './SpotCard'

export function SpotSelector({ initialSpots }: { initialSpots: Spot[] }) {
  const [spots, setSpots] = useState(initialSpots)

  useEffect(() => {
    const supabase = createBrowserClient()
    const channel = supabase
      .channel('spots-changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'spots' },
        (payload) => {
          setSpots((current) =>
            current.map((s) => (s.id === payload.new.id ? { ...s, ...payload.new } : s))
          )
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <section className="grid grid-cols-1 gap-4 px-6 py-8 sm:grid-cols-2 lg:grid-cols-3">
      {spots.map((spot) => (
        <SpotCard key={spot.id} spot={spot} />
      ))}
    </section>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add components/SpotCard.tsx components/SpotSelector.tsx
git commit -m "feat: add SpotSelector with live bidding and realtime updates"
```

---

## Task 10: How It Works, FAQ, Sponsor Wall

**Files:**
- Create: `components/HowItWorks.tsx`, `components/Faq.tsx`, `components/SponsorWall.tsx`

**Interfaces:**
- Consumes: `useTranslations` from `next-intl`, `Sponsor` type from `lib/types.ts`.
- Produces: `<HowItWorks />`, `<Faq />`, `<SponsorWall sponsors={Sponsor[]} />` — used
  by `app/[locale]/page.tsx` (Task 11).

- [ ] **Step 1: Implement HowItWorks**

`components/HowItWorks.tsx`:
```tsx
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
```

- [ ] **Step 2: Implement Faq**

`components/Faq.tsx`:
```tsx
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
```

- [ ] **Step 3: Implement SponsorWall**

`components/SponsorWall.tsx`:
```tsx
import { useTranslations } from 'next-intl'
import type { Sponsor } from '@/lib/types'

export function SponsorWall({ sponsors }: { sponsors: Sponsor[] }) {
  const t = useTranslations('sponsorWall')
  return (
    <section className="px-6 py-12">
      <h2 className="text-2xl font-bold">{t('title')}</h2>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {sponsors.length === 0 && <p className="text-gray-500">{t('empty')}</p>}
        {sponsors.map((sponsor) => (
          <a
            key={sponsor.id}
            href={sponsor.website ?? '#'}
            className="flex items-center justify-center rounded border p-4"
          >
            {sponsor.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsor.logo_url} alt={sponsor.brand_name} className="max-h-12" />
            ) : (
              sponsor.brand_name
            )}
          </a>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add components/HowItWorks.tsx components/Faq.tsx components/SponsorWall.tsx
git commit -m "feat: add HowItWorks, Faq, and SponsorWall components"
```

---

## Task 11: Assemble the landing page

**Files:**
- Modify: `app/[locale]/page.tsx`

**Interfaces:**
- Consumes: `Hero`, `Countdown` (Task 8); `SpotSelector` (Task 9); `HowItWorks`,
  `Faq`, `SponsorWall` (Task 10); `createServerClient` from `lib/supabase/server.ts`;
  `Spot`, `Sponsor`, `Campaign` types from `lib/types.ts`.

- [ ] **Step 1: Fetch data and assemble sections**

`app/[locale]/page.tsx`:
```tsx
import { createServerClient } from '@/lib/supabase/server'
import { Hero } from '@/components/Hero'
import { Countdown } from '@/components/Countdown'
import { SpotSelector } from '@/components/SpotSelector'
import { HowItWorks } from '@/components/HowItWorks'
import { Faq } from '@/components/Faq'
import { SponsorWall } from '@/components/SponsorWall'
import type { Spot, Sponsor, Campaign } from '@/lib/types'

export default async function Page() {
  const supabase = createServerClient()

  const [{ data: spots }, { data: sponsors }, { data: campaign }] = await Promise.all([
    supabase.from('spots').select('*').order('starting_price', { ascending: false }),
    supabase.from('sponsors').select('*').eq('approved', true),
    supabase.from('campaign').select('*').eq('id', 1).single(),
  ])

  return (
    <main>
      <Hero />
      {campaign && <Countdown endDate={(campaign as Campaign).end_date} />}
      <SpotSelector initialSpots={(spots as Spot[]) ?? []} />
      <HowItWorks />
      <Faq />
      <SponsorWall sponsors={(sponsors as Sponsor[]) ?? []} />
    </main>
  )
}
```

- [ ] **Step 2: Set the campaign end date**

Run against Supabase (SQL editor or `psql`), setting `end_date` to one week from
launch:
```sql
insert into campaign (id, start_date, end_date, sponsor_exposure_months)
values (1, now(), now() + interval '7 days', 6)
on conflict (id) do update set start_date = excluded.start_date, end_date = excluded.end_date;
```

- [ ] **Step 3: Verify the full page renders**

Run: `npm run dev`, visit `http://localhost:3000/es` and `http://localhost:3000/en`
in a browser. Expected: Hero, countdown ticking, 6 spot cards with placeholder
prices, How It Works, FAQ, and Sponsor Wall (showing the "empty" message since no
sponsors are approved yet) all render without console errors.

- [ ] **Step 4: Commit**

```bash
git add app/\[locale\]/page.tsx
git commit -m "feat: assemble landing page from Hero through SponsorWall"
```

---

## Task 12: Deploy configuration

**Files:**
- Create: `README.md`
- Modify: none (env vars are set in the Vercel dashboard, not committed)

**Interfaces:**
- Produces: a deployed Vercel URL serving the site.

- [ ] **Step 1: Write README with setup + deploy steps**

`README.md`:
```markdown
# brandMyFirstCar

Live-auction landing page for sponsoring sticker spots on the author's first car.

## Local setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in Supabase + Lemon Squeezy keys.
3. `supabase db push` to apply migrations (or paste `supabase/migrations/0001_init.sql`
   into the Supabase SQL editor).
4. `npm run dev`

## Deploy

`vercel deploy --prod`, then set the same env vars from `.env.example` in the Vercel
project settings, plus a Lemon Squeezy webhook pointed at
`https://<domain>/api/webhooks/lemonsqueezy` for the `order_created` event.

## Tests

`npm test` — covers `lib/bidding.ts` and `lib/lemonsqueezy.ts` only (see spec §7).
```

- [ ] **Step 2: Deploy to Vercel**

Run: `vercel deploy --prod` (requires Vercel CLI logged in; link the project when
prompted). Set all env vars from `.env.example` in the Vercel dashboard before this
step, and configure the Lemon Squeezy webhook URL as described in the README.

- [ ] **Step 3: Verify production**

Run: `curl -s -o /dev/null -w "%{http_code}\n" https://<your-vercel-domain>/es`
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add setup and deploy instructions"
```
