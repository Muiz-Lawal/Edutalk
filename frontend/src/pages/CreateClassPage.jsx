import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/CreateClassPage.css';

const CATEGORIES = ['Technology', 'Music', 'Business', 'Design', 'Languages', 'Fitness', 'Science', 'Arts', 'Cooking', 'Photography'];
const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function CreateClassPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    tags: [],
    monthlyPrice: '',
    minPurchaseDays: 1,
    durationType: 'ongoing',
    startDate: '',
    endDate: '',
    videoMode: 'external',
    externalVideoLink: '',
    maxStudents: '',
    isPublic: true,
  });

  const [schedule, setSchedule] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [scheduleForm, setScheduleForm] = useState({
    dayOfWeek: 0,
    startTime: '09:00',
    duration: 60,
    timezone: 'UTC',
  });

  const [showScheduleForm, setShowScheduleForm] = useState(false);

  if (loading) {
    return <LoadingSpinner fullPage={true} message="Loading..." />;
  }

  if (!isAuthenticated || !user?.isHost) {
    return <Navigate to="/login" replace />;
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleScheduleInputChange = (e) => {
    const { name, value } = e.target;
    setScheduleForm(prev => ({
      ...prev,
      [name]: name === 'dayOfWeek' || name === 'duration' ? parseInt(value) : value
    }));
  };

  const handleAddSchedule = () => {
    // Check if this schedule already exists
    const exists = schedule.some(s => 
      s.dayOfWeek === scheduleForm.dayOfWeek && 
      s.startTime === scheduleForm.startTime
    );

    if (exists) {
      setError('This schedule slot already exists');
      return;
    }

    setSchedule(prev => [...prev, { ...scheduleForm }]);
    setScheduleForm({
      dayOfWeek: 0,
      startTime: '09:00',
      duration: 60,
      timezone: 'UTC',
    });
    setShowScheduleForm(false);
    setError(null);
  };

  const handleRemoveSchedule = (index) => {
    setSchedule(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Class title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Class description is required');
      return;
    }

    if (!formData.category) {
      setError('Please select a category');
      return;
    }

    if (!formData.monthlyPrice || formData.monthlyPrice <= 0) {
      setError('Please enter a valid monthly price');
      return;
    }

    if (formData.videoMode === 'external' && !formData.externalVideoLink.trim()) {
      setError('Please provide an external video link');
      return;
    }

    if (formData.durationType === 'fixed') {
      if (!formData.startDate) {
        setError('Please select a start date');
        return;
      }
      if (!formData.endDate) {
        setError('Please select an end date');
        return;
      }
      if (new Date(formData.startDate) >= new Date(formData.endDate)) {
        setError('End date must be after start date');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const payload = {
        ...formData,
        monthlyPrice: parseFloat(formData.monthlyPrice),
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : null,
        schedule: schedule.length > 0 ? schedule : undefined,
      };

      const response = await api.post('/classes', payload);

      if (response.status === 201) {
        setSuccessMessage('Class created successfully! Redirecting to host dashboard...');
        setTimeout(() => {
          navigate(`/host-dashboard`);
        }, 2000);
      }
    } catch (err) {
      console.error('Error creating class:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Failed to create class. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-class-page">
      <div className="container">
        <div className="create-class-header">
          <h1>Create a New Class</h1>
          <p>Share your expertise and start teaching</p>
        </div>

        {error && (
          <div className="alert alert-error">
            <span>❌ {error}</span>
            <button onClick={() => setError(null)} className="close-btn">×</button>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <span>✅ {successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-class-form">
          {/* Basic Information */}
          <section className="form-section">
            <h2>📚 Class Information</h2>

            <div className="form-group">
              <label htmlFor="title">Class Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Advanced React Development"
                maxLength="200"
                required
              />
              <small>{formData.title.length}/200</small>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe what students will learn..."
                maxLength="2000"
                rows="6"
                required
              />
              <small>{formData.description.length}/2000</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a category...</option>
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="tags">Tags</label>
                <div className="tag-input-group">
                  <input
                    type="text"
                    id="tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                    placeholder="Add tags (press Enter)"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn-add-tag"
                  >
                    Add Tag
                  </button>
                </div>
                <div className="tags-container">
                  {formData.tags.map(tag => (
                    <span key={tag} className="tag">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="tag-remove"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing */}
          <section className="form-section">
            <h2>💰 Pricing</h2>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="monthlyPrice">Monthly Price (USD) *</label>
                <div className="input-with-currency">
                  <span className="currency">$</span>
                  <input
                    type="number"
                    id="monthlyPrice"
                    name="monthlyPrice"
                    value={formData.monthlyPrice}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="1"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="minPurchaseDays">Minimum Purchase Duration</label>
                <select
                  id="minPurchaseDays"
                  name="minPurchaseDays"
                  value={formData.minPurchaseDays}
                  onChange={handleInputChange}
                >
                  <option value={1}>1 day</option>
                  <option value={2}>2 days</option>
                  <option value={3}>3 days</option>
                  <option value={5}>5 days</option>
                  <option value={7}>7 days</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="maxStudents">Maximum Students (Optional)</label>
              <input
                type="number"
                id="maxStudents"
                name="maxStudents"
                value={formData.maxStudents}
                onChange={handleInputChange}
                placeholder="Leave empty for unlimited"
                min="1"
              />
            </div>
          </section>

          {/* Class Duration */}
          <section className="form-section">
            <h2>📅 Duration Type</h2>

            <div className="form-group">
              <label>Is this a fixed-duration or ongoing class?</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="durationType"
                    value="ongoing"
                    checked={formData.durationType === 'ongoing'}
                    onChange={handleInputChange}
                  />
                  <span>Ongoing (no end date)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="durationType"
                    value="fixed"
                    checked={formData.durationType === 'fixed'}
                    onChange={handleInputChange}
                  />
                  <span>Fixed Duration (has end date)</span>
                </label>
              </div>
            </div>

            {formData.durationType === 'fixed' && (
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="startDate">Start Date *</label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required={formData.durationType === 'fixed'}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="endDate">End Date *</label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required={formData.durationType === 'fixed'}
                  />
                </div>
              </div>
            )}
          </section>

          {/* Schedule */}
          <section className="form-section">
            <h2>⏰ Class Schedule (Optional)</h2>
            <p className="section-help">Set recurring class times</p>

            {schedule.length > 0 && (
              <div className="schedule-list">
                {schedule.map((slot, index) => (
                  <div key={index} className="schedule-item">
                    <div className="schedule-details">
                      <strong>{DAYS_OF_WEEK[slot.dayOfWeek]}</strong>
                      <span>{slot.startTime}</span>
                      <span>({slot.duration} min)</span>
                      <span className="timezone">{slot.timezone}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSchedule(index)}
                      className="btn-remove"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}

            {!showScheduleForm && (
              <button
                type="button"
                onClick={() => setShowScheduleForm(true)}
                className="btn btn-secondary"
              >
                + Add Schedule Slot
              </button>
            )}

            {showScheduleForm && (
              <div className="schedule-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="dayOfWeek">Day</label>
                    <select
                      id="dayOfWeek"
                      name="dayOfWeek"
                      value={scheduleForm.dayOfWeek}
                      onChange={handleScheduleInputChange}
                    >
                      {DAYS_OF_WEEK.map((day, index) => (
                        <option key={index} value={index}>{day}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="startTime">Start Time</label>
                    <input
                      type="time"
                      id="startTime"
                      name="startTime"
                      value={scheduleForm.startTime}
                      onChange={handleScheduleInputChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="duration">Duration (minutes)</label>
                    <input
                      type="number"
                      id="duration"
                      name="duration"
                      value={scheduleForm.duration}
                      onChange={handleScheduleInputChange}
                      min="15"
                      max="480"
                      step="15"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="timezone">Timezone</label>
                    <select
                      id="timezone"
                      name="timezone"
                      value={scheduleForm.timezone}
                      onChange={handleScheduleInputChange}
                    >
                      <option value="UTC">UTC</option>
                      <option value="EST">EST</option>
                      <option value="CST">CST</option>
                      <option value="MST">MST</option>
                      <option value="PST">PST</option>
                      <option value="GMT">GMT</option>
                      <option value="CET">CET</option>
                      <option value="IST">IST</option>
                      <option value="JST">JST</option>
                      <option value="AEST">AEST</option>
                    </select>
                  </div>
                </div>

                <div className="schedule-form-buttons">
                  <button
                    type="button"
                    onClick={handleAddSchedule}
                    className="btn btn-primary"
                  >
                    Add Schedule
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowScheduleForm(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Video Settings */}
          <section className="form-section">
            <h2>🎥 Video Settings</h2>

            <div className="form-group">
              <label>Video Mode</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="videoMode"
                    value="external"
                    checked={formData.videoMode === 'external'}
                    onChange={handleInputChange}
                  />
                  <span>External Video Link (YouTube, Vimeo, etc.)</span>
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="videoMode"
                    value="builtin"
                    checked={formData.videoMode === 'builtin'}
                    onChange={handleInputChange}
                  />
                  <span>Built-in Live Streaming</span>
                </label>
              </div>
            </div>

            {formData.videoMode === 'external' && (
              <div className="form-group">
                <label htmlFor="externalVideoLink">Video Link *</label>
                <input
                  type="url"
                  id="externalVideoLink"
                  name="externalVideoLink"
                  value={formData.externalVideoLink}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                  required={formData.videoMode === 'external'}
                />
              </div>
            )}
          </section>

          {/* Visibility */}
          <section className="form-section">
            <h2>👁️ Visibility</h2>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleInputChange}
                />
                <span>Make this class publicly visible</span>
              </label>
              <small>If unchecked, only invited students can see this class</small>
            </div>
          </section>

          {/* Submit Buttons */}
          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner variant="inline" size="small" message="" />
                  Creating Class...
                </>
              ) : 'Create Class'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/host-dashboard')}
              className="btn btn-secondary btn-lg"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
