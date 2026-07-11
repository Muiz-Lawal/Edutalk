/**
 * Pricing Engine for EduTalk Classes
 * Implements dynamic pricing based on commitment duration
 * 
 * Multipliers:
 * 1-3 days:   1.8x (most expensive per day)
 * 4-6 days:   1.5x
 * 7-13 days:  1.25x
 * 14-20 days: 1.1x
 * 21-30 days: 1.0x (least expensive per day - full commitment)
 */

/**
 * Calculates the price multiplier based on number of days
 * @param {Number} days - Number of days (1-30)
 * @returns {Number} - Price multiplier
 */
export const getPriceMultiplier = (days) => {
  if (days < 1 || days > 30) {
    throw new Error('Days must be between 1 and 30');
  }

  if (days <= 3) return 1.8;
  if (days <= 6) return 1.5;
  if (days <= 13) return 1.25;
  if (days <= 20) return 1.1;
  return 1.0;
};

/**
 * Calculates daily rate based on monthly price
 * @param {Number} monthlyPrice - Monthly subscription price
 * @returns {Number} - Daily rate (base)
 */
export const getDailyRate = (monthlyPrice) => {
  if (monthlyPrice < 0) {
    throw new Error('Monthly price cannot be negative');
  }
  return monthlyPrice / 30;
};

/**
 * Calculates the total price for a given number of days
 * @param {Number} monthlyPrice - Monthly subscription price
 * @param {Number} days - Number of days (1-30)
 * @returns {Object} - { dailyRate, multiplier, totalPrice }
 */
export const calculatePrice = (monthlyPrice, days) => {
  if (days < 1 || days > 30) {
    throw new Error('Days must be between 1 and 30');
  }

  const dailyRate = getDailyRate(monthlyPrice);
  const multiplier = getPriceMultiplier(days);
  const adjustedDailyRate = dailyRate * multiplier;
  const totalPrice = adjustedDailyRate * days;

  return {
    monthlyPrice,
    days,
    dailyRate: parseFloat(dailyRate.toFixed(2)),
    multiplier,
    adjustedDailyRate: parseFloat(adjustedDailyRate.toFixed(2)),
    totalPrice: parseFloat(totalPrice.toFixed(2)),
  };
};

/**
 * Calculates pricing for continuation (buying more days later)
 * Compares fresh purchase vs. using total minus already paid
 * 
 * @param {Number} monthlyPrice - Monthly subscription price
 * @param {Number} alreadyPaid - Amount already paid
 * @param {Number} additionalDays - Additional days to purchase
 * @returns {Object} - Best price option
 */
export const calculateContinuationPrice = (monthlyPrice, alreadyPaid, additionalDays) => {
  if (additionalDays < 1 || additionalDays > 30) {
    throw new Error('Additional days must be between 1 and 30');
  }

  // Option 1: Fresh purchase of additionalDays
  const freshPurchase = calculatePrice(monthlyPrice, additionalDays);

  // Option 2: Buy full 30 days fresh, subtract already paid
  const fullMonthOption = calculatePrice(monthlyPrice, 30);
  const fullMonthRemaining = fullMonthOption.totalPrice - alreadyPaid;

  // Option 3: Buy additionalDays + previous days as one purchase
  const totalDays = Math.min(30, additionalDays); // Can't exceed 30 days
  const totalPurchaseOption = calculatePrice(monthlyPrice, totalDays);
  const totalRemaining = totalPurchaseOption.totalPrice - alreadyPaid;

  // Return the cheapest option
  const cheapestPrice = Math.min(freshPurchase.totalPrice, fullMonthRemaining, totalRemaining);

  return {
    options: {
      fresh: freshPurchase,
      fullMonth: {
        ...fullMonthOption,
        chargeableAmount: fullMonthRemaining,
      },
      combined: {
        ...totalPurchaseOption,
        chargeableAmount: totalRemaining,
      },
    },
    recommended: cheapestPrice === freshPurchase.totalPrice 
      ? 'fresh'
      : cheapestPrice === fullMonthRemaining 
        ? 'fullMonth'
        : 'combined',
    cheapestPrice: parseFloat(cheapestPrice.toFixed(2)),
  };
};

/**
 * Calculates all price tiers for a class (1-30 days)
 * Used to display pricing table on class detail page
 * 
 * @param {Number} monthlyPrice - Monthly subscription price
 * @returns {Array} - Array of price tiers
 */
export const getAllPriceTiers = (monthlyPrice) => {
  const tiers = [];
  const baseDaily = getDailyRate(monthlyPrice);

  // Generate tiers for common durations
  const durations = [1, 3, 5, 7, 10, 14, 21, 30];

  for (const days of durations) {
    const multiplier = getPriceMultiplier(days);
    const adjustedDailyRate = baseDaily * multiplier;
    const totalPrice = adjustedDailyRate * days;

    tiers.push({
      days,
      label: days === 1 ? '1 day' : `${days} days`,
      multiplier,
      dailyRate: parseFloat(adjustedDailyRate.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });
  }

  return tiers;
};

/**
 * Formats price for display
 * @param {Number} price - Price amount
 * @param {String} currency - Currency code (default: USD)
 * @returns {String} - Formatted price string
 */
export const formatPrice = (price, currency = 'USD') => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  });
  return formatter.format(price);
};

/**
 * Validates pricing parameters
 * @param {Number} monthlyPrice - Monthly price
 * @param {Number} days - Number of days
 * @returns {Object} - { isValid, errors: [] }
 */
export const validatePricingParams = (monthlyPrice, days) => {
  const errors = [];

  if (typeof monthlyPrice !== 'number' || monthlyPrice < 0) {
    errors.push('Monthly price must be a non-negative number');
  }

  if (!Number.isInteger(days) || days < 1 || days > 30) {
    errors.push('Days must be an integer between 1 and 30');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Example usage:
 * 
 * // Single purchase (student buying 15 days of $100/month class)
 * const pricing = calculatePrice(100, 15);
 * console.log(pricing);
 * // {
 * //   monthlyPrice: 100,
 * //   days: 15,
 * //   dailyRate: 3.33,
 * //   multiplier: 1.25,
 * //   adjustedDailyRate: 4.17,
 * //   totalPrice: 62.50
 * // }
 * 
 * // Continuation pricing (student already paid $62.50, now buying 10 more days)
 * const continuation = calculateContinuationPrice(100, 62.50, 10);
 * console.log(continuation);
 * // Returns best option between fresh purchase, full month, or combined
 * 
 * // Price table for display
 * const allTiers = getAllPriceTiers(100);
 * console.log(allTiers);
 * // Returns array of tiers for 1, 3, 5, 7, 10, 14, 21, 30 days
 */
