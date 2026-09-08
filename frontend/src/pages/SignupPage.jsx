import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Check, Eye, EyeOff, GraduationCap, Presentation, ShieldCheck, Video, UserPlus } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import Button from '../components/ui/Button';
import '../styles/Auth.css';

const initialForm = { firstName: '', lastName: '', email: '', password: '', isHost: false, termsAccepted: false, referralCode: '', dateOfBirth: '' };

export default function SignupPage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showReferral, setShowReferral] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const checks = useMemo(() => ({ length: form.password.length >= 8, letter: /[A-Za-z]/.test(form.password), number: /\d/.test(form.password) }), [form.password]);
  const strength = Object.values(checks).filter(Boolean).length;

  const update = (event) => {
    const { name, type, value, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : name === 'email' ? value.toLowerCase() : value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
    setServerError('');
  };
  const blur = (name) => {
    const next = {};
    if (['firstName', 'lastName'].includes(name) && !form[name].trim()) next[name] = `Enter your ${name === 'firstName' ? 'first' : 'last'} name.`;
    if (name === 'email' && !form.email.trim()) next.email = 'Enter your email address.';
    if (name === 'password' && (!checks.length || !checks.letter || !checks.number)) next.password = 'Use at least 8 characters with a letter and a number.';
    if (name === 'termsAccepted' && !form.termsAccepted) next.termsAccepted = 'Please accept the terms to continue.';
    setErrors((current) => ({ ...current, [name]: next[name] || '' }));
  };
  const submit = async (event) => {
    event.preventDefault();
    const next = {};
    if (!form.firstName.trim() || form.firstName.trim().length > 50) next.firstName = 'Enter a first name of 50 characters or fewer.';
    if (!form.lastName.trim() || form.lastName.trim().length > 50) next.lastName = 'Enter a last name of 50 characters or fewer.';
    if (!form.email.trim()) next.email = 'Enter your email address.';
    if (!checks.length || !checks.letter || !checks.number) next.password = 'Use at least 8 characters with a letter and a number.';
    if (!form.termsAccepted) next.termsAccepted = 'Please accept the terms to continue.';
    setErrors(next);
    if (Object.keys(next).length) return;
    setLoading(true);
    try {
      await register(form.email.trim(), form.password, form.firstName.trim(), form.lastName.trim(), form.isHost, form.dateOfBirth, form.referralCode.trim().toUpperCase());
      navigate(`/verify-email?email=${encodeURIComponent(form.email.trim())}`, { replace: true });
    } catch (requestError) {
      console.error('Signup failed', requestError);
      const status = requestError?.cause?.response?.status;
      setServerError(status === 409
        ? 'An account with this email already exists.'
        : status === 503
          ? 'We could not send the verification email. Check the email address and try again.'
          : 'We couldn’t create your account. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };
  const valueRows = [[Video, 'Live classes with real hosts, not pre-recorded playlists'], [CalendarClock, 'Pay only for the days you need — from $4.17/day'], [ShieldCheck, 'Secure payments via Stripe and Paystack']];
  return <main className="auth-page auth-page--split">
    <section className="auth-panel auth-panel--intro"><Link to="/" className="auth-brand"><span className="logo-mark" />EduTalk</Link><div className="auth-intro-copy"><h2>Learn on Your Terms. Pay for the Time You Need.</h2><div className="auth-value-list">{valueRows.map(([Icon, text]) => <div key={text}><span><Icon size={20} /></span><p>{text}</p></div>)}</div></div><p className="auth-intro-footer">© 2026 EduTalk</p><i className="auth-orb auth-orb--one" /><i className="auth-orb auth-orb--two" /></section>
    <section className="auth-panel auth-panel--form"><div className="auth-container"><div className="auth-form-heading"><h1>Create your account</h1><p>Start learning or teaching in under two minutes.</p></div><form className="auth-form" onSubmit={submit} noValidate>
      <div className="form-row"><div className="auth-field"><label htmlFor="signup-first-name">First name</label><input id="signup-first-name" name="firstName" maxLength={50} autoComplete="given-name" placeholder="Aisha" value={form.firstName} onChange={update} onBlur={() => blur('firstName')} aria-invalid={Boolean(errors.firstName)} />{errors.firstName && <em>{errors.firstName}</em>}</div><div className="auth-field"><label htmlFor="signup-last-name">Last name</label><input id="signup-last-name" name="lastName" maxLength={50} autoComplete="family-name" placeholder="Okafor" value={form.lastName} onChange={update} onBlur={() => blur('lastName')} aria-invalid={Boolean(errors.lastName)} />{errors.lastName && <em>{errors.lastName}</em>}</div></div>
      <div className="auth-field"><label htmlFor="signup-email">Email address</label><input id="signup-email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={update} onBlur={() => blur('email')} aria-invalid={Boolean(errors.email)} />{errors.email && <em>{errors.email}</em>}</div>
      <div className="auth-field"><label htmlFor="signup-password">Password</label><div className="password-input-wrapper"><input id="signup-password" name="password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={form.password} onChange={update} onBlur={() => blur('password')} aria-invalid={Boolean(errors.password)} /><button type="button" className="password-toggle" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div><div className="password-meter">{[1, 2, 3, 4].map((item) => <i key={item} className={strength >= item ? `strength-${strength}` : ''} />)}</div><div className="password-checklist">{[['length', '8+ characters'], ['letter', 'Contains a letter'], ['number', 'Contains a number']].map(([key, label]) => <span key={key} className={checks[key] ? 'is-met' : ''}>{checks[key] ? <Check size={14} /> : <i />}{label}</span>)}</div>{errors.password && <em>{errors.password}</em>}</div>
      <fieldset className="role-field"><legend>I want to join as</legend><div className="role-cards">{[[false, GraduationCap, 'Student', 'Learn live classes and pay only for the days you need'], [true, Presentation, 'Host', 'Teach live classes and earn from every enrollment']].map(([host, Icon, title, caption]) => <label key={title} className={`role-card${form.isHost === host ? ' is-selected' : ''}`}><input type="radio" name="role" checked={form.isHost === host} onChange={() => setForm((current) => ({ ...current, isHost: host }))} /><Icon size={20} /><strong>{title}</strong><small>{caption}</small>{form.isHost === host && <Check className="role-check" size={16} />}</label>)}</div></fieldset>
      {form.isHost && <div className="auth-field"><label htmlFor="signup-dob">Date of birth <span>(optional)</span></label><input id="signup-dob" type="date" name="dateOfBirth" autoComplete="bday" value={form.dateOfBirth} onChange={update} /><small>Hosts must be 18 or older.</small></div>}
      <div className="terms-field"><label><input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={update} onBlur={() => blur('termsAccepted')} /> <span>I agree to the <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.</span></label>{errors.termsAccepted && <em>{errors.termsAccepted}</em>}</div>
      <button type="button" className="referral-toggle" onClick={() => setShowReferral((value) => !value)}>Have a referral code?</button>{showReferral && <div className="auth-field"><label htmlFor="signup-referral">Referral code <span>(optional)</span></label><input id="signup-referral" name="referralCode" autoComplete="off" minLength={6} maxLength={12} pattern="[A-Za-z0-9]{6,12}" value={form.referralCode} onChange={update} /></div>}
      {serverError && <div className="error-message" role="alert">{serverError} {serverError.includes('already exists') && <Link to="/login">Sign in instead</Link>}</div>}
      <Button type="submit" disabled={loading} loading={loading}>{loading ? 'Creating account…' : <><UserPlus size={16} /> Create account</>}</Button>
    </form><p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p></div></section>
  </main>;
}
