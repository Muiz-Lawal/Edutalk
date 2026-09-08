import axios from 'axios';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_example');
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY || '';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const PAYSTACK_AUTH_HEADER = PAYSTACK_SECRET_KEY ? `Bearer ${PAYSTACK_SECRET_KEY}` : '';

export const resolvePaymentGateway = ({ provider, currency = 'USD' }) => {
  const normalizedProvider = String(provider || '').toLowerCase();
  if (normalizedProvider === 'paystack') return 'paystack';
  if (normalizedProvider === 'stripe') return 'stripe';

  const normalizedCurrency = String(currency || 'USD').toUpperCase();
  return ['NGN', 'GHS', 'KES', 'ZAR', 'EGP', 'TZS', 'UGX', 'XOF', 'XAF'].includes(normalizedCurrency)
    ? 'paystack'
    : 'stripe';
};

export const createGatewayPaymentIntent = async ({
  provider,
  user,
  classId,
  amount,
  numberOfDays,
  discountCode,
  items = [],
  checkoutId,
}) => {
  const gateway = resolvePaymentGateway({
    provider,
    currency: user?.preferredCurrency || 'USD',
  });

  if (gateway === 'paystack') {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not configured');
    }

    const normalizedAmount = Number(amount) || 0;
    const payload = {
      amount: Math.round(normalizedAmount * 100),
      email: user?.email || 'user@example.com',
      currency: String(user?.preferredCurrency || 'USD').toUpperCase(),
      callback_url: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment/callback`,
      metadata: {
        classId: String(classId),
        userId: String(user?._id || user?.id || ''),
        numberOfDays: Number(numberOfDays) || 0,
        discountCode: discountCode || '',
        checkoutId: checkoutId || '',
        classIds: items.map((item) => String(item.classId)).join(','),
        checkoutItems: items,
        totalAmountCents: String(Math.round((Number(amount) || 0) * 100)),
        gateway,
      },
    };

    const response = await axios.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, payload, {
      headers: {
        Authorization: PAYSTACK_AUTH_HEADER,
        'Content-Type': 'application/json',
      },
    });

    if (!response.data?.status || !response.data?.data) {
      throw new Error(response.data?.message || 'Paystack payment initialization failed');
    }

    return {
      provider: 'paystack',
      reference: response.data.data.reference,
      paymentUrl: response.data.data.authorization_url,
      gateway,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round((Number(amount) || 0) * 100),
    currency: String(user?.preferredCurrency || 'USD').toLowerCase(),
    metadata: {
      classId: String(classId),
      userId: String(user?._id || user?.id || ''),
      numberOfDays: Number(numberOfDays) || 0,
      discountCode: discountCode || '',
      checkoutId: checkoutId || '',
      classIds: items.map((item) => String(item.classId)).join(','),
      totalAmountCents: String(Math.round((Number(amount) || 0) * 100)),
      checkoutItems: JSON.stringify(items.map((item) => ({
        classId: String(item.classId),
        numberOfDays: Number(item.numberOfDays),
        amountCents: Number(item.finalAmountCents || 0),
      }))),
      gateway,
    },
  });

  return {
    provider: 'stripe',
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    gateway,
    metadata: paymentIntent.metadata || {},
    amount: paymentIntent.amount,
  };
};

export const verifyGatewayPayment = async ({ provider, paymentIntentId, paymentReference, user }) => {
  const gateway = resolvePaymentGateway({ provider, currency: user?.preferredCurrency || 'USD' });

  if (gateway === 'paystack') {
    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('Paystack secret key is not configured');
    }

    const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(paymentReference)}`, {
      headers: {
        Authorization: PAYSTACK_AUTH_HEADER,
      },
    });

    if (!response.data?.status || response.data.data?.status !== 'success') {
      return {
        status: 'failed',
        provider: 'paystack',
        gateway,
        message: response.data?.message || 'Paystack payment was not confirmed',
      };
    }

    return {
      status: 'succeeded',
      provider: 'paystack',
      gateway,
      paymentIntentId: response.data.data.reference,
      authorizationCode: response.data.data.authorization?.authorization_code || null,
      transactionId: response.data.data.id,
      metadata: response.data.data.metadata || {},
      amount: response.data.data.amount,
    };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
  return {
    status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'requires_payment_method',
    provider: 'stripe',
    gateway,
    paymentIntentId: paymentIntent.id,
  };
};
