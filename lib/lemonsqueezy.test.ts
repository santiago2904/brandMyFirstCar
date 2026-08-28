import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createCheckoutUrl, refundOrder, verifyWebhookSignature } from './lemonsqueezy'
import crypto from 'node:crypto'

const originalFetch = global.fetch

beforeEach(() => {
  process.env.LEMONSQUEEZY_API_KEY = 'test-key'
  process.env.LEMONSQUEEZY_STORE_ID = 'store-1'
  process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'shhh'
})

afterEach(() => {
  global.fetch = originalFetch
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
})

describe('refundOrder', () => {
  it('posts a refund request for the given order id', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }) as unknown as typeof fetch

    await refundOrder('order-42')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.lemonsqueezy.com/v1/orders/order-42/refund',
      expect.objectContaining({ method: 'POST' })
    )
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
