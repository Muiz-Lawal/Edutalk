import React from 'react';
import { formatPrice } from '../lib/currency';

export default function PriceTag({ usdCents, currency = 'USD', size = 'default' }) {
  return <span className={`price-tag price-tag--${size}`}>{formatPrice(usdCents, currency)}</span>;
}
