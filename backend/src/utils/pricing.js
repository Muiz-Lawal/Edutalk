/**
 * Pricing is calculated in cents.  Keeping the calculation in integer space
 * avoids the rounding drift that used to occur when several checkout lines
 * were added together.
 */
export const PRICING_TIERS = {
  '1-3': 1.8,
  '4-6': 1.5,
  '7-13': 1.25,
  '14-20': 1.1,
  '21-30': 1.0,
};

const MULTIPLIER_BPS = {
  '1-3': 180,
  '4-6': 150,
  '7-13': 125,
  '14-20': 110,
  '21-30': 100,
};

const MAX_DAYS = 30;
const roundInteger = (numerator, denominator) => Math.floor((numerator + (denominator / 2)) / denominator);

export const toCents = (amount) => {
  const value = Number(amount);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
};

export const fromCents = (cents) => Number((Math.max(0, Math.trunc(cents)) / 100).toFixed(2));

export const normalizePricingDays = (days) => Math.min(Math.max(Number(days) || 0, 1), MAX_DAYS);

const getMultiplierBps = (days) => {
  const normalizedDays = normalizePricingDays(days);
  if (normalizedDays <= 3) return MULTIPLIER_BPS['1-3'];
  if (normalizedDays <= 6) return MULTIPLIER_BPS['4-6'];
  if (normalizedDays <= 13) return MULTIPLIER_BPS['7-13'];
  if (normalizedDays <= 20) return MULTIPLIER_BPS['14-20'];
  return MULTIPLIER_BPS['21-30'];
};

export const getPriceMultiplier = (days) => {
  const normalizedDays = normalizePricingDays(days);
  if (normalizedDays <= 3) return PRICING_TIERS['1-3'];
  if (normalizedDays <= 6) return PRICING_TIERS['4-6'];
  if (normalizedDays <= 13) return PRICING_TIERS['7-13'];
  if (normalizedDays <= 20) return PRICING_TIERS['14-20'];
  return PRICING_TIERS['21-30'];
};

export const calculateDailyRate = (monthlyPrice, days) => {
  const monthlyCents = Math.max(0, toCents(monthlyPrice));
  return fromCents(roundInteger(monthlyCents * getMultiplierBps(days), 30 * 100));
};

export const calculatePriceCents = (monthlyPrice, days) => {
  const monthlyCents = Math.max(0, toCents(monthlyPrice));
  const normalizedDays = normalizePricingDays(days);
  const priceCents = roundInteger(
    monthlyCents * getMultiplierBps(normalizedDays) * normalizedDays,
    30 * 100,
  );
  return Math.min(monthlyCents, priceCents);
};

export const calculatePrice = (monthlyPrice, days) => fromCents(calculatePriceCents(monthlyPrice, days));

export const getCommissionPercentage = (planTier) => ({
  starter: 0.25,
  growth: 0.20,
  pro: 0.15,
  elite: 0.10,
}[planTier] || 0.25);

export const calculatePaymentSplit = (amount, planTier) => {
  const amountCents = Math.max(0, toCents(amount));
  const platformCommissionCents = roundInteger(amountCents * toCents(getCommissionPercentage(planTier)), 100);
  const stripeProcessingFeeCents = roundInteger(amountCents * 29, 1000) + 30;
  const hostEarningsCents = Math.max(0, amountCents - platformCommissionCents - stripeProcessingFeeCents);

  return {
    platformCommission: fromCents(platformCommissionCents),
    stripeProcessingFee: fromCents(stripeProcessingFeeCents),
    hostEarnings: fromCents(hostEarningsCents),
  };
};

/**
 * Return the cheapest valid charge for an additional purchase.  The previous
 * payment is applied to the cumulative 30-day price before comparing it with
 * a fresh purchase.
 */
export const calculateContinuationPriceCents = (
  monthlyPrice,
  previousDaysPurchased,
  previousAmountPaid,
  newDays,
) => {
  const monthlyCents = Math.max(0, toCents(monthlyPrice));
  const previousDays = Math.max(0, Math.trunc(Number(previousDaysPurchased) || 0));
  const previousPaidCents = Math.max(0, toCents(previousAmountPaid));
  const incomingDays = Math.max(0, Math.trunc(Number(newDays) || 0));

  if (incomingDays <= 0) return 0;

  const freshCents = calculatePriceCents(monthlyCents / 100, incomingDays);
  const cumulativeCents = calculatePriceCents(monthlyCents / 100, previousDays + incomingDays);
  const continuationCents = Math.max(0, cumulativeCents - previousPaidCents);
  const monthlyCapCents = Math.max(0, monthlyCents - previousPaidCents);

  return Math.min(freshCents, continuationCents, monthlyCapCents);
};

export const calculateContinuationPrice = (
  monthlyPrice,
  previousDaysPurchased,
  previousAmountPaid,
  newDays,
) => fromCents(calculateContinuationPriceCents(
  monthlyPrice,
  previousDaysPurchased,
  previousAmountPaid,
  newDays,
));
