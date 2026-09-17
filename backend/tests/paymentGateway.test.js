import { describe, expect, it } from 'vitest';
import crypto from 'crypto';
import { resolvePaymentGateway, verifyPaystackWebhookSignature } from '../src/utils/paymentGateway.js';

describe('payment gateway selection', () => {
  it('routes Paystack requests for African-market currencies', () => {
    expect(resolvePaymentGateway({ currency: 'NGN' })).toBe('paystack');
    expect(resolvePaymentGateway({ provider: 'paystack' })).toBe('paystack');
  });

  it('keeps USD payments on Stripe by default', () => {
    expect(resolvePaymentGateway({ currency: 'USD' })).toBe('stripe');
    expect(resolvePaymentGateway({ provider: 'stripe' })).toBe('stripe');
  });

  it('verifies Paystack webhook signatures without accepting altered payloads', () => {
    const payload = Buffer.from(JSON.stringify({ event: 'charge.success' }));
    const secret = 'paystack-test-secret';
    const signature = crypto.createHmac('sha512', secret).update(payload).digest('hex');

    expect(verifyPaystackWebhookSignature({ payload, signature, secret })).toBe(true);
    expect(verifyPaystackWebhookSignature({ payload: Buffer.from(`${payload}x`), signature, secret })).toBe(false);
    expect(verifyPaystackWebhookSignature({ payload, signature: 'invalid', secret })).toBe(false);
  });
});
