import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Download, FileText, Trash2, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import { showToast } from '../utils/toastManager';
import Button from '../components/ui/Button';
import '../styles/HostOnboarding.css';

const LANGUAGES = ['English', 'French', 'Spanish', 'German', 'Arabic', 'Portuguese', 'Yoruba', 'Hausa'];
const CATEGORIES = ['Technology', 'Business', 'Design', 'Languages', 'Science', 'Arts', 'Marketing', 'Finance', 'Personal Development'];
const COUNTRIES = ['Nigeria', 'Ghana', 'United Kingdom', 'United States', 'Canada', 'South Africa'];
const empty = { displayName: '', headline: '', bio: '', experience: '', languages: [], categories: [], files: [], country: '', payoutMethod: '', deferred: false, commissionAccepted: false };

export default function HostOnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => JSON.parse(localStorage.getItem('edutalk-host-onboarding') || 'null') || { ...empty, displayName: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => localStorage.setItem('edutalk-host-onboarding', JSON.stringify(form)), [form]);
  const setField = (name, value) => { setForm((current) => ({ ...current, [name]: value })); setError(''); };
  const toggle = (name, value, max) => setField(name, form[name].includes(value) ? form[name].filter((item) => item !== value) : max && form[name].length >= max ? form[name] : [...form[name], value]);
  const valid = useMemo(() => {
    if (step === 1) return form.displayName.trim() && form.headline.trim() && form.bio.trim().length >= 100 && form.languages.length > 0;
    if (step === 2) return form.categories.length > 0 && form.categories.length <= 3;
    return form.country && (form.payoutMethod || form.deferred) && form.commissionAccepted;
  }, [form, step]);
  const validate = () => {
    if (!form.displayName.trim() || form.displayName.length > 60) return 'Enter a display name of 60 characters or fewer.';
    if (step === 1 && (!form.headline.trim() || form.headline.length > 80)) return 'Add a headline of 80 characters or fewer.';
    if (step === 1 && form.bio.trim().length < 100) return 'Your bio must be at least 100 characters.';
    if (step === 1 && !form.languages.length) return 'Select at least one language.';
    if (step === 2 && !form.categories.length) return 'Select at least one category.';
    if (step === 3 && !form.country) return 'Select your country of residence.';
    if (step === 3 && !form.payoutMethod && !form.deferred) return 'Choose a payout method or set up payout details later.';
    if (step === 3 && !form.commissionAccepted) return 'Please accept the commission terms to continue.';
    return '';
  };
  const saveStep = async (nextStep) => {
    const validation = validate();
    if (validation) return setError(validation);
    setError('');
    if (nextStep <= 3) return setStep(nextStep);
    setSaving(true);
    try {
      await api.patch('/auth/host-onboarding', { hostDisplayName: form.displayName.trim(), hostHeadline: form.headline.trim(), hostBio: form.bio.trim(), hostExperience: form.experience, hostLanguages: form.languages, hostCategories: form.categories, hostCredentials: form.files.map(({ name, size, type }) => ({ name, size, type })), payoutCountry: form.country, payoutMethod: form.payoutMethod, payoutDeferred: form.deferred, hostCommissionAccepted: form.commissionAccepted });
      localStorage.removeItem('edutalk-host-onboarding');
      showToast({ title: 'Your host profile is live', type: 'success' });
      navigate('/host-dashboard', { replace: true });
    } catch (requestError) {
      console.error('Host onboarding save failed', requestError);
      setError('We couldn’t save your host profile. Please try again.');
    } finally { setSaving(false); }
  };
  const addFiles = (event) => {
    const selected = Array.from(event.target.files || []);
    if (form.files.length + selected.length > 5) return setError('You can upload up to five files.');
    const validFiles = selected.filter((file) => ['application/pdf', 'image/jpeg', 'image/png'].includes(file.type) && file.size <= 10 * 1024 * 1024).map((file) => ({ name: file.name, size: file.size, type: file.type, status: 'uploaded' }));
    setField('files', [...form.files, ...validFiles]);
  };
  const title = ['Professional profile', 'Expertise & credentials', 'Payouts & review'][step - 1];
  return <main className="host-onboarding"><header className="host-onboarding-header"><div><p>Host onboarding</p><h1>{title}</h1></div><span>Step {step} of 3</span></header><div className="host-onboarding-progress"><i style={{ width: `${step * 33.333}%` }} /></div><div className="host-onboarding-layout"><section className="host-onboarding-main">
    {step === 1 && <><label className="host-field">Display name<input maxLength={60} value={form.displayName} onChange={(event) => setField('displayName', event.target.value)} /><small>This is the name students see on your class pages.</small></label><label className="host-field">Headline<input maxLength={80} placeholder="I teach conversational French for absolute beginners" value={form.headline} onChange={(event) => setField('headline', event.target.value)} /><small>{form.headline.length} / 80</small></label><label className="host-field">Bio<textarea rows={6} value={form.bio} onChange={(event) => setField('bio', event.target.value)} /><small className={form.bio.length >= 100 ? 'is-complete' : ''}>{form.bio.length >= 100 && <Check size={14} />}{form.bio.length} / 100 minimum</small></label><label className="host-field">Years of experience<select value={form.experience} onChange={(event) => setField('experience', event.target.value)}><option value="">Select experience</option>{['Less than 1 year', '1–3', '3–5', '5–10', '10+'].map((value) => <option key={value}>{value}</option>)}</select></label><div className="host-chip-field"><strong>Languages you speak</strong><div>{LANGUAGES.map((language) => <button type="button" className={form.languages.includes(language) ? 'is-selected' : ''} key={language} onClick={() => toggle('languages', language)}>{language}</button>)}</div></div></>}
    {step === 2 && <><div className="host-chip-field"><strong>Categories you teach</strong><small>Focus beats range — up to three.</small><div>{CATEGORIES.map((category) => <button type="button" className={form.categories.includes(category) ? 'is-selected' : ''} key={category} onClick={() => toggle('categories', category, 3)}>{category}</button>)}</div></div><div className="credential-upload"><strong>Certificates & credentials <span>(optional)</span></strong><button type="button" className="dropzone" onClick={() => fileRef.current?.click()}><UploadCloud size={24} /><b>Click to upload or drag and drop</b><small>PDF, JPG, or PNG — up to 10 MB each</small></button><input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple hidden onChange={addFiles} /><small>Official ID verification happens before your first payout — certificates are optional here.</small>{form.files.map((file, index) => <div className="credential-row" key={`${file.name}-${index}`}><FileText size={20} /><span><b>{file.name}</b><small>{(file.size / 1024 / 1024).toFixed(2)} MB</small></span><em><Check size={14} /> Uploaded</em><button type="button" aria-label={`Download ${file.name}`}><Download size={18} /></button><button type="button" aria-label={`Remove ${file.name}`} onClick={() => setField('files', form.files.filter((_, itemIndex) => itemIndex !== index))}><Trash2 size={18} /></button></div>)}</div></>}
    {step === 3 && <><label className="host-field">Country of residence<select value={form.country} onChange={(event) => setField('country', event.target.value)}><option value="">Select country</option>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}</select></label><div className="payout-field"><strong>Payout method</strong><div className="payout-cards">{[['Paystack', 'Bank transfer to Nigerian and Ghanaian accounts'], ['Stripe', 'Card payouts to a bank account']].map(([method, caption]) => <button type="button" className={form.payoutMethod === method ? 'is-selected' : ''} key={method} onClick={() => setForm((current) => ({ ...current, payoutMethod: method, deferred: false }))}><b>{method}</b><small>{caption}</small>{form.payoutMethod === method && <Check size={16} />}</button>)}</div><button type="button" className="later-link" onClick={() => setForm((current) => ({ ...current, payoutMethod: '', deferred: true }))}>Set up payout details later</button></div><div className="plan-review"><h2>Your plan</h2><p>Free plan — up to 3 classes, 25 students per class, 2 sessions per day</p><p>EduTalk keeps 25% of each paid enrollment</p><p>Payouts are released per transaction after a 1–3 day hold</p><a href="/host-plans">See all host plans</a></div><label className="commission-check"><input type="checkbox" checked={form.commissionAccepted} onChange={(event) => setField('commissionAccepted', event.target.checked)} /> <span>I understand EduTalk keeps a 25% commission on paid enrollments and that payouts are released per transaction after a 1–3 day hold.</span></label></>}
    {error && <div className="host-onboarding-error">{error}</div>}<div className="host-onboarding-actions">{step > 1 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}<Button onClick={() => saveStep(step === 3 ? 4 : step + 1)} disabled={!valid || saving} loading={saving}>{step === 3 ? 'Publish host profile' : 'Continue'}</Button></div>
  </section><aside className="host-summary"><h2>Your profile</h2>{[['Display name', form.displayName || '—'], ['Categories', form.categories.length ? form.categories.join(', ') : '—'], ['Languages', form.languages.length ? form.languages.join(', ') : '—'], ['Payout', form.payoutMethod || '—']].map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</aside></div></main>;
}
