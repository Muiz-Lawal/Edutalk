import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles/DynamicPriceDisplay.css';

export default function DynamicPriceDisplay({ bundleId, basePrice, onPriceUpdate }) {
  const [currentPrice, setCurrentPrice] = useState(basePrice);
  const [priceFactors, setPriceFactors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCurrentPrice();
  }, [bundleId]);

  const fetchCurrentPrice = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/bundles/${bundleId}/current-price`);
      const { price, factors } = response.data;
      setCurrentPrice(price);
      setPriceFactors(factors);
      if (onPriceUpdate) {
        onPriceUpdate(price);
      }
    } catch (err) {
      console.error('Error fetching current price:', err);
      setError('Unable to load current pricing');
      setCurrentPrice(basePrice);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  const getFactorIcon = (type) => {
    switch (type) {
      case 'demand': return '📈';
      case 'seasonal': return '🎄';
      case 'flash_sale': return '⚡';
      case 'time_discount': return '⏰';
      default: return '💰';
    }
  };

  const getFactorColor = (type) => {
    switch (type) {
      case 'demand': return '#dc2626';
      case 'seasonal': return '#059669';
      case 'flash_sale': return '#d97706';
      case 'time_discount': return '#7c3aed';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="dynamic-price-loading">
        <div className="price-skeleton"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dynamic-price-error">
        <span className="base-price">{formatPrice(basePrice)}</span>
        <small className="error-text">{error}</small>
      </div>
    );
  }

  const hasDynamicPricing = priceFactors.length > 0;
  const isDiscount = currentPrice < basePrice;

  return (
    <div className="dynamic-price-display">
      <div className="price-container">
        <span className={`current-price ${isDiscount ? 'discounted' : ''}`}>
          {formatPrice(currentPrice)}
        </span>

        {hasDynamicPricing && (
          <span className="base-price-strike">
            {formatPrice(basePrice)}
          </span>
        )}
      </div>

      {hasDynamicPricing && (
        <div className="price-factors">
          {priceFactors.map((factor, index) => (
            <div
              key={index}
              className="price-factor"
              style={{ '--factor-color': getFactorColor(factor.type) }}
            >
              <span className="factor-icon">{getFactorIcon(factor.type)}</span>
              <span className="factor-description">{factor.description}</span>
              <span className="factor-value">
                {factor.multiplier > 1 ? `+${((factor.multiplier - 1) * 100).toFixed(0)}%` :
                 `-${((1 - factor.multiplier) * 100).toFixed(0)}%`}
              </span>
            </div>
          ))}
        </div>
      )}

      {isDiscount && (
        <div className="savings-badge">
          Save {formatPrice(basePrice - currentPrice)}
        </div>
      )}
    </div>
  );
}
