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
