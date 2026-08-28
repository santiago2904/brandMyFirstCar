import { describe, it, expect } from 'vitest'
import {
  computeDeposit,
  computeMinNextBid,
  validateBid,
  computeRemainingBalance,
} from './bidding'

describe('computeDeposit', () => {
  it('is 20% of the bid amount', () => {
    expect(computeDeposit(1000)).toBe(200)
  })

  it('floors at the $10 minimum', () => {
    expect(computeDeposit(30)).toBe(10)
  })
})

describe('computeMinNextBid', () => {
  it('is the starting price when there is no current bid', () => {
    expect(computeMinNextBid(null, 300)).toBe(300)
  })

  it('is current bid + $10 when there is a current bid', () => {
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

  it('rejects a bid that does not beat the current bid by at least $10', () => {
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
