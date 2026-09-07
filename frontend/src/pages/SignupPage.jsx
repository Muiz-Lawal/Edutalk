import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.css';
import { ArrowLeft, ArrowRight, Eye, EyeOff, UserPlus } from 'lucide-react';
import Button from '../components/ui/Button';

const initialForm = {
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  dateOfBirth: '',
  isHost: false,
};

export default function SignupPage() {
  const [formData, setFormData] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: '' }));
    if (serverError) setServerError('');
  };

  const validateStep = (currentStep) => {
    const nextErrors = {};
    if (currentStep === 1) {
      if (!formData.email.trim()) nextErrors.email = 'Enter your email address.';
      if (formData.password.length < 8) nextErrors.password = 'Use at least 8 characters.';
      if (!formData.confirmPassword) nextErrors.confirmPassword = 'Confirm your password.';
      else if (formData.password !== formData.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match.';
    } else {
      if (!formData.firstName.trim()) nextErrors.firstName = 'Enter your first name.';
      if (!formData.lastName.trim()) nextErrors.lastName = 'Enter your last name.';
      if (formData.isHost && !formData.dateOfBirth) nextErrors.dateOfBirth = 'Enter your date of birth to continue.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleBlur = (event) => {
    const { name } = event.target;
    const fieldErrors = {};
    if (name === 'email' && !formData.email.trim()) fieldErrors.email = 'Enter your email address.';
    if (name === 'password' && formData.password.length < 8) fieldErrors.password = 'Use at least 8 characters.';
    if (name === 'confirmPassword' && formData.password !== formData.confirmPassword) fieldErrors.confirmPassword = 'Passwords do not match.';
    if (name === 'firstName' && !formData.firstName.trim()) fieldErrors.firstName = 'Enter your first name.';
    if (name === 'lastName' && !formData.lastName.trim()) fieldErrors.lastName = 'Enter your last name.';
    setErrors((current) => ({ ...current, ...fieldErrors, [name]: fieldErrors[name] || '' }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (step === 1) {
      if (validateStep(1)) setStep(2);
      return;
    }
    if (!validateStep(2)) return;
    if (formData.isHost) {
      const birthDate = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1;
      if (age < 18) {
        setErrors({ dateOfBirth: 'You must be 18 or older to teach on EduTalk.' });
        return;
      }
    }
    setLoading(true);
    setServerError('');
    try {
      await register(formData.email, formData.password, formData.firstName, formData.lastName, formData.isHost, formData.dateOfBirth);
      navigate('/dashboard');
    } catch (requestError) {
      console.error('Signup failed', requestError);
      setServerError('We couldn’t create your account. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) => `auth-field${errors[name] ? ' has-error' : ''}`;

  return (
    <main className="auth-page auth-page--split">
      <section className="auth-panel auth-panel--intro">
        <Link to="/" className="auth-brand"><span className="logo-mark" aria-hidden="true" />EduTalk</Link>
        <div className="auth-intro-copy">
          <p className="auth-eyebrow">Learn and teach together</p>
          <h1>Build momentum with every lesson.</h1>
          <p>Join a focused learning community where expert hosts and curious students grow together.</p>
        </div>
        <p className="auth-intro-footer">Secure, flexible learning for every stage.</p>
      </section>
      <section className="auth-panel auth-panel--form">
        <div className="auth-container">
          <div className="auth-form-heading">
            <p className="auth-step">Step {step} of 2</p>
            <h2>{step === 1 ? 'Create your account' : 'Tell us about you'}</h2>
            <p>{step === 1 ? 'Use your email to get started.' : 'Set up your profile so EduTalk can personalize your experience.'}</p>
          </div>
          <div className="auth-progress" aria-label={`Signup step ${step} of 2`}><span style={{ width: `${step === 1 ? 50 : 100}%` }} /></div>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {step === 1 ? (
              <>
                <div className={fieldClass('email')}><label htmlFor="signup-email">Email address</label><input id="signup-email" type="email" name="email" autoComplete="email" value={formData.email} onChange={updateField} onBlur={handleBlur} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'signup-email-error' : 'signup-email-help'} /><small id="signup-email-help">We’ll use this to secure your account.</small>{errors.email && <em id="signup-email-error">{errors.email}</em>}</div>
                <div className={fieldClass('password')}><label htmlFor="signup-password">Password</label><div className="password-input-wrapper"><input id="signup-password" type={showPassword ? 'text' : 'password'} name="password" autoComplete="new-password" value={formData.password} onChange={updateField} onBlur={handleBlur} aria-invalid={Boolean(errors.password)} /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><small>At least 8 characters.</small>{errors.password && <em>{errors.password}</em>}</div>
                <div className={fieldClass('confirmPassword')}><label htmlFor="signup-confirm-password">Confirm password</label><div className="password-input-wrapper"><input id="signup-confirm-password" type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" autoComplete="new-password" value={formData.confirmPassword} onChange={updateField} onBlur={handleBlur} aria-invalid={Boolean(errors.confirmPassword)} /><button type="button" className="password-toggle" onClick={() => setShowConfirmPassword((visible) => !visible)} aria-label={showConfirmPassword ? 'Hide confirmation password' : 'Show confirmation password'}>{showConfirmPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>{errors.confirmPassword && <em>{errors.confirmPassword}</em>}</div>
              </>
            ) : (
              <>
                <div className="form-row"><div className={fieldClass('firstName')}><label htmlFor="signup-first-name">First name</label><input id="signup-first-name" type="text" name="firstName" autoComplete="given-name" value={formData.firstName} onChange={updateField} onBlur={handleBlur} aria-invalid={Boolean(errors.firstName)} />{errors.firstName && <em>{errors.firstName}</em>}</div><div className={fieldClass('lastName')}><label htmlFor="signup-last-name">Last name</label><input id="signup-last-name" type="text" name="lastName" autoComplete="family-name" value={formData.lastName} onChange={updateField} onBlur={handleBlur} aria-invalid={Boolean(errors.lastName)} />{errors.lastName && <em>{errors.lastName}</em>}</div></div>
                <div className={fieldClass('dateOfBirth')}><label htmlFor="signup-dob">Date of birth <span>(optional)</span></label><input id="signup-dob" type="date" name="dateOfBirth" autoComplete="bday" value={formData.dateOfBirth} onChange={updateField} onBlur={handleBlur} aria-invalid={Boolean(errors.dateOfBirth)} /><small>Required only if you choose to teach classes.</small>{errors.dateOfBirth && <em>{errors.dateOfBirth}</em>}</div>
                <label className="auth-check-row" htmlFor="signup-host"><input id="signup-host" type="checkbox" name="isHost" checked={formData.isHost} onChange={updateField} /><span><strong>I want to teach classes</strong><small>Hosts must be 18 or older.</small></span></label>
              </>
            )}
            {serverError && <div className="error-message" role="alert">{serverError}</div>}
            <div className="auth-form-actions">{step === 2 && <Button type="button" variant="secondary" onClick={() => { setStep(1); setServerError(''); }}><ArrowLeft size={16} /> Back</Button>}<Button type="submit" disabled={loading} loading={loading}>{loading ? 'Creating account…' : step === 1 ? <>Continue <ArrowRight size={16} /></> : <><UserPlus size={16} /> Create account</>}</Button></div>
          </form>
          <p className="auth-footer">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </section>
    </main>
  );
}
