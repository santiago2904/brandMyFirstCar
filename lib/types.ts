export type SpotSize = 'S' | 'M' | 'L'
export type BidStatus = 'active' | 'outbid' | 'refunded' | 'won'

export interface Spot {
  id: string
  zone_name: string
  size: SpotSize
  starting_price: number
  current_bid: number | null
  current_leader_sponsor_id: string | null
  // Joined via `current_leader:sponsors(...)` in the spots query — null when
  // no bid has been placed yet, or absent on realtime UPDATE payloads (those
  // carry only the changed columns, so callers refetch the row to get this).
  current_leader?: { logo_url: string | null; brand_name: string } | null
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

export interface SiteStats {
  total_visits: number
}
