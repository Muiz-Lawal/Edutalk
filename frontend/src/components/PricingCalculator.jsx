import React, { useState, useEffect } from 'react';
import '../styles/PricingCalculator.css';

export default function PricingCalculator({ monthlyPrice, onPriceChange }) {
  const [days, setDays] = useState(7);
  const [pricing, setPricing] = useState(null);

  // Multipliers based on duration
  const getMultiplier = (d) => {
    if (d <= 3) return 1.8;
    if (d <= 6) return 1.5;
    if (d <= 13) return 1.25;
    if (d <= 20) return 1.1;
    return 1.0;
  };

  // Calculate pricing
  useEffect(() => {
    const dailyRate = monthlyPrice / 30;
    const multiplier = getMultiplier(days);
    const adjustedDailyRate = dailyRate * multiplier;
    const totalPrice = adjustedDailyRate * days;

    const calculated = {
      days,
      dailyRate: parseFloat(dailyRate.toFixed(2)),
      multiplier,
      adjustedDailyRate: parseFloat(adjustedDailyRate.toFixed(2)),
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    };

    setPricing(calculated);
    if (onPriceChange) {
      onPriceChange(calculated);
    }
  }, [days, monthlyPrice]);

  if (!pricing) return null;

  return (
    <div className="pricing-calculator">
      <div className="pricing-calculator__section">
        <label className="pricing-calculator__label">
          Duration: <strong>{days} days</strong>
        </label>
        <input
          type="range"
          min="1"
          max="30"
          value={days}
          onChange={(e) => setDays(parseInt(e.target.value))}
          className="pricing-calculator__slider"
        />
        <div className="pricing-calculator__labels">
          <span>1 day</span>
          <span>15 days</span>
          <span>30 days</span>
        </div>
      </div>

      <div className="pricing-calculator__breakdown">
        <div className="pricing-calculator__row">
          <span className="pricing-calculator__label">Monthly Price:</span>
          <span className="pricing-calculator__value">${monthlyPrice}</span>
        </div>

        <div className="pricing-calculator__row">
          <span className="pricing-calculator__label">Daily Rate (Base):</span>
          <span className="pricing-calculator__value">${pricing.dailyRate}/day</span>
        </div>

        <div className="pricing-calculator__row">
          <span className="pricing-calculator__label">Multiplier:</span>
          <span className="pricing-calculator__multiplier">
            {pricing.multiplier}x {pricing.multiplier === 1.8 && '(Short-term)'}
            {pricing.multiplier === 1.5 && '(Standard)'}
            {pricing.multiplier === 1.25 && '(Extended)'}
            {pricing.multiplier === 1.1 && '(Long-term)'}
            {pricing.multiplier === 1.0 && '(Full month)'}
          </span>
        </div>

        <div className="pricing-calculator__row">
          <span className="pricing-calculator__label">Adjusted Daily Rate:</span>
          <span className="pricing-calculator__value">${pricing.adjustedDailyRate}/day</span>
        </div>

        <div className="pricing-calculator__divider"></div>

        <div className="pricing-calculator__row pricing-calculator__row--total">
          <span className="pricing-calculator__label">Total Price:</span>
          <span className="pricing-calculator__total">${pricing.totalPrice}</span>
        </div>
      </div>

      <div className="pricing-calculator__info">
        <p>
          Purchase {days} days of access at a {pricing.multiplier}x multiplier for a total of{' '}
          <strong>${pricing.totalPrice}</strong>.
        </p>
      </div>
    </div>
  );
}
