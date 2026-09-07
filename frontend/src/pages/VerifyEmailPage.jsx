import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import api from '../utils/api';
import Button from '../components/ui/Button';
import '../styles/Auth.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const email = params.get('email') || '';
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const resend = async () => {
    setLoading(true);
    try { await api.post('/users/send-verification'); setSent(true); } catch (error) { console.error('Verification email request failed', error); } finally { setLoading(false); }
  };
  return <main className="auth-page auth-page--single"><section className="auth-panel auth-panel--form"><div className="auth-container auth-confirmation"><div className="auth-confirmation-icon"><MailCheck size={28} /></div><div className="auth-form-heading"><h1>Check your email</h1><p>We sent a verification link to {email || 'your email address'}. Open it to finish setting up your EduTalk account.</p></div><Button variant="secondary" onClick={resend} loading={loading}>{sent ? 'Email sent' : 'Resend verification email'}</Button><p className="auth-footer">Ready to continue? <Link to="/dashboard">Go to your dashboard</Link></p></div></section></main>;
}
