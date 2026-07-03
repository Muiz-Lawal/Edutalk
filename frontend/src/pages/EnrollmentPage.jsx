import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import { loadStripe } from '@stripe/stripe-js';
import useEventLogger from '../hooks/useEventLogger';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import '../styles/Enrollment.css';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_example');

function EnrollmentForm({ classData, selectedDays, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [discountCode, setDiscountCode] = useState('');
  const [discountValidation, setDiscountValidation] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const calculatePrice = () => {
    const baseRate = classData.monthlyPrice / 30;
    let multiplier = 1.0;

    if (selectedDays >= 1 && selectedDays <= 3) multiplier = 1.8;
    else if (selectedDays >= 4 && selectedDays <= 6) multiplier = 1.5;
    else if (selectedDays >= 7 && selectedDays <= 13) multiplier = 1.25;
    else if (selectedDays >= 14 && selectedDays <= 20) multiplier = 1.1;

    return Math.round(baseRate * multiplier * selectedDays * 100) / 100;
  };

  const originalPrice = calculatePrice();
  const discountAmount = discountValidation?.valid ? discountValidation.discount.discountAmount : 0;
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  const validateDiscount = async () => {
    if (!discountCode.trim()) {
      setDiscountValidation(null);
      return;
    }

    setIsValidating(true);
    setError('');

    try {
      const response = await api.post('/discounts/validate', {
        code: discountCode,
        itemId: classData._id,
        itemType: 'Class',
        purchaseAmount: originalPrice
      });

      setDiscountValidation(response.data);
    } catch (err) {
      setDiscountValidation({
        valid: false,
        reason: err.response?.data?.message || 'Invalid discount code'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setError('Stripe not loaded');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Create payment intent
      const paymentResponse = await api.post('/payments/create-intent', {
        classId: classData._id,
        numberOfDays: selectedDays,
        discountCode: discountValidation?.valid ? discountCode : null
      });

      const { clientSecret } = paymentResponse.data;

      // Confirm payment
      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        }
      });

      if (stripeError) {
        setError(stripeError.message);
        return;
      }

      // Confirm payment on backend
      await api.post('/payments/confirm', {
        paymentIntentId: paymentResponse.data.clientSecret.split('_secret_')[0],
        classId: classData._id,
        numberOfDays: selectedDays
      });

      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="enrollment-form">
      <div className="price-summary">
        <h3>Order Summary</h3>
        <div className="price-breakdown">
          <div className="price-row">
            <span>{selectedDays} days × ${classData.monthlyPrice}/month</span>
            <span>${originalPrice.toFixed(2)}</span>
          </div>
          {discountValidation?.valid && (
            <div className="price-row discount">
              <span>Discount ({discountValidation.discount.name})</span>
              <span>-${discountAmount.toFixed(2)}</span>
            </div>
          )}
          <div className="price-row total">
            <span>Total</span>
            <span>${finalPrice.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Discount Code (Optional)</label>
          <div className="discount-input-group">
            <input
              type="text"
              value={discountCode}
              onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
              placeholder="Enter discount code"
              className="discount-input"
            />
            <button
              type="button"
              onClick={validateDiscount}
              disabled={isValidating || !discountCode.trim()}
              className="btn btn-secondary"
            >
              {isValidating ? 'Validating...' : 'Apply'}
            </button>
          </div>

          {discountValidation && (
            <div className={`discount-message ${discountValidation.valid ? 'success' : 'error'}`}>
              {discountValidation.valid ? (
                <>
                  <p>✅ {discountValidation.discount.name} applied!</p>
                  <p>You save ${discountAmount.toFixed(2)}</p>
                  {discountValidation.remainingTotalUses !== null && (
                    <p>{discountValidation.remainingTotalUses} uses remaining</p>
                  )}
                  {discountValidation.remainingUserUses !== null && (
                    <p>{discountValidation.remainingUserUses} uses left for you</p>
                  )}
                </>
              ) : (
                <p>❌ {discountValidation.reason}</p>
              )}
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Payment Information</label>
          <div className="card-element-wrapper">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="btn btn-primary full-width"
        >
          {isProcessing ? 'Processing...' : `Pay $${finalPrice.toFixed(2)}`}
        </button>
      </form>
    </div>
  );
}

export default function EnrollmentPage() {
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(1);
  const [enrolled, setEnrolled] = useState(false);

  const { logEvent } = useEventLogger();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const days = parseInt(searchParams.get('days')) || 1;
    setSelectedDays(Math.max(1, Math.min(30, days)));

    fetchClass();
  }, [classId, isAuthenticated, navigate, searchParams]);

  useEffect(() => {
    if (classData) {
      logEvent({ action: 'view_enrollment', targetType: 'class', targetId: classData._id });
    }
  }, [classData]);

  const fetchClass = async () => {
    try {
      const response = await api.get(`/classes/${classId}`);
      setClassData(response.data);
    } catch (error) {
      console.error('Failed to fetch class:', error);
      navigate('/browse');
    } finally {
      setLoading(false);
    }
  };

  const handleEnrollmentSuccess = () => {
    setEnrolled(true);
    setTimeout(() => {
      navigate('/dashboard');
    }, 3000);
  };

  if (loading) {
    return <div className="loading">Loading enrollment...</div>;
  }

  if (!classData) {
    return <div className="error">Class not found</div>;
  }

  if (enrolled) {
    return (
      <div className="enrollment-success">
        <div className="container">
          <div className="success-message">
            <h2>🎉 Enrollment Successful!</h2>
            <p>You've successfully enrolled in <strong>{classData.title}</strong></p>
            <p>Check your dashboard for access details and session information.</p>
            <p>Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="enrollment-page">
      <div className="container">
        <div className="enrollment-header">
          <h1>Enroll in {classData.title}</h1>
          <p>by {classData.hostId?.firstName} {classData.hostId?.lastName}</p>
        </div>

        <div className="enrollment-content">
          <div className="class-summary">
            <div className="class-info">
              <h3>Class Details</h3>
              <p><strong>Duration:</strong> {selectedDays} days</p>
              <p><strong>Monthly Price:</strong> ${classData.monthlyPrice}</p>
              <p><strong>Category:</strong> {classData.category}</p>
              <p><strong>Students Enrolled:</strong> {classData.totalEnrolled}</p>
            </div>
          </div>

          <Elements stripe={stripePromise}>
            <EnrollmentForm
              classData={classData}
              selectedDays={selectedDays}
              onSuccess={handleEnrollmentSuccess}
            />
          </Elements>
        </div>
      </div>
    </div>
  );
}
