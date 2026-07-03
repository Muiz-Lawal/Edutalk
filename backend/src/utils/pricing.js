export const PRICING_TIERS = {
  '1-3': 1.8,      // 1-3 days: 1.8x multiplier
  '4-6': 1.5,      // 4-6 days: 1.5x multiplier
  '7-13': 1.25,    // 7-13 days: 1.25x multiplier
  '14-20': 1.1,    // 14-20 days: 1.1x multiplier
  '21-30': 1.0,    // 21-30 days: base rate (no multiplier)
};

export const calculateDailyRate = (monthlyPrice, days) => {
  const baseRate = monthlyPrice / 30;
  let multiplier = 1.0;
  
  if (days >= 1 && days <= 3) {
    multiplier = PRICING_TIERS['1-3'];
  } else if (days >= 4 && days <= 6) {
    multiplier = PRICING_TIERS['4-6'];
  } else if (days >= 7 && days <= 13) {
    multiplier = PRICING_TIERS['7-13'];
  } else if (days >= 14 && days <= 20) {
    multiplier = PRICING_TIERS['14-20'];
  } else if (days >= 21 && days <= 30) {
    multiplier = PRICING_TIERS['21-30'];
  } else if (days > 30) {
    multiplier = PRICING_TIERS['21-30'];
  }
  
  return Math.round(baseRate * multiplier * 100) / 100;
};

export const calculatePrice = (monthlyPrice, days) => {
  const dailyRate = calculateDailyRate(monthlyPrice, days);
  return Math.round(dailyRate * days * 100) / 100;
};

export const getCommissionPercentage = (planTier) => {
  const commissions = {
    'starter': 0.25,
    'growth': 0.20,
    'pro': 0.15,
    'elite': 0.10,
  };
  return commissions[planTier] || 0.25;
};

export const calculatePaymentSplit = (amount, planTier) => {
  const platformCommission = amount * getCommissionPercentage(planTier);
  const stripeProcessingFee = (amount * 0.029) + 0.30;
  const hostEarnings = amount - platformCommission - stripeProcessingFee;
  
  return {
    platformCommission: Math.round(platformCommission * 100) / 100,
    stripeProcessingFee: Math.round(stripeProcessingFee * 100) / 100,
    hostEarnings: Math.round(hostEarnings * 100) / 100,
  };
};

export const calculateContinuationPrice = (monthlyPrice, previousDaysPurchased, previousAmountPaid, newDays) => {
  const freshPrice = calculatePrice(monthlyPrice, newDays);
  const totalDays = previousDaysPurchased + newDays;
  const continuationPrice = calculatePrice(monthlyPrice, totalDays) - previousAmountPaid;
  
  return Math.min(freshPrice, Math.max(0, continuationPrice));
};
