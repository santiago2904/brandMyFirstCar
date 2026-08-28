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
  logoUrl?: string
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

  // Upsert the sponsor. logo_url is only included (and so only overwritten)
  // when this bid actually supplied one.
  const { data: sponsor, error: sponsorError } = await supabase
    .from('sponsors')
    .upsert(
      {
        email: input.sponsorEmail,
        brand_name: input.brandName,
        ...(input.logoUrl ? { logo_url: input.logoUrl } : {}),
      },
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
