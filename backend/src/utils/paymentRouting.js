export const PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES'];
export const STRIPE_CURRENCIES = ['USD', 'GBP', 'EUR', 'INR', 'CAD', 'JPY', 'BRL', 'AUD'];

export const routePaymentProvider = (currency, connectedProcessors = []) => {
  const normalizedCurrency = String(currency || '').toUpperCase();
  const active = new Set(
    connectedProcessors
      .filter((processor) => processor.status === 'active')
      .map((processor) => processor.provider),
  );
  if (PAYSTACK_CURRENCIES.includes(normalizedCurrency) && active.has('paystack')) return 'paystack';
  if (STRIPE_CURRENCIES.includes(normalizedCurrency) && active.has('stripe')) return 'stripe';
  return null;
};
