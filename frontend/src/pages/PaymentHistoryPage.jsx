import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import '../styles/PaymentHistoryPage.css';
import { formatPrice } from '../lib/currency';

export default function PaymentHistoryPage() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/payments/history')
      .then(({ data }) => {
        const paymentList = Array.isArray(data) ? data : data?.payments;
        setPayments(Array.isArray(paymentList) ? paymentList : []);
      })
      .catch((requestError) => setError(requestError.response?.data?.message || 'Unable to load payment history.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="payment-history-page">
      <div className="payment-history-page__inner">
        <header className="payment-history-page__header">
          <div>
            <p className="eyebrow">EduTalk account</p>
            <h1>Payments</h1>
            <p>Review your class purchases, access periods, and payment status.</p>
          </div>
          <Link className="payment-history-page__browse" to="/browse">Browse classes</Link>
        </header>

        {loading && <div className="async-skeleton async-skeleton--list" aria-hidden="true" />}
        {error && <div className="payment-history-page__error" role="alert">We couldn’t load payment history. Please try again.</div>}
        {!loading && !error && payments.length === 0 && (
          <div className="payment-history-page__empty">
            <h2>No payments yet</h2>
            <p>When you enroll in a class, your payment and access details will appear here.</p>
            <Link className="payment-history-page__browse" to="/browse">Find a class</Link>
          </div>
        )}
        {!loading && !error && payments.length > 0 && (
          <div className="payment-history-table-wrap">
            <table className="payment-history-table">
              <thead>
                <tr><th>Class</th><th>Date</th><th>Days</th><th>Amount</th><th>Status</th></tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td>{payment.classId?.title || 'Class purchase'}</td>
                    <td>{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '-'}</td>
                    <td>{payment.daysPurchased || '-'}</td>
                    <td>{formatPrice((Number(payment.amount) || 0) * 100, payment.currency || 'USD')}</td>
                    <td><span className={`payment-status payment-status--${payment.status}`}>{payment.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
