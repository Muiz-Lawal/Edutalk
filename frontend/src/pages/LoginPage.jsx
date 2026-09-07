import React, { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.css';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (isAuthenticated && (user?.isAdmin || user?.adminRole)) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      navigate(loggedInUser?.isAdmin || loggedInUser?.adminRole ? '/admin/dashboard' : '/dashboard', { replace: true });
    } catch (requestError) {
      console.error('Login failed', requestError);
      setError('We couldn’t sign you in. Check your email and password, then try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page auth-page--split">
      <section className="auth-panel auth-panel--intro">
        <Link to="/" className="auth-brand"><span className="logo-mark" aria-hidden="true" />EduTalk</Link>
        <div className="auth-intro-copy"><p className="auth-eyebrow">Welcome back</p><h1>Keep your learning moving forward.</h1><p>Sign in to return to your classes, track progress, and stay connected with your hosts.</p></div>
        <p className="auth-intro-footer">Your learning space is ready when you are.</p>
      </section>
      <section className="auth-panel auth-panel--form">
        <div className="auth-container">
          <div className="auth-form-heading"><h2>Sign in to EduTalk</h2><p>Enter your details to continue.</p></div>
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className={`auth-field${error ? '' : ''}`}><label htmlFor="login-email">Email address</label><input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></div>
            <div className="auth-field"><div className="auth-label-row"><label htmlFor="login-password">Password</label><Link to="/forgot-password">Forgot password?</Link></div><div className="password-input-wrapper"><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required /><button type="button" className="password-toggle" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div></div>
            {error && <div className="error-message" role="alert">{error}</div>}
            <Button type="submit" disabled={loading} loading={loading}>{loading ? 'Verifying…' : <><LogIn size={16} /> Sign in</>}</Button>
          </form>
          <p className="auth-footer">Don’t have an account? <Link to="/signup">Create one</Link></p>
        </div>
      </section>
    </main>
  );
}
