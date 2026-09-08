const RATES = { USD: 1, GBP: 0.79, EUR: 0.92, NGN: 1550, INR: 83, CAD: 1.36, JPY: 150, BRL: 5.1, ZAR: 18.2, GHS: 15, KES: 130, AUD: 1.52 };
const SYMBOLS = { USD: '$', GBP: '£', EUR: '€', NGN: '₦', INR: '₹', CAD: 'C$', JPY: '¥', BRL: 'R$', ZAR: 'R', GHS: '₵', KES: 'KSh', AUD: 'A$' };

export function formatPrice(usdCents, code = 'USD') {
  const currency = String(code || 'USD').toUpperCase();
  const amount = (Number(usdCents) || 0) / 100 * (RATES[currency] || 1);
  const digits = ['JPY', 'NGN', 'ZAR'].includes(currency) ? 0 : 2;
  const local = new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  const usd = currency === 'USD' ? '' : ` ($${((Number(usdCents) || 0) / 100).toFixed(2)} USD)`;
  return `${local}${usd}`;
}

export const currencySymbol = (code = 'USD') => SYMBOLS[String(code).toUpperCase()] || '$';
