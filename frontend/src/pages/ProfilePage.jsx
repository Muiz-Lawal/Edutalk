import React, { useMemo, useRef, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';
import { Camera, Flame } from 'lucide-react';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import AsyncBoundary from '../components/AsyncBoundary';

const CATEGORIES = ['Technology', 'Business', 'Design', 'Languages', 'Science', 'Arts', 'Marketing', 'Finance', 'Personal Development'];
const CURRENCIES = ['USD', 'GBP', 'EUR', 'NGN', 'INR', 'CAD', 'JPY', 'BRL', 'ZAR', 'GHS', 'KES', 'AUD'];
const LANGUAGES = [['en', 'English'], ['fr', 'French'], ['es', 'Spanish'], ['de', 'German'], ['zh', 'Chinese'], ['ar', 'Arabic']];
const initialsFor = (user) => `${user?.firstName?.[0] || ''}${user?.lastName?.[0] || ''}`.toUpperCase() || 'U';

export default function ProfilePage() {
  const { user, loading, isAuthenticated, updateProfile } = useAuth();
  const [form, setForm] = useState({});
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);
  const values = { firstName: user?.firstName || '', lastName: user?.lastName || '', bio: user?.bio || '', timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone, preferredCurrency: user?.preferredCurrency || 'NGN', preferredLanguage: user?.preferredLanguage || 'en', interests: user?.interests || [], ...form };
  const completion = useMemo(() => [values.bio, values.interests.length, values.timezone, user?.profileImage, user?.phoneVerified].reduce((total, value, index) => total + (value ? [20, 20, 10, 20, 30][index] : 0), 0), [values, user]);
  const dirty = Object.keys(form).length > 0;
  const setField = (key, value) => { setForm((current) => ({ ...current, [key]: value })); setSaved(false); };
  const save = async (event) => {
    event.preventDefault();
    if (!values.firstName.trim()) return setError('Full name is required.');
    if (values.bio.length > 280) return setError('Bio must be 280 characters or fewer.');
    if (!values.interests.length) return setError('Select at least one learning interest.');
    setError('');
    try { await updateProfile(values); setForm({}); setSaved(true); } catch (saveError) { setError(saveError.response?.data?.message || 'Unable to save your profile.'); }
  };
  const choosePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/') || file.size > 2 * 1024 * 1024) return setError('Choose an image up to 2MB.');
    const reader = new FileReader();
    reader.onload = () => setField('profileImage', reader.result);
    reader.readAsDataURL(file);
  };
  if (loading) return <main className="profile-page"><AsyncBoundary loading loadingVariant="form" /></main>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <main className="profile-page"><div className="profile-cover"><button type="button" className="profile-avatar-edit" onClick={() => fileRef.current?.click()}>{values.profileImage || user?.profileImage ? <img src={values.profileImage || user.profileImage} alt="" /> : initialsFor(user)}<span><Camera size={12} /> Edit photo</span></button><input ref={fileRef} type="file" accept="image/*" onChange={choosePhoto} hidden /><h1>{values.firstName} {values.lastName}</h1><p>{user?.email} <Badge variant={user?.emailPreferences?.emailVerified ? 'success' : 'warning'}>{user?.emailPreferences?.emailVerified ? 'Verified' : 'Unverified'}</Badge></p><small>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'} · {values.timezone}</small></div>
    <section className="profile-completion"><strong>PROFILE COMPLETION</strong><div className="meter"><span style={{ width: `${completion}%` }} /></div><small>{completion}% complete · Add your interests to get better class recommendations</small></section>
    <section className="profile-stats"><div>Classes enrolled<strong>0</strong></div><div>Sessions attended<strong>0</strong></div><div>Current streak<strong><Flame size={16} /> 0</strong></div><div>Badge points<strong>{user?.points || 0}</strong></div><Link to="/achievements">Badges unlocked<strong>0/12</strong></Link></section>
    <form className="profile-form" onSubmit={save}><h2>About you</h2><div className="profile-grid"><label>Full name<input value={`${values.firstName} ${values.lastName}`.trim()} onChange={(e) => { const [firstName, ...rest] = e.target.value.split(' '); setField('firstName', firstName); setField('lastName', rest.join(' ')); }} required /></label><label>Timezone<select value={values.timezone} onChange={(e) => setField('timezone', e.target.value)}><option value={values.timezone}>{values.timezone}</option><option value="UTC">UTC</option><option value="Africa/Lagos">Africa/Lagos</option><option value="Europe/London">Europe/London</option><option value="America/New_York">America/New_York</option></select></label><label className="wide">Bio<textarea maxLength="280" value={values.bio} onChange={(e) => setField('bio', e.target.value)} /><small>{values.bio.length}/280</small></label><label>Preferred currency<select value={values.preferredCurrency} onChange={(e) => setField('preferredCurrency', e.target.value)}>{CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}</select></label><label>Preferred language<select value={values.preferredLanguage} onChange={(e) => setField('preferredLanguage', e.target.value)}>{LANGUAGES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}</select></label></div><h3>Learning interests</h3><div className="interest-chips">{CATEGORIES.map((category) => <button type="button" key={category} className={values.interests.includes(category) ? 'selected' : ''} onClick={() => setField('interests', values.interests.includes(category) ? values.interests.filter((item) => item !== category) : [...values.interests, category])}>{category}</button>)}</div>{error && <p className="profile-error">{error}</p>}{saved && <p className="profile-success">Profile saved.</p>}<Button disabled={!dirty} type="submit">Save changes</Button></form>
    <section className="profile-access"><h2>Access codes</h2><p>No active classes yet — your access codes will appear here.</p></section><section className="profile-access"><h2>Badges</h2><p>Unlock badges as you learn. <Link to="/achievements">View all</Link></p></section>
  </main>;
}
