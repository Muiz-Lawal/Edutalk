import React, { useEffect, useState } from 'react';
import { Elements, CardElement, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useCartStore } from '../stores/cartStore';
import { formatPrice } from '../lib/currency';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_example');

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const lines = useCartStore((state) => state.lines);
  const clear = useCartStore((state) => state.clear);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    api.post('/pricing/quote', { items: lines.map((line) => ({ classId: line.classId, days: line.days })) })
      .then(({ data }) => setQuote(data))
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to refresh prices.'));
  }, [lines]);

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || !quote) return;
    setProcessing(true);
    try {
      const { data: intent } = await api.post('/checkout/batch', {
        items: lines.map((line) => ({ classId: line.classId, days: line.days })),
        provider: 'stripe',
      });
      const confirmation = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: { card: elements.getElement(CardElement) },
      });
      if (confirmation.error) throw confirmation.error;
      const { data } = await api.post('/payments/confirm', {
        paymentIntentId: intent.paymentIntentId,
        items: lines.map((line) => ({ classId: line.classId, days: line.days })),
        provider: 'stripe',
        checkoutId: intent.checkoutId,
      });
      clear();
      navigate('/checkout/confirmation', { state: { result: data } });
    } catch (requestError) {
      console.error('Checkout failed', requestError);
      setError('We couldn’t complete your payment. Please check your details and try again.');
    } finally {
      setProcessing(false);
    }
  };

  return <main className="enrollment-page"><div className="container"><div className="enrollment-header"><h1>Multi-class checkout</h1><p>One secure payment across all selected hosts.</p></div><form className="enrollment-form" onSubmit={submit}><p>Total: <strong>{formatPrice(quote?.totalAmountCents || 0)}</strong></p><div className="card-element-wrapper"><CardElement /></div>{error && <div className="error-message">{error}</div>}<button className="btn btn-primary full-width" disabled={processing || !stripe}>{processing ? 'Processing your payment…' : `Pay ${formatPrice(quote?.totalAmountCents || 0)}`}</button></form></div></main>;
}

export default function BatchCheckoutPage() {
  return <Elements stripe={stripePromise}><CheckoutForm /></Elements>;
}
