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
  redirectUrl?: string
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
          product_options: params.redirectUrl
            ? { redirect_url: params.redirectUrl }
            : {},
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
