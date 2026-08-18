import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ScheduleBuilder from './ScheduleBuilder';
import { createClass, updateClass, getCategories, getClassById } from '../utils/api';
import '../styles/ClassForm.css';

const defaultFormState = (fallback = {}) => ({
  title: fallback.title || '',
  description: fallback.description || '',
  category: fallback.category || 'General',
  monthlyPrice: fallback.monthlyPrice || 99,
  minStudents: fallback.minStudents || 1,
  maxStudents: fallback.maxStudents || 30,
  schedule: fallback.schedule || [],
});

export default function ClassForm({ initialData = null, onSuccess = null, onCancel = null, showHeader = true, isModal = false }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('General');
  const [monthlyPrice, setMonthlyPrice] = useState(99);
  const [minStudents, setMinStudents] = useState(1);
  const [maxStudents, setMaxStudents] = useState(30);
  const [schedule, setSchedule] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState(null);

  const activeClassId = initialData?._id || editId;
  const isEditing = Boolean(activeClassId);

  const hydrateFormState = (payload = {}) => {
    const values = defaultFormState(payload);
    setTitle(values.title);
    setDescription(values.description);
    setCategory(values.category);
    setMonthlyPrice(values.monthlyPrice);
    setMinStudents(values.minStudents);
    setMaxStudents(values.maxStudents);
    setSchedule(values.schedule);
  };

  useEffect(() => {
    const load = async () => {
      try {
        const cats = await getCategories();
        setCategories(['General', ...(cats || [])]);
      } catch (err) {
        console.warn('Failed to load categories', err);
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!activeClassId) {
      hydrateFormState();
      setIsInitializing(false);
      return;
    }

    const hasInlineValues = Boolean(
      initialData &&
        (initialData.title || initialData.description || initialData.category || initialData.monthlyPrice || initialData.minStudents || initialData.maxStudents || initialData.schedule?.length)
    );

    if (hasInlineValues) {
      hydrateFormState(initialData);
      return;
    }

    let isMounted = true;
    const loadInitialData = async () => {
      setIsInitializing(true);
      try {
        const data = await getClassById(activeClassId);
        const classPayload = data?.class || data;
        if (isMounted) {
          hydrateFormState(classPayload || {});
        }
      } catch (err) {
        console.warn('Failed to load class for edit', err);
      } finally {
        if (isMounted) {
          setIsInitializing(false);
        }
      }
    };

    loadInitialData();
    return () => {
      isMounted = false;
    };
  }, [activeClassId, initialData, initialData?.title, initialData?.description, initialData?.category, initialData?.monthlyPrice, initialData?.minStudents, initialData?.maxStudents, initialData?.schedule]);

  const validate = () => {
    if (!title || title.trim().length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }
    if (!monthlyPrice || Number(monthlyPrice) <= 0) {
      setError('Monthly price must be greater than 0');
      return false;
    }
    if (!minStudents || Number(minStudents) < 1) {
      setError('Minimum students must be at least 1');
      return false;
    }
    if (!maxStudents || Number(maxStudents) < Number(minStudents)) {
      setError('Maximum students must be greater than or equal to minimum students');
      return false;
    }
    return true;
  };

  const normalizeSchedule = (entries) => {
    return (entries || []).map((entry) => {
      const startTime = entry?.startTime;
      if (!startTime) return entry;

      const [hours, minutes] = startTime.split(':').map(Number);
      const duration = Number(entry?.duration || 60);
      const totalMinutes = hours * 60 + minutes + duration;
      const endHours = Math.floor(totalMinutes / 60) % 24;
      const endMinutes = totalMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;

      return {
        dayOfWeek: Number(entry.dayOfWeek),
        startTime,
        endTime,
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!validate()) return;
    setLoading(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      category,
      monthlyPrice: Number(monthlyPrice),
        minStudents: Number(minStudents),
        maxStudents: Number(maxStudents),
        schedule: normalizeSchedule(schedule),
      };

    try {
      let result = null;
      if (activeClassId) {
        result = await updateClass(activeClassId, payload);
      } else {
        result = await createClass(payload);
      }

      const newClass = result?.class || result?.data || result;
      const newId = newClass?._id || newClass?.id || result?.id;

      if (onSuccess) {
        onSuccess(newClass, { isEditing });
      } else if (newId) {
        navigate('/host-dashboard');
      } else {
        navigate('/host-dashboard');
      }
    } catch (err) {
      console.error('Failed to save class', err);
      setError(err?.response?.data?.message || err.message || 'Failed to save class');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else {
      navigate('/host-dashboard');
    }
  };

  return (
    <form className="class-form" onSubmit={handleSubmit}>
      {showHeader && (
        <div className="class-form__header">
          <div>
            <h2>{isEditing ? 'Edit Class' : 'Create a New Class'}</h2>
            <p className="class-form__subtitle">{isEditing ? 'Update the details for this live class.' : 'Create a new class for your students.'}</p>
          </div>
        </div>
      )}

      {isInitializing && <div className="class-form__status">Loading class details…</div>}
      {error && <div className="class-form__error">{error}</div>}

      <div className="class-form__grid">
        <div className="class-form__fields">
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Beginner Python" />
          </label>

          <label>
            Description
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={6} />
          </label>

          <div className="field-row">
            <label>
              Category
              <select value={category} onChange={(e) => setCategory(e.target.value)}>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              Monthly Price (USD)
              <input type="number" min={1} value={monthlyPrice} onChange={(e) => setMonthlyPrice(e.target.value)} />
            </label>
          </div>

          <div className="field-row">
            <label>
              Min Students
              <input type="number" min={1} value={minStudents} onChange={(e) => setMinStudents(e.target.value)} />
            </label>
 
            <label>
              Max Students
              <input type="number" min={1} value={maxStudents} onChange={(e) => setMaxStudents(e.target.value)} />
            </label>
          </div>

          <label>
            Schedule (recurring weekly sessions)
            <ScheduleBuilder value={schedule} onChange={(entries) => setSchedule(entries)} />
          </label>
        </div>

        <aside className="class-form__sidebar">
          <div className="sidebar-card">
            <h3>Quick Preview</h3>
            <p className="muted">Monthly price</p>
            <p className="preview-price">${Number(monthlyPrice).toFixed(2)} / month</p>

            <div className="divider" />

            <h4>Estimated per-day</h4>
            <p className="muted">Based on 30 days</p>
            <p className="preview-perday">${(Number(monthlyPrice) / 30).toFixed(2)} / day</p>

            <div className="class-form__actions">
              <button className="btn btn-primary" type="submit" disabled={loading || isInitializing}>
                {loading ? 'Saving...' : isEditing ? 'Update Class' : 'Create Class'}
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}

ClassForm.propTypes = {
  initialData: PropTypes.object,
  onSuccess: PropTypes.func,
  onCancel: PropTypes.func,
  showHeader: PropTypes.bool,
};
