import React from 'react';
import { formatDate } from '../lib/date';
import { Link, useLocation } from 'react-router-dom';

export default function CheckoutConfirmationPage() {
  const { state } = useLocation();
  const subscriptions = state?.result?.subscriptions || [];
  return <main className="enrollment-success"><div className="container"><div className="success-message"><h1>Payment successful</h1><p>Each class renews separately on its own date.</p>{subscriptions.map((item) => <div key={String(item.classId)}><strong>{item.classId}</strong><p>Access code: {item.accessCode}</p><p>{formatDate(item.startDate)} – {formatDate(item.endDate)}</p></div>)}<Link className="btn btn-primary" to="/dashboard">Go to dashboard</Link></div></div></main>;
}
