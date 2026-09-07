import {
  calculateContinuationPriceCents,
  calculatePriceCents,
  fromCents,
  getPriceMultiplier,
  toCents,
} from './pricing.js';

export { getPriceMultiplier };

export const getDailyRate = (monthlyPrice) => {
  if (Number(monthlyPrice) < 0) throw new Error('Monthly price cannot be negative');
  return Number(monthlyPrice || 0) / 30;
};

export const calculatePrice = (monthlyPrice, days) => {
  const normalizedDays = Math.min(Math.max(Number(days) || 0, 1), 30);
  const monthly = Number(monthlyPrice) || 0;
  const dailyRate = getDailyRate(monthly);
  const multiplier = getPriceMultiplier(normalizedDays);
  const adjustedDailyRate = dailyRate * multiplier;

  return {
    monthlyPrice: monthly,
    days: normalizedDays,
    dailyRate: Number(dailyRate.toFixed(2)),
    multiplier,
    adjustedDailyRate: Number(adjustedDailyRate.toFixed(2)),
    totalPrice: fromCents(calculatePriceCents(monthly, normalizedDays)),
  };
};

// This legacy API accepts an amount already paid rather than previous days.
// Keep its response shape while using the same integer-cent implementation.
export const calculateContinuationPrice = (monthlyPrice, alreadyPaid, additionalDays) => {
  const monthlyCents = Math.max(0, toCents(monthlyPrice));
  const paidCents = Math.max(0, toCents(alreadyPaid));
  const days = Math.min(Math.max(Number(additionalDays) || 0, 1), 30);
  const freshCents = calculatePriceCents(monthlyPrice, days);
  const fullMonthCents = Math.max(0, monthlyCents - paidCents);
  const combinedCents = Math.max(0, calculatePriceCents(monthlyPrice, days) - paidCents);
  const cheapestCents = Math.min(freshCents, fullMonthCents, combinedCents);

  return {
    options: {
      fresh: calculatePrice(monthlyPrice, days),
      fullMonth: {
        ...calculatePrice(monthlyPrice, 30),
        chargeableAmount: fromCents(fullMonthCents),
      },
      combined: {
        ...calculatePrice(monthlyPrice, days),
        chargeableAmount: fromCents(combinedCents),
      },
    },
    recommended: cheapestCents === freshCents
      ? 'fresh'
      : cheapestCents === fullMonthCents ? 'fullMonth' : 'combined',
    cheapestPrice: fromCents(cheapestCents),
  };
};

export const getAllPriceTiers = (monthlyPrice) => [1, 3, 5, 7, 10, 14, 21, 30].map((days) => {
  const multiplier = getPriceMultiplier(days);
  const dailyRate = getDailyRate(monthlyPrice) * multiplier;
  return {
    days,
    label: days === 1 ? '1 day' : `${days} days`,
    multiplier,
    dailyRate: Number(dailyRate.toFixed(2)),
    totalPrice: fromCents(calculatePriceCents(monthlyPrice, days)),
  };
});

export const formatPrice = (price, currency = 'USD') => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency,
}).format(price);

export const validatePricingParams = (monthlyPrice, days) => {
  const errors = [];
  if (typeof monthlyPrice !== 'number' || !Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
    errors.push('Monthly price must be a non-negative number');
  }
  if (!Number.isInteger(days) || days < 1 || days > 30) {
    errors.push('Days must be an integer between 1 and 30');
  }
  return { isValid: errors.length === 0, errors };
};

export { calculateContinuationPriceCents };
