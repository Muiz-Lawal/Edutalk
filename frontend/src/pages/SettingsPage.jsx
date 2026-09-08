import React, { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/SettingsPage.css';
import { CheckCircle2, Clock3, LockKeyhole, Moon, Sun, Monitor, XCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

const defaultNotifications = {
  paymentConfirmations: true, sessionReminders: true, subscriptionExpiry: true,
  achievementNotifications: true, classAnnouncements: true, marketingEmails: false,
};
const currencies = ['USD', 'GBP', 'EUR', 'NGN', 'INR', 'CAD', 'JPY', 'BRL', 'ZAR', 'GHS', 'KES', 'AUD'];

export default function SettingsPage() {
  const { user, loading, isAuthenticated, isHost, updateProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const sections = useMemo(() => [
    ['account', 'Account'], ['preferences', 'Preferences'], ['notifications', 'Notifications'],
    ['security', 'Security'], ...(isHost ? [['host', 'Payouts']] : []),
  ], [isHost]);
  const [active, setActive] = useState(location.hash.replace('#', '') || 'account');
  const [account, setAccount] = useState({});
  const [notifications, setNotifications] = useState(defaultNotifications);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || user?.theme || 'system');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [processors, setProcessors] = useState([]);
  const [processorLoading, setProcessorLoading] = useState(false);
  const [disconnecting, setDisconnecting] = useState(null);

  useEffect(() => {
    if (user) setAccount({
      firstName: user.firstName || '', lastName: user.lastName || '', bio: user.bio || '',
      timezone: user.timezone || '', preferredLanguage: user.preferredLanguage || 'en',
      preferredCurrency: user.preferredCurrency || 'USD',
    });
  }, [user]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem('theme') || user?.theme || 'system';
      const next = stored === 'dark' || stored === 'light' || stored === 'system' ? stored : 'system';
      setTheme(next);
      applyTheme(next);
    } catch { /* Storage can be unavailable in private browsing. */ }
  }, []);
  useEffect(() => {
    if (theme !== 'system' || !window.matchMedia) return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => applyTheme('system');
    media.addEventListener?.('change', onChange);
    return () => media.removeEventListener?.('change', onChange);
  }, [theme]);
  useEffect(() => {
    api.get('/user/email-preferences').then(({ data }) => setNotifications({ ...defaultNotifications, ...data })).catch(() => {});
  }, []);
  useEffect(() => {
    if (!sections.some(([id]) => id === active)) setActive('account');
  }, [active, sections]);
  useEffect(() => {
    if (active !== 'host') return;
    setProcessorLoading(true);
    api.get('/auth/payout-processors')
      .then(({ data }) => setProcessors(data.processors || []))
      .catch(() => showStatus('Unable to load payout settings. Please try again.'))
      .finally(() => setProcessorLoading(false));
  }, [active]);

  if (loading) return <div className="settings-page"><div className="async-skeleton async-skeleton--form" aria-hidden="true" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.isAdmin || user?.adminRole) return <Navigate to="/admin/settings" replace />;

  const selectSection = (id) => { setActive(id); navigate(`/dashboard/settings#${id}`, { replace: true }); };
  const showStatus = (message) => { setStatus(message); window.setTimeout(() => setStatus(''), 3500); };
  const saveAccount = async (event) => {
    event.preventDefault(); setSaving(true);
    try { await updateProfile(account); showStatus('Account details saved.'); }
    catch (error) { showStatus(error.response?.data?.message || 'Unable to save account details.'); }
    finally { setSaving(false); }
  };
  const saveNotifications = async () => {
    setSaving(true);
    try { await api.put('/user/email-preferences', notifications); showStatus('Notification preferences saved.'); }
    catch { showStatus('Unable to save notification preferences.'); }
    finally { setSaving(false); }
  };
  const applyTheme = (preference) => {
    const effective = preference === 'system'
      ? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : preference;
    document.documentElement.dataset.theme = effective;
    document.documentElement.dataset.themePreference = preference;
  };
  const changeTheme = (next) => {
    setTheme(next);
    applyTheme(next);
    try { localStorage.setItem('theme', next); } catch { /* Ignore unavailable storage. */ }
    updateProfile({ theme: next }).catch(() => {});
  };
  const changePassword = async (event) => {
    event.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return showStatus('New passwords do not match.');
    setSaving(true);
    try { await api.post('/auth/change-password', passwords); setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' }); showStatus('Password changed successfully.'); }
    catch (error) { showStatus(error.response?.data?.message || 'Unable to change password.'); }
    finally { setSaving(false); }
  };
  const updateField = (key, value) => setAccount((previous) => ({ ...previous, [key]: value }));
  const updateProcessor = async (provider, action) => {
    setProcessorLoading(true);
    try {
      const response = action === 'disconnect'
        ? await api.delete(`/auth/payout-processors/${provider}`)
        : await api.post('/auth/payout-processors/connect', { provider });
      setProcessors((current) => current.map((item) => item.provider === provider ? response.data.processor : item));
      showStatus(action === 'disconnect' ? `${provider} disconnected.` : 'Verification started.');
    } catch {
      showStatus('Unable to update payout settings. Please try again.');
    } finally { setProcessorLoading(false); }
  };
  const processorIcon = (statusValue) => statusValue === 'active' ? <CheckCircle2 size={17} /> : statusValue === 'pending' ? <Clock3 size={17} /> : statusValue === 'rejected' ? <XCircle size={17} /> : null;
  const notificationLabels = {
    paymentConfirmations: ['Payment confirmations', 'Receipts and payment status updates'],
    sessionReminders: ['Session reminders', 'Upcoming class and session reminders'],
    subscriptionExpiry: ['Subscription expiry', 'Warnings before access expires'],
    achievementNotifications: ['Achievements', 'Badges, milestones, and progress updates'],
    classAnnouncements: ['Class announcements', 'Important updates from your classes'],
    marketingEmails: ['Marketing emails', 'News, promotions, and feature announcements'],
  };

  return <main className="settings-page">
    <div className="settings-header"><div><p className="eyebrow">Dashboard</p><h1>Settings</h1><p>Manage your account, preferences, and security.</p></div></div>
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Settings sections">
        {sections.map(([id, label]) => <button key={id} className={active === id ? 'active' : ''} onClick={() => selectSection(id)}>{label}</button>)}
      </nav>
      <div className="settings-content">
        {status && <div className="settings-status" role="status">{status}</div>}
        {active === 'account' && <section className="settings-card"><h2>Account</h2><p className="muted">Your personal details are visible on your profile.</p><form onSubmit={saveAccount} className="settings-form">
          <div className="form-grid"><label>First name<input value={account.firstName || ''} onChange={(e) => updateField('firstName', e.target.value)} required /></label><label>Last name<input value={account.lastName || ''} onChange={(e) => updateField('lastName', e.target.value)} required /></label></div>
          <label>Email<input value={user.email || ''} disabled /></label><label>Bio<textarea rows="4" value={account.bio || ''} onChange={(e) => updateField('bio', e.target.value)} maxLength="500" /></label>
          <Button disabled={saving} loading={saving}>Save account</Button>
        </form></section>}
        {active === 'preferences' && <section className="settings-card"><h2>Preferences</h2><p className="muted">Customize how EduTalk works for you.</p><div className="settings-form"><label>Language<select value={account.preferredLanguage || 'en'} onChange={(e) => updateField('preferredLanguage', e.target.value)}><option value="en">English</option><option value="es">Español</option><option value="fr">Français</option><option value="de">Deutsch</option></select></label><label>Currency<select value={account.preferredCurrency || 'USD'} onChange={(e) => updateField('preferredCurrency', e.target.value)}>{currencies.map((currency) => <option key={currency}>{currency}</option>)}</select></label><label>Timezone<input value={account.timezone || ''} placeholder="e.g. Europe/London" onChange={(e) => updateField('timezone', e.target.value)} /></label><Button onClick={saveAccount} disabled={saving} loading={saving}>Save preferences</Button><div className="theme-choice"><strong>Theme</strong><div><button type="button" className={theme === 'light' ? 'selected' : ''} onClick={() => changeTheme('light')}><Sun size={15} /> Light</button><button type="button" className={theme === 'dark' ? 'selected' : ''} onClick={() => changeTheme('dark')}><Moon size={15} /> Dark</button><button type="button" className={theme === 'system' ? 'selected' : ''} onClick={() => changeTheme('system')}><Monitor size={15} /> System</button></div></div></div></section>}
        {active === 'notifications' && <section className="settings-card" id="notifications"><h2>Notifications</h2><p className="muted">Choose which email updates you receive.</p><div className="notification-list">{Object.entries(notificationLabels).map(([key, [title, description]]) => <label className="notification-row" key={key}><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={Boolean(notifications[key])} onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })} /></label>)}{[['security', 'Security notices'], ['payment', 'Payment notices'], ['moderation', 'Moderation notices']].map(([key, title]) => <label className="notification-row" key={key}><span><strong>{title}</strong><small><LockKeyhole size={13} /> Required for your security</small></span><input type="checkbox" checked readOnly disabled /></label>)}</div><Button onClick={saveNotifications} disabled={saving} loading={saving}>Save notifications</Button></section>}
        {active === 'security' && <section className="settings-card"><h2>Security</h2><p className="muted">Keep your account protected with a strong password.</p><form onSubmit={changePassword} className="settings-form"><label>Current password<input type="password" value={passwords.currentPassword} onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })} required /></label><label>New password<input type="password" minLength="8" value={passwords.newPassword} onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })} required /></label><label>Confirm new password<input type="password" value={passwords.confirmPassword} onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })} required /></label><Button type="submit" disabled={saving} loading={saving}><LockKeyhole size={16} /> Change password</Button></form><div className="security-note">Two-factor authentication is available for admin accounts. Contact support if you need help securing your account.</div></section>}
        {active === 'host' && <><section className="settings-card"><h2>Payouts</h2><p className="muted">Connect one or both processors. EduTalk automatically routes each enrollment by currency.</p>{processorLoading && !processors.length ? <div className="async-skeleton async-skeleton--form" aria-label="Loading payout settings" /> : <div className="processor-list">{processors.map((processor) => <article className="processor-card" key={processor.provider}><div className="processor-card__header"><div><h3>{processor.provider === 'paystack' ? 'Paystack' : 'Stripe'}</h3><div className="currency-chips">{(processor.currencies || []).map((currency) => <span key={currency}>{currency}</span>)}</div></div><span className={`processor-status processor-status--${processor.status}`}>{processorIcon(processor.status)}{processor.status === 'active' ? 'Active' : processor.status === 'pending' ? 'Verification in progress' : processor.status === 'action_required' ? 'Action required' : processor.status === 'rejected' ? 'Verification rejected' : 'Not connected'}</span></div>{processor.accountLegalName && <p className="processor-legal-name">{processor.accountLegalName}</p>}{processor.statusReason && <div className="processor-warning">{processor.statusReason}</div>}<div className="processor-actions">{processor.status === 'active' ? <button className="processor-outline" onClick={() => setDisconnecting(processor)}>Disconnect</button> : <button className="primary" disabled={processorLoading} onClick={() => updateProcessor(processor.provider, 'connect')}>{processor.status === 'action_required' ? 'Continue setup' : processor.status === 'rejected' ? 'Restart verification' : `Connect ${processor.provider === 'paystack' ? 'Paystack' : 'Stripe'}`}</button>}</div></article>)}</div>}</section>{disconnecting && <Modal open title={`Disconnect ${disconnecting.provider === 'paystack' ? 'Paystack' : 'Stripe'}?`} onClose={() => setDisconnecting(null)}><p>Students paying in {(disconnecting.currencies || []).join(', ')} will no longer be able to enroll.</p><div className="processor-actions"><button className="processor-outline" onClick={() => setDisconnecting(null)}>Cancel</button><button className="primary" onClick={() => { updateProcessor(disconnecting.provider, 'disconnect'); setDisconnecting(null); }}>Disconnect</button></div></Modal>}</>}
      </div>
    </div>
  </main>;
}
