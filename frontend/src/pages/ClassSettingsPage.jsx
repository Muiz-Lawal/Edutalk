import React, { useEffect, useMemo, useState } from 'react';
import { Archive, ArrowLeft, Check, Copy, ExternalLink, Link as LinkIcon, Lock, MonitorPlay, Save } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { fromZonedTime } from 'date-fns-tz';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import '../styles/ClassSettingsPage.css';
import { createLqip, processImage } from '../utils/imageProcessing';
import AsyncBoundary from '../components/AsyncBoundary';
import LockedFeatureCard from '../components/ui/LockedFeatureCard';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const categories = ['Technology', 'Music', 'Business', 'Design', 'Languages', 'Fitness', 'Science', 'Arts', 'Cooking', 'Photography'];
const zones = ['UTC', 'Africa/Lagos', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo'];
const appearancePalette = ['#4F46E5', '#7C3AED', '#059669', '#D97706', '#E11D48', '#0891B2', '#475569', '#2563EB'];

export default function ClassSettingsPage() {
  const { classId } = useParams();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [form, setForm] = useState(null);
  const [section, setSection] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const [hostRecordings, setHostRecordings] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [sessions, setSessions] = useState([]);
  const [bonusDate, setBonusDate] = useState('');
  const [bonusTime, setBonusTime] = useState('16:00');
  const [bonusDuration, setBonusDuration] = useState(60);
  const [hostContext, setHostContext] = useState(null);

  useEffect(() => {
    api.get('/me/host-context').then(({ data }) => setHostContext(data)).catch(() => {
      setHostContext({ tier: classData?.hostId?.planTier || 'starter', features: { builtinVideo: 'off', recording: 'off', recordingAutoShare: 'off' }, subscribers: 0, nextThreshold: 23 });
    });
  }, [classId, classData?.hostId?.planTier]);

  const currentTier = hostContext?.tier || classData?.hostId?.planTier || 'starter';
  const builtinUnlocked = hostContext?.features?.builtinVideo === 'on' || currentTier !== 'starter';

  useEffect(() => {
    setClassData(null);
    setForm(null);
    setNotFound(false);
    setError('');
    setLoading(true);
    api.get(`/classes/manage/${classId}`).then(({ data }) => {
      setClassData(data);
      setForm({
        title: data.title || '', description: data.description || '', category: data.category || '',
        tags: (data.tags || []).join(', '), monthlyPrice: data.monthlyPrice, minPurchaseDays: data.minPurchaseDays || 1,
        maxStudents: data.maxStudents || '', isPublic: data.isPublic !== false, status: data.status || 'active',
        videoMode: data.videoMode || 'external', externalVideoLink: data.externalVideoLink || '',
        timezone: data.timezone || 'UTC', schedule: data.schedule || [],
        vacationStart: data.vacationMode?.startDate ? data.vacationMode.startDate.slice(0, 10) : '',
        vacationEnd: data.vacationMode?.endDate ? data.vacationMode.endDate.slice(0, 10) : '',
        vacationActive: Boolean(data.vacationMode?.active),
        appearance: data.appearance || {},
        recordingSettings: data.recordingSettings || { mode: 'auto', releasePolicy: 'immediate', retentionDays: 30, watermarkOverlayEnabled: true },
      });
    }).catch((requestError) => {
      console.error('Failed to load class settings', requestError);
      if (requestError.status === 404) setNotFound(true);
      else setError('We couldn’t load your class settings.');
    })
      .finally(() => setLoading(false));
  }, [classId, reloadKey]);

  useEffect(() => {
    if (section !== 'recordings') return;
    api.get(`/recordings/class/${classId}`).then(({ data }) => setHostRecordings(data.recordings || [])).catch(() => {});
  }, [classId, section]);

  useEffect(() => {
    if (section !== 'schedule') return;
    api.get(`/classes/${classId}/sessions`).then(({ data }) => setSessions(Array.isArray(data) ? data : [])).catch((requestError) => console.error('Failed to load sessions', requestError));
  }, [classId, section]);

  const dirty = useMemo(() => {
    if (!classData || !form) return false;
    const current = {
      title: form.title,
      description: form.description,
      category: form.category,
      tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      monthlyPrice: Number(form.monthlyPrice),
      minPurchaseDays: Number(form.minPurchaseDays),
      maxStudents: form.maxStudents ? Number(form.maxStudents) : null,
      isPublic: form.isPublic,
      status: form.status,
      videoMode: form.videoMode,
      externalVideoLink: form.externalVideoLink,
      timezone: form.timezone,
      schedule: form.schedule,
      appearance: form.appearance,
    };
    const saved = {
      title: classData.title || '',
      description: classData.description || '',
      category: classData.category || '',
      tags: classData.tags || [],
      monthlyPrice: Number(classData.monthlyPrice),
      minPurchaseDays: Number(classData.minPurchaseDays || 1),
      maxStudents: classData.maxStudents || null,
      isPublic: classData.isPublic !== false,
      status: classData.status || 'active',
      videoMode: classData.videoMode || 'external',
      externalVideoLink: classData.externalVideoLink || '',
      timezone: classData.timezone || 'UTC',
      schedule: classData.schedule || [],
      appearance: classData.appearance || {},
    };
    return JSON.stringify(current) !== JSON.stringify(saved);
  }, [classData, form]);
  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const updateSchedule = (index, name, value) => setForm((current) => ({ ...current, schedule: current.schedule.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item) }));
  const addBonusSession = async (event) => {
    event.preventDefault();
    if (!bonusDate || !form) return;
    const timezone = form.timezone || 'UTC';
    const startUtc = fromZonedTime(`${bonusDate}T${bonusTime}:00`, timezone).toISOString();
    const { data } = await api.post(`/classes/${classId}/sessions`, { startUtc, durationMinutes: Number(bonusDuration), timezone });
    setSessions((current) => [...current, data].sort((a, b) => a.scheduledStartTime.localeCompare(b.scheduledStartTime)));
    setBonusDate('');
  };
  const cancelSession = async (sessionId) => {
    await api.post(`/classes/sessions/${sessionId}/cancel`, { reason: 'Cancelled by host' });
    setSessions((current) => current.map((session) => session._id === sessionId ? { ...session, status: 'cancelled' } : session));
  };
  const readImage = async (event, field) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const limits = { thumbnailImage: 5, bannerImage: 8, hostLogo: 4, gallery: 4 };
    if (!file.type.startsWith('image/') || file.size > limits[field] * 1024 * 1024) {
      setError(`${field === 'thumbnailImage' ? 'Thumbnail' : field === 'bannerImage' ? 'Banner' : 'Host logo'} must be an image under ${limits[field]}MB.`);
      return;
    }
    try {
      const ratios = { thumbnailImage: 16 / 9, bannerImage: 21 / 9, hostLogo: 1, gallery: 4 / 3 };
      const widths = { thumbnailImage: 1280, bannerImage: 1920, hostLogo: 512, gallery: 1200 };
      const processed = await processImage(file, ratios[field], widths[field]);
      setError('');
      setForm((current) => {
        const appearance = { ...current.appearance };
        if (field === 'gallery') {
          const gallery = Array.isArray(appearance.gallery) ? appearance.gallery : [];
          if (gallery.length >= 6) return current;
          appearance.gallery = [...gallery, { url: processed.url, caption: '' }];
        } else {
          appearance[field] = processed.url;
          if (field === 'bannerImage') appearance.bannerLqip = createLqip(processed.url);
        }
        return { ...current, appearance };
      });
    } catch (processingError) {
      setError(processingError.message);
    }
  };
  const updateAppearance = (updates) => setForm((current) => ({ ...current, appearance: { ...current.appearance, ...updates } }));
  const updateGalleryItem = (index, updates) => setForm((current) => ({ ...current, appearance: { ...current.appearance, gallery: current.appearance.gallery.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item) } }));
  const removeGalleryItem = (index) => setForm((current) => ({ ...current, appearance: { ...current.appearance, gallery: current.appearance.gallery.filter((_, itemIndex) => itemIndex !== index) } }));

  const save = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const payload = { ...form, tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean), monthlyPrice: Number(form.monthlyPrice), maxStudents: form.maxStudents ? Number(form.maxStudents) : null };
      const { data } = await api.put(`/classes/${classId}`, payload);
      setClassData(data.class); setForm((current) => ({ ...current, ...data.class, tags: (data.class.tags || []).join(', ') })); setMessage('Settings saved.');
    } catch (requestError) { console.error('Failed to save class settings', requestError); setError('Unable to save settings.'); } finally { setSaving(false); }
  };
  const changePrice = async () => {
    setSaving(true); setError(''); setMessage('');
    try { const { data } = await api.post(`/classes/manage/${classId}/price`, { monthlyPrice: Number(form.monthlyPrice) }); setClassData(data.class); setMessage(data.message); }
    catch (requestError) { setError(requestError.response?.data?.message || 'Unable to update price.'); } finally { setSaving(false); }
  };
  const duplicate = async () => { const { data } = await api.post(`/classes/manage/${classId}/duplicate`); setMessage('Draft duplicated.'); navigate(`/host/classes/${data.class._id}`); };
  const archive = async () => { if (!window.confirm('Archive this class? Existing students keep access until expiry.')) return; const { data } = await api.post(`/classes/manage/${classId}/archive`); setClassData(data.class); setMessage('Class archived.'); };
  const updateVacation = async (active) => {
    setSaving(true); setError(''); setMessage('');
    try {
      const { data } = await api.post(`/classes/manage/${classId}/vacation`, {
        active,
        startDate: form.vacationStart,
        endDate: form.vacationEnd,
      });
      setClassData(data.class);
      setForm((current) => ({ ...current, vacationActive: Boolean(data.class.vacationMode?.active) }));
      setMessage(data.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update vacation mode.');
    } finally { setSaving(false); }
  };
  const saveRecordingSettings = async () => {
    setSaving(true); setError(''); setMessage('');
    try {
      const { data } = await api.put(`/recordings/class/${classId}/settings`, form.recordingSettings);
      setForm((current) => ({ ...current, recordingSettings: data.settings }));
      setClassData((current) => ({ ...current, recordingSettings: data.settings }));
      setMessage('Recording settings saved.');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save recording settings.');
    } finally { setSaving(false); }
  };
  const toggleRecordingVisibility = async (recordingId, visible) => {
    try {
      const { data } = await api.patch(`/recordings/${recordingId}/visibility`, { visible });
      setHostRecordings((current) => current.map((recording) => recording.id === recordingId ? data.recording : recording));
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update recording visibility.');
    }
  };

  const retryLoad = () => { setError(''); setNotFound(false); setReloadKey((key) => key + 1); };
  if (loading) return <main className="class-settings-page"><AsyncBoundary loading loadingFallback={<div className="class-settings-loading"><div className="class-settings-loading__nav"><span /><span /><span /><span /><span /></div><div className="class-settings-loading__form"><span /><span /><span /><span /><span /><span /></div></div>} /></main>;
  if (notFound) return <main className="class-settings-page"><AsyncBoundary empty emptyMessage="This class doesn’t exist or you don’t have access." emptyAction={<Link className="class-settings-empty-link" to="/host-dashboard">← Back to My Teaching</Link>} /></main>;
  if (error && !form) return <main className="class-settings-page"><AsyncBoundary error errorMessage="We couldn’t load your class settings" errorDetail="Check your connection and try again." onRetry={retryLoad} onBack={() => navigate('/host-dashboard')} /></main>;
  const priceLocked = classData.lastPriceChangeAt && Date.now() - new Date(classData.lastPriceChangeAt).getTime() < 30 * 86400000;
  return <main className="class-settings-page">
  <header className="class-settings-header"><div><button type="button" className="class-settings-back" onClick={() => navigate('/host-dashboard')}><ArrowLeft size={15} /> My Teaching</button><p className="eyebrow">Host workspace</p><h1>{form.title}</h1><div className="class-settings-badges"><Badge variant={form.status === 'active' ? 'success' : 'primary'}>{form.status}</Badge><Badge variant="neutral">{form.isPublic ? 'Public' : 'Unlisted'}</Badge><a href={`/class/${form.appearance.slug || classId}`} target="_blank" rel="noreferrer">View public page <ExternalLink size={14} /></a></div></div><div className="class-settings-actions"><Button variant="secondary" onClick={duplicate}><Copy size={16} /> Duplicate</Button><Button variant="destructive" onClick={archive}><Archive size={16} /> Archive</Button></div></header>
    {message && <div className="settings-message">{message}</div>}{error && <div className="class-creation-error">{error}</div>}
    <div className="class-settings-layout"><nav className="class-settings-nav" aria-label="Class settings sections">{[['basic','Basics'],['appearance','Appearance'],['pricing','Pricing'],['schedule','Schedule'],['recordings','Recordings'],['delivery','Delivery'],['capacity','Enrollment'],['visibility','Visibility']].map(([key, label]) => <button type="button" key={key} className={section === key ? 'active' : ''} onClick={() => setSection(key)}>{label}</button>)}</nav>
      <div className="class-settings-content">
        {section === 'basic' && <Card title="Basic information" subtitle="Update the details students see when they discover your class."><div className="class-form-stack"><Field label="Title"><Input maxLength={500} value={form.title} onChange={(event) => setField('title', event.target.value)} /></Field><Field label="Description"><Textarea rows={8} value={form.description} onChange={(event) => setField('description', event.target.value)} /></Field><Field label="Category"><Select value={form.category} onChange={(event) => setField('category', event.target.value)}>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field><Field label="Tags" help="Up to 10 comma-separated tags"><Input value={form.tags} onChange={(event) => setField('tags', event.target.value)} /></Field></div></Card>}
        {section === 'appearance' && <Card title="Appearance and branding" subtitle="Control the images and visual identity students see on your public class page."><div className="class-form-stack"><Field label="Thumbnail" help="Cropped to 16:9 and compressed automatically."><Input type="file" accept="image/*" onChange={(event) => readImage(event, 'thumbnailImage')} />{form.appearance.thumbnailImage && <img className="appearance-preview appearance-preview--thumbnail" src={form.appearance.thumbnailImage} alt="Thumbnail preview" />}</Field><Field label="Banner image" help="Cropped to 21:9. If empty, the thumbnail is used as a blurred fallback."><Input type="file" accept="image/*" onChange={(event) => readImage(event, 'bannerImage')} />{form.appearance.bannerImage && <img className="appearance-preview appearance-preview--banner" src={form.appearance.bannerImage} alt="Banner preview" />}</Field><Field label="Image gallery" help="Add up to 6 cropped 4:3 images."><Input type="file" accept="image/*" onChange={(event) => readImage(event, 'gallery')} /><div className="appearance-gallery-editor">{(form.appearance.gallery || []).map((item, index) => <div className="appearance-gallery-editor__item" key={`${item.url}-${index}`}><img src={item.url} alt="" /><Input maxLength={80} value={item.caption || ''} placeholder="Caption (optional)" onChange={(event) => updateGalleryItem(index, { caption: event.target.value })} /><Button variant="secondary" onClick={() => removeGalleryItem(index)}>Remove</Button></div>)}</div></Field><Field label="Accent color" help={classData.hostId?.planTier === 'pro' || classData.hostId?.planTier === 'elite' ? 'Used on the public enrollment card and highlights.' : 'Unlocks at Pro - 73 active paying students.'}><div className="appearance-palette">{appearancePalette.map((color) => <button type="button" key={color} aria-label={`Use ${color}`} className={`appearance-swatch ${form.appearance.accentColor === color ? 'selected' : ''}`} style={{ backgroundColor: color }} disabled={!['pro', 'elite'].includes(classData.hostId?.planTier)} onClick={() => updateAppearance({ accentColor: color })} />)}</div></Field><Field label="Host logo" help={!['pro', 'elite'].includes(classData.hostId?.planTier) ? 'Unlocks at Pro - 73 active paying students.' : 'PNG or SVG, cropped to a square.'}><Input type="file" accept="image/png,image/svg+xml" disabled={!['pro', 'elite'].includes(classData.hostId?.planTier)} onChange={(event) => readImage(event, 'hostLogo')} />{form.appearance.hostLogo && <img className="appearance-preview appearance-preview--logo" src={form.appearance.hostLogo} alt="Host logo preview" />}</Field><Field label="Class URL slug" help={form.status !== 'draft' ? 'Slugs lock at publish so student links never break.' : 'Elite hosts can customize this draft slug.'}><Input disabled={form.status !== 'draft' || classData.hostId?.planTier !== 'elite'} value={form.appearance.slug || ''} onChange={(event) => updateAppearance({ slug: event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} /></Field></div></Card>}
        {section === 'pricing' && <Card title="Pricing" subtitle="Existing students keep the price already paid for their current access."><div className="class-form-stack"><Field label="Monthly price (USD)" help="New students use the tiered day pricing. Price changes are limited to once every 30 days and increases cannot exceed 50%."><Input type="number" min="5" max="1000" step="0.01" disabled={priceLocked} value={form.monthlyPrice} onChange={(event) => setField('monthlyPrice', event.target.value)} />{priceLocked && <small><Lock size={13} /> Price locked until {format(new Date(new Date(classData.lastPriceChangeAt).getTime() + 30 * 86400000), 'MMM d, yyyy')}</small>}</Field><Field label="Minimum purchase days"><Select value={form.minPurchaseDays} onChange={(event) => setField('minPurchaseDays', Number(event.target.value))}>{[1,2,3,5,7].map((value) => <option key={value}>{value}</option>)}</Select></Field><Button disabled={priceLocked || Number(form.monthlyPrice) === classData.monthlyPrice} onClick={changePrice}>Apply price change</Button></div></Card>}
        {section === 'schedule' && <><Card title="Schedule & sessions" subtitle="Future sessions regenerate on save; past records remain unchanged."><Field label="Timezone"><Select value={form.timezone} onChange={(event) => setField('timezone', event.target.value)}>{zones.map((zone) => <option key={zone}>{zone}</option>)}</Select></Field><div className="settings-schedule-list">{days.map((day, dayOfWeek) => { const item = form.schedule.find((row) => row.dayOfWeek === dayOfWeek); return <div className="settings-schedule-row" key={day}><label><input type="checkbox" checked={Boolean(item)} onChange={() => setForm((current) => ({ ...current, schedule: item ? current.schedule.filter((row) => row.dayOfWeek !== dayOfWeek) : [...current.schedule, { dayOfWeek, startTime: '16:00', durationMinutes: 60 }] }))} /> {day}</label>{item && <><Input type="time" value={item.startTime} onChange={(event) => updateSchedule(form.schedule.indexOf(item), 'startTime', event.target.value)} /><Select value={item.durationMinutes || item.duration || 60} onChange={(event) => updateSchedule(form.schedule.indexOf(item), 'durationMinutes', Number(event.target.value))}>{[30,45,60,90,120].map((value) => <option key={value}>{value} min</option>)}</Select></>}</div>})}</div></Card><Card title="Bonus session" subtitle="Add a one-off session outside your weekly schedule."><form className="bonus-session-form" onSubmit={addBonusSession}><Field label="Date"><Input type="date" value={bonusDate} onChange={(event) => setBonusDate(event.target.value)} required /></Field><Field label="Start time"><Input type="time" value={bonusTime} onChange={(event) => setBonusTime(event.target.value)} required /></Field><Field label="Duration"><Select value={bonusDuration} onChange={(event) => setBonusDuration(event.target.value)}>{[30,45,60,90,120].map((value) => <option key={value} value={value}>{value} min</option>)}</Select></Field><Button type="submit">Add session</Button></form><div className="settings-schedule-list">{sessions.length === 0 ? <p className="schedule-empty">No sessions generated yet — sessions appear automatically from your weekly schedule.</p> : sessions.map((session) => <div className="settings-schedule-row settings-session-row" key={session._id}><div><strong>{new Date(session.scheduledStartTime).toLocaleDateString()}</strong><span>{new Date(session.scheduledStartTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })} · {Math.round((new Date(session.scheduledEndTime) - new Date(session.scheduledStartTime)) / 60000)} min</span></div><Badge variant={session.status === 'cancelled' ? 'neutral' : 'primary'}>{session.status}</Badge>{session.status === 'scheduled' && <Button size="sm" variant="ghost" onClick={() => cancelSession(session._id)}>Cancel</Button>}</div>)}</div></Card><Card title="Vacation mode" subtitle="Pause future sessions for up to 14 calendar days. Active students receive the same number of extra access days."><div className="class-form-grid"><Field label="Start date"><Input type="date" value={form.vacationStart} onChange={(event) => setField('vacationStart', event.target.value)} /></Field><Field label="End date"><Input type="date" value={form.vacationEnd} onChange={(event) => setField('vacationEnd', event.target.value)} /></Field></div><Button variant={form.vacationActive ? 'secondary' : 'primary'} onClick={() => updateVacation(!form.vacationActive)} disabled={saving || (!form.vacationActive && (!form.vacationStart || !form.vacationEnd))}>{form.vacationActive ? 'Deactivate vacation mode' : 'Activate vacation mode'}</Button></Card></>}
        {section === 'recordings' && <Card title="Recordings" subtitle="Recordings are available only for Pro and Elite hosts. Email watermarking can never be disabled.">{['pro', 'elite'].includes(classData.hostId?.planTier) ? <div className="class-form-stack"><Field label="Recording mode" help="Built-in video sessions can be recorded automatically. External sessions use the upload fallback."><Select value={form.recordingSettings.mode} onChange={(event) => setForm((current) => ({ ...current, recordingSettings: { ...current.recordingSettings, mode: event.target.value } }))}><option value="auto">Auto-record every session</option><option value="manual">Choose manually per session</option></Select></Field><Field label="Release"><Select value={form.recordingSettings.releasePolicy} onChange={(event) => setForm((current) => ({ ...current, recordingSettings: { ...current.recordingSettings, releasePolicy: event.target.value } }))}><option value="immediate">Immediately after session</option><option value="24h">24-hour review hold</option></Select></Field><Field label="Auto-delete"><Select value={form.recordingSettings.retentionDays ?? 'never'} onChange={(event) => setForm((current) => ({ ...current, recordingSettings: { ...current.recordingSettings, retentionDays: event.target.value === 'never' ? null : Number(event.target.value) } }))}><option value={30}>30 days</option><option value={90}>90 days</option><option value="never">Never</option></Select></Field><p className="locked-setting">Your students&apos; emails are always burned into playback so leaked clips remain traceable.</p><Button onClick={saveRecordingSettings} loading={saving}>Save recording settings</Button><div className="settings-schedule-list">{hostRecordings.length === 0 ? <p>No recordings yet.</p> : hostRecordings.map((recording) => <div className="settings-schedule-row" key={recording.id}><span><strong>{recording.title}</strong><br /><small>{recording.status}</small></span><Button size="sm" variant="secondary" onClick={() => toggleRecordingVisibility(recording.id, !recording.isVisible)}>{recording.isVisible ? 'Hide' : 'Publish'}</Button></div>)}</div></div> : <p className="locked-setting"><Lock size={15} /> Recordings unlock at Pro. Growth and Starter classes show no recording UI.</p>}</Card>}
        {section === 'delivery' && <Card title="How sessions run" subtitle="Choose the classroom experience for this class."><div className="video-mode-choice">{builtinUnlocked ? (<button type="button" className={`video-mode-option ${form.videoMode === 'builtin' ? 'selected' : ''}`} onClick={() => setField('videoMode', 'builtin')}><div className="video-mode-option__icon"><MonitorPlay size={20} /></div><div className="video-mode-option__content"><span className="video-mode-option__title">Built-in video classroom</span><span className="video-mode-option__caption">HD video, screen share and host controls — no external app for you or your students.</span></div>{form.videoMode === 'builtin' && <Check className="video-mode-option__check" size={16} />}</button>) : (<div className="video-mode-option video-mode-option--locked"><LockedFeatureCard feature="builtinVideo" tier={currentTier} subscribers={hostContext?.subscribers || 0} threshold={hostContext?.nextThreshold || 23} /></div>)}<button type="button" className={`video-mode-option ${form.videoMode === 'external' ? 'selected' : ''}`} onClick={() => setField('videoMode', 'external')}><div className="video-mode-option__icon"><LinkIcon size={20} /></div><div className="video-mode-option__content"><span className="video-mode-option__title">External meeting link</span><span className="video-mode-option__caption">Run sessions on Zoom, Google Meet, etc.</span></div>{form.videoMode === 'external' && <Check className="video-mode-option__check" size={16} />}</button></div>{form.videoMode === 'external' && <div className="class-form-stack class-form-stack--tight"><Field label="Meeting link" help="Students see this link at session time."><Input type="url" pattern="https://.*" value={form.externalVideoLink} onChange={(event) => setField('externalVideoLink', event.target.value)} placeholder="https://..." /></Field></div>}</Card>}
        {section === 'capacity' && <Card title="Enrollment & capacity"><Field label="Maximum students" help="Leave blank for unlimited. Starter plan capacity is 25."><Input type="number" min="1" value={form.maxStudents} onChange={(event) => setField('maxStudents', event.target.value)} /></Field><p className="locked-setting"><Lock size={15} /> Waitlist — Coming soon</p></Card>}
        {section === 'visibility' && <Card title="Visibility & lifecycle"><div className="class-form-stack"><Field label="Visibility"><Select value={String(form.isPublic)} onChange={(event) => setField('isPublic', event.target.value === 'true')}><option value="true">Public</option><option value="false">Unlisted</option></Select></Field><Field label="Status"><Select value={form.status} onChange={(event) => setField('status', event.target.value)}><option value="draft">Draft</option><option value="published">Published</option><option value="active">Active</option><option value="archived">Archived</option></Select></Field></div></Card>}
      </div></div>
    {dirty && <div className="class-settings-savebar"><span><Save size={16} /> Unsaved changes</span><div><Button variant="ghost" onClick={retryLoad}>Discard</Button><Button onClick={save} loading={saving}><Save size={16} /> Save</Button></div></div>}
  </main>;
}
