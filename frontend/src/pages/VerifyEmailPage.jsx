import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, LoaderCircle } from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toastManager';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.css';

const emptyCode = ['', '', '', '', '', ''];

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthSession } = useAuth();
  const email = params.get('email') || '';
  const queryCode = params.get('code') || '';
  const [code, setCode] = useState(emptyCode);
  const [status, setStatus] = useState('');
  const [message, setMessage] = useState('');
  const [cooldown, setCooldown] = useState(30);
  const [resending, setResending] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const inputRefs = useRef([]);
  const submitLock = useRef(false);

  useEffect(() => {
    if (!cooldown) return undefined;
    const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    const digits = queryCode.replace(/\D/g, '').slice(0, 6).split('');
    if (digits.length !== 6) return;
    const next = [...emptyCode];
    digits.forEach((digit, index) => { next[index] = digit; });
    setCode(next);
    verify(next);
  }, [queryCode]);

  const request = async (method, url, data) => {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10000);
    try {
      return await api[method](url, data, { signal: controller.signal });
    } finally {
      window.clearTimeout(timeout);
    }
  };

  const verify = async (nextCode) => {
    if (nextCode.some((digit) => !digit) || submitting || submitLock.current) return;
    submitLock.current = true;
    setSubmitting(true);
    setStatus('');
    setMessage('');
    try {
      const { data } = await request('post', '/auth/verify-email', { email, code: nextCode.join('') });
      setAuthSession(data.user, data.token);
      const isHost = data.user?.isHost;
      setStatus('success');
      setMessage('Code accepted');
      showToast({ title: 'Email verified', type: 'success' });
      window.setTimeout(() => navigate(isHost ? '/onboarding/host' : '/onboarding', { replace: true }), 250);
    } catch (error) {
      console.error('Email verification failed', error);
      setCode(emptyCode);
      const errorCode = error?.cause?.response?.data?.error;
      setStatus(errorCode === 'expired_code' ? 'expired' : errorCode === 'too_many_attempts' ? 'locked' : errorCode === 'invalid_code' ? 'invalid' : 'error');
      setMessage(errorCode === 'expired_code' ? 'This code expired. Send a new one.' : errorCode === 'too_many_attempts' ? 'Too many attempts. Send a new code.' : errorCode === 'invalid_code' ? "That code didn't match. Try again." : 'We couldn’t verify your email. Please try again.');
      window.setTimeout(() => inputRefs.current[0]?.focus(), 0);
    } finally {
      setSubmitting(false);
      submitLock.current = false;
    }
  };

  const updateDigit = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...code];
    next[index] = digit;
    setCode(next);
    if (digit && index < 5) inputRefs.current[index + 1]?.focus();
    if (digit && index === 5) verify(next);
  };

  const handleKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !code[index] && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (event.key === 'ArrowRight' && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const paste = (event) => {
    const digits = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6).split('');
    if (!digits.length) return;
    event.preventDefault();
    const next = [...emptyCode];
    digits.forEach((digit, index) => { next[index] = digit; });
    setCode(next);
    inputRefs.current[Math.min(digits.length, 6) - 1]?.focus();
    if (digits.length === 6) verify(next);
  };

  const resend = async () => {
    if (cooldown || resending) return;
    setResending(true);
    setStatus('');
    try {
      await request('post', '/auth/resend-code', { email });
      setCooldown(30);
      showToast({ title: `New code sent to ${email}`, type: 'success' });
    } catch (error) {
      console.error('Verification resend failed', error);
      setStatus('error');
      setMessage('We couldn’t send a new code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const formattedCooldown = `0:${String(cooldown).padStart(2, '0')}`;
  return <main className="auth-page auth-page--single"><section className="auth-panel auth-panel--form"><div className="auth-container auth-confirmation">
    <div className="auth-confirmation-icon"><Mail size={24} /></div>
    <div className="auth-form-heading"><h1>Check your email</h1><p>We sent a 6-digit code to {email}. It expires in 10 minutes.</p><Link className="auth-back-link" to="/register">Wrong email? Go back</Link></div>
    <div className="verification-code" onPaste={paste} aria-label="Email verification code">{code.map((digit, index) => <input key={index} ref={(element) => { inputRefs.current[index] = element; }} inputMode="numeric" pattern="[0-9]*" maxLength={1} value={digit} disabled={submitting} aria-label={`Verification digit ${index + 1}`} className={status === 'invalid' ? 'is-invalid' : ''} onChange={(event) => updateDigit(index, event.target.value)} onKeyDown={(event) => handleKeyDown(index, event)} />)}</div>
    {submitting && <p className="verification-status"><LoaderCircle size={16} className="ui-spinner" /> Verifying…</p>}
    {message && <p className={`verification-message verification-message--${status}`} aria-live="polite">{message} {status === 'error' && <button type="button" className="verification-retry" onClick={() => verify(code)}>Retry</button>}</p>}
    <button type="button" autoFocus={status === 'expired' && !cooldown} className={`resend-code${cooldown ? ' is-disabled' : ''}`} onClick={resend} disabled={Boolean(cooldown) || resending}>{cooldown ? `Resend code (${formattedCooldown})` : 'Resend code'}</button>
    <p className="auth-footer">Need help? <Link to="/login">Return to sign in</Link></p>
  </div></section></main>;
}
