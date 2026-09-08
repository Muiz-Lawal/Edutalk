import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import '../styles/Auth.css';

export default function LegalPage() {
  const { pathname } = useLocation();
  const isTerms = pathname === '/terms';
  return <main className="auth-page auth-page--single"><section className="auth-panel auth-panel--form"><article className="auth-container legal-page"><Link to="/signup" className="auth-brand"><span className="logo-mark" />EduTalk</Link><h1>{isTerms ? 'Terms of Service' : 'Privacy Policy'}</h1><p>{isTerms ? 'These terms explain the rules for using EduTalk classes and services.' : 'This policy explains how EduTalk uses information to provide secure learning services.'}</p><Link to="/signup">Back to account creation</Link></article></section></main>;
}
