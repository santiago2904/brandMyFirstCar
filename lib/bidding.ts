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
