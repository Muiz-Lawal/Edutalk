import React, { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { differenceInCalendarDays, format, parseISO } from 'date-fns';
import { ArrowLeft, Check, Link as LinkIcon, MonitorPlay, Save } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import LockedFeatureCard from '../components/ui/LockedFeatureCard';
import '../styles/ClassCreationPage.css';
import AsyncBoundary from '../components/AsyncBoundary';

const categories = ['Technology', 'Music', 'Business', 'Design', 'Languages', 'Fitness', 'Science', 'Arts', 'Cooking', 'Photography'];
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const timezoneOptions = ['UTC', 'Africa/Lagos', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Berlin', 'Asia/Kolkata', 'Asia/Tokyo', 'Australia/Sydney'];
const emptySchedule = (dayOfWeek) => ({ dayOfWeek, startTime: '16:00', durationMinutes: 60 });

export default function ClassCreationPage() {
  const { user, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '', description: '', category: '', tags: '', monthlyPrice: '',
    minPurchaseDays: '1', durationType: 'ongoing', startDate: '', endDate: '',
    videoMode: 'external', externalVideoLink: '', maxStudents: '100',
    isPublic: true, timezone: user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    schedule: [1, 2].map(emptySchedule),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [hostContext, setHostContext] = useState(null);

  useEffect(() => {
    api.get('/me/host-context').then(({ data }) => setHostContext(data)).catch(() => {
      setHostContext({ tier: user?.planTier || 'starter', features: { builtinVideo: 'off', recording: 'off', recordingAutoShare: 'off' }, subscribers: 0, nextThreshold: 23 });
    });
  }, [user?.planTier]);

  const currentTier = hostContext?.tier || user?.planTier || 'starter';
  const builtinUnlocked = hostContext?.features?.builtinVideo === 'on' || currentTier !== 'starter';

  if (loading) return <main className="class-creation-page"><AsyncBoundary loading loadingVariant="form" /></main>;
  if (!isAuthenticated || !user?.isHost) return <Navigate to="/login" replace />;

  const setField = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const updateSchedule = (index, name, value) => setForm((current) => ({
    ...current,
    schedule: current.schedule.map((item, itemIndex) => itemIndex === index ? { ...item, [name]: value } : item),
  }));
  const toggleDay = (dayOfWeek) => setForm((current) => ({
    ...current,
    schedule: current.schedule.some((item) => item.dayOfWeek === dayOfWeek)
      ? current.schedule.filter((item) => item.dayOfWeek !== dayOfWeek)
      : [...current.schedule, emptySchedule(dayOfWeek)],
  }));
  const scheduleFor = (dayOfWeek) => form.schedule.find((item) => item.dayOfWeek === dayOfWeek);

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    if (!form.title.trim() || !form.description.trim() || !form.category || !form.monthlyPrice || form.schedule.length === 0) {
      setError('Complete the required class details and add at least one weekly session.');
      return;
    }
    if (Number(form.monthlyPrice) < 0 || Number(form.maxStudents) < 1) {
      setError('Price must be zero or more and capacity must be at least one student.');
      return;
    }
    if (form.schedule.length === 0) {
      setError('Enable at least one day in the weekly schedule.');
      return;
    }
    if (form.durationType === 'fixed' && (!form.startDate || !form.endDate)) {
      setError('Fixed-duration classes need a start and end date.');
      return;
    }
    if (form.durationType === 'fixed' && differenceInCalendarDays(parseISO(form.endDate), parseISO(form.startDate)) < 1) {
      setError('The end date must be after the start date.');
      return;
    }
    if (form.videoMode === 'external' && !form.externalVideoLink) {
      setError('Enter the full meeting link, starting with https://');
      return;
    }
    if (form.videoMode === 'external' && form.externalVideoLink) {
      try {
        if (new URL(form.externalVideoLink).protocol !== 'https:') throw new Error();
      } catch {
        setError('Enter the full meeting link, starting with https://');
        return;
      }
    }
    if (form.videoMode === 'builtin' && !builtinUnlocked) {
      setError('Built-in video is a Growth feature. Upgrade to unlock it.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/classes', {
        ...form,
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        monthlyPrice: Number(form.monthlyPrice),
        minPurchaseDays: Number(form.minPurchaseDays),
        maxStudents: Number(form.maxStudents),
        startDate: form.startDate || null,
        endDate: form.endDate || null,
        timezone: form.timezone,
        totalDays: form.durationType === 'fixed' ? differenceInCalendarDays(parseISO(form.endDate), parseISO(form.startDate)) + 1 : null,
      });
      navigate('/host-dashboard');
    } catch (requestError) {
      setError('Unable to create this class. Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="class-creation-page">
      <div className="class-creation-page__header">
        <div>
          <button className="class-back-link" type="button" onClick={() => navigate('/host-dashboard')}><ArrowLeft size={16} /> Back to dashboard</button>
          <p className="eyebrow">Host workspace</p>
          <h1>Create a class</h1>
          <p className="page-subtitle">Set up your class, pricing, schedule, and access details.</p>
        </div>
      </div>

      {error && <div className="class-creation-error" role="alert">{error}</div>}

      <form onSubmit={submit} className="class-creation-layout">
        <div className="class-creation-main">
          <Card title="Class details" subtitle="Tell learners what they will learn.">
            <div className="class-form-grid">
              <Field label="Class title"><Input value={form.title} maxLength={100} required placeholder="e.g. Product design fundamentals" onChange={(event) => setField('title', event.target.value)} /></Field>
              <Field label="Category"><Select required value={form.category} onChange={(event) => setField('category', event.target.value)}><option value="">Select a category</option>{categories.map((category) => <option key={category}>{category}</option>)}</Select></Field>
              <Field label="Description" help={`${form.description.length}/2000 characters`}><Textarea value={form.description} maxLength={2000} required rows={6} placeholder="Describe the learning outcomes and who this class is for." onChange={(event) => setField('description', event.target.value)} /></Field>
              <Field label="Tags" help="Separate tags with commas"><Input value={form.tags} placeholder="design, beginner, portfolio" onChange={(event) => setField('tags', event.target.value)} /></Field>
            </div>
          </Card>

          <Card title="Duration & schedule" subtitle="Students buy calendar-day access to any sessions in their window.">
            <div className="duration-options">
              <label><input type="radio" name="durationType" checked={form.durationType === 'ongoing'} onChange={() => setField('durationType', 'ongoing')} /> Ongoing <small>Runs indefinitely</small></label>
              <label><input type="radio" name="durationType" checked={form.durationType === 'fixed'} onChange={() => setField('durationType', 'fixed')} /> Fixed <small>Has a defined date range</small></label>
            </div>
            {form.durationType === 'fixed' && <div className="class-form-grid class-form-grid--compact"><Field label="Start date"><Input type="date" min={format(new Date(), 'yyyy-MM-dd')} value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} /></Field><Field label="End date"><Input type="date" min={form.startDate || format(new Date(), 'yyyy-MM-dd')} value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} /></Field>{form.startDate && form.endDate && <p className="schedule-summary">Total: {Math.max(0, differenceInCalendarDays(parseISO(form.endDate), parseISO(form.startDate)) + 1)} days</p>}</div>}
            <Field label="Timezone"><Select value={form.timezone} onChange={(event) => setField('timezone', event.target.value)}>{timezoneOptions.map((timezone) => <option key={timezone}>{timezone}</option>)}</Select></Field>
            <div className="schedule-days">{days.map((day, dayOfWeek) => {
              const item = scheduleFor(dayOfWeek);
              return <div className={`schedule-day${item ? ' is-enabled' : ''}`} key={day}><label><input type="checkbox" checked={Boolean(item)} onChange={() => toggleDay(dayOfWeek)} /> {day}</label>{item && <><Input type="time" value={item.startTime} onChange={(event) => updateSchedule(form.schedule.indexOf(item), 'startTime', event.target.value)} /><Select value={item.durationMinutes} onChange={(event) => updateSchedule(form.schedule.indexOf(item), 'durationMinutes', Number(event.target.value))}>{[30, 45, 60, 90, 120].map((minutes) => <option key={minutes} value={minutes}>{minutes} min</option>)}</Select></>}</div>;
            })}</div>
            <p className="schedule-summary">Sessions: {form.schedule.map((item) => `${days[item.dayOfWeek].slice(0, 3)} ${item.startTime}`).join(', ') || 'None enabled'} {form.schedule.length > 0 && `(${form.schedule[0].durationMinutes} min)`} · {form.timezone}</p>
          </Card>
        </div>

        <aside className="class-creation-side">
          <Card title="Pricing & access">
            <div className="class-form-stack">
              <Field label="Monthly price"><Input type="number" min="0" step="0.01" required value={form.monthlyPrice} placeholder="0.00" onChange={(event) => setField('monthlyPrice', event.target.value)} /></Field>
              <Field label="Minimum purchase"><Select value={form.minPurchaseDays} onChange={(event) => setField('minPurchaseDays', event.target.value)}>{[1, 2, 3, 5, 7].map((daysCount) => <option key={daysCount} value={daysCount}>{daysCount} {daysCount === 1 ? 'day' : 'days'}</option>)}</Select></Field>
              <Field label="Maximum students"><Input type="number" min="1" value={form.maxStudents} onChange={(event) => setField('maxStudents', event.target.value)} /></Field>
              <Field label="Visibility"><Select value={String(form.isPublic)} onChange={(event) => setField('isPublic', event.target.value === 'true')}><option value="true">Public — visible in Browse Classes</option><option value="false">Private — link only</option></Select></Field>
            </div>
          </Card>

          <Card title="Course duration">
            <div className="class-form-stack">
              <Field label="Format"><Select value={form.durationType} onChange={(event) => setField('durationType', event.target.value)}><option value="ongoing">Ongoing</option><option value="fixed">Fixed duration</option></Select></Field>
              {form.durationType === 'fixed' && <div className="class-form-grid class-form-grid--compact"><Field label="Start date"><Input type="date" value={form.startDate} onChange={(event) => setField('startDate', event.target.value)} /></Field><Field label="End date"><Input type="date" value={form.endDate} onChange={(event) => setField('endDate', event.target.value)} /></Field></div>}
            </div>
          </Card>

          <Card title="How sessions run" subtitle="Choose the classroom experience for this class.">
            <div className="video-mode-choice">
              {builtinUnlocked ? (
                <button
                  type="button"
                  className={`video-mode-option ${form.videoMode === 'builtin' ? 'selected' : ''}`}
                  onClick={() => setField('videoMode', 'builtin')}
                >
                  <div className="video-mode-option__icon"><MonitorPlay size={20} /></div>
                  <div className="video-mode-option__content">
                    <span className="video-mode-option__title">Built-in video classroom</span>
                    <span className="video-mode-option__caption">HD video, screen share and host controls — no external app for you or your students.</span>
                  </div>
                  {form.videoMode === 'builtin' && <Check className="video-mode-option__check" size={16} />}
                </button>
              ) : (
                <div className="video-mode-option video-mode-option--locked">
                  <LockedFeatureCard
                    feature="builtinVideo"
                    tier={currentTier}
                    subscribers={hostContext?.subscribers || 0}
                    threshold={hostContext?.nextThreshold || 23}
                  />
                </div>
              )}

              <button
                type="button"
                className={`video-mode-option ${form.videoMode === 'external' ? 'selected' : ''}`}
                onClick={() => setField('videoMode', 'external')}
              >
                <div className="video-mode-option__icon"><LinkIcon size={20} /></div>
                <div className="video-mode-option__content">
                  <span className="video-mode-option__title">External meeting link</span>
                  <span className="video-mode-option__caption">Run sessions on Zoom, Google Meet, etc.</span>
                </div>
                {form.videoMode === 'external' && <Check className="video-mode-option__check" size={16} />}
              </button>
            </div>
            {form.videoMode === 'external' && (
              <div className="class-form-stack class-form-stack--tight">
                <Field label="Meeting link" help="Students see this link at session time."><Input type="url" pattern="https://.*" value={form.externalVideoLink} placeholder="https://..." onChange={(event) => setField('externalVideoLink', event.target.value)} /></Field>
              </div>
            )}
          </Card>

          <div className="class-creation-actions"><Button type="button" variant="secondary" onClick={() => navigate('/host-dashboard')}>Cancel</Button><Button type="submit" loading={saving}><Save size={16} /> Create class</Button></div>
        </aside>
      </form>
    </main>
  );
}
