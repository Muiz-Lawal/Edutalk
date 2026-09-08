export const PAYSTACK_CURRENCIES = ['NGN', 'GHS', 'ZAR', 'KES'] as const;
export const STRIPE_CURRENCIES = ['USD', 'GBP', 'EUR', 'INR', 'CAD', 'JPY', 'BRL', 'AUD'] as const;

export type PaymentProvider = 'paystack' | 'stripe';
export type ConnectedProcessor = { provider: PaymentProvider; status: string };

export function route(currency: string, connectedProcessors: ConnectedProcessor[]): PaymentProvider | null {
  const normalized = currency.toUpperCase();
  const active = new Set(connectedProcessors.filter((processor) => processor.status === 'active').map((processor) => processor.provider));
  if (PAYSTACK_CURRENCIES.includes(normalized as never) && active.has('paystack')) return 'paystack';
  if (STRIPE_CURRENCIES.includes(normalized as never) && active.has('stripe')) return 'stripe';
  return null;
}
