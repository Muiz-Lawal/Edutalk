import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import ScheduledStreamsDashboard from '../components/ScheduledStreamsDashboard';
import '../styles/ScheduledStreamsPage.css';

export default function ScheduledStreamsPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    recurrence: 'once',
    reminders: {
      '24h': false,
      '1h': false,
      '30m': false
    }
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchHostClasses();
  }, [user?.id]);

  const fetchHostClasses = async () => {
    try {
      const response = await api.get('/classes/host/my-classes');
      setClasses(response.data || []);
    } catch (err) {
      console.error('Error fetching classes:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleReminderToggle = (reminderTime) => {
    setFormData(prev => ({
      ...prev,
      reminders: {
        ...prev.reminders,
        [reminderTime]: !prev.reminders[reminderTime]
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.classId || !formData.scheduledStartTime) {
      setMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    try {
      setLoading(true);
      const scheduleData = {
        ...formData,
        hostId: user?.id,
        status: 'scheduled'
      };

      const response = await api.post('/schedules', scheduleData);
      
      setMessage({ type: 'success', text: 'Schedule created successfully!' });
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        classId: '',
        scheduledStartTime: '',
        scheduledEndTime: '',
        recurrence: 'once',
        reminders: {
          '24h': false,
          '1h': false,
          '30m': false
        }
      });

      // Refresh dashboard
      setRefreshKey(prev => prev + 1);

      // Clear message after 3 seconds
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (err) {
      console.error('Error creating schedule:', err);
      setMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to create schedule' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="scheduled-streams-page">
      <div className="page-header">
        <h1>📅 Scheduled Streams</h1>
        <p>Create and manage your scheduled classes</p>
      </div>

      <div className="page-container">
        {/* Left Panel: Form */}
        <div className="form-panel">
          <div className="form-card">
            <h2>Create New Schedule</h2>
            
            {message.text && (
              <div className={`message ${message.type}`}>
                {message.type === 'success' ? '✓' : '✕'} {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Title */}
              <div className="form-group">
                <label htmlFor="title">
                  📝 Title <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Enter stream title"
                  maxLength="100"
                />
              </div>

              {/* Description */}
              <div className="form-group">
                <label htmlFor="description">📋 Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="What will this stream be about?"
                  rows="3"
                  maxLength="500"
                />
              </div>

              {/* Class Selection */}
              <div className="form-group">
                <label htmlFor="classId">
                  🎓 Select Class <span className="required">*</span>
                </label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId}
                  onChange={handleInputChange}
                >
                  <option value="">-- Choose a class --</option>
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datetime Picker */}
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="scheduledStartTime">
                    🕐 Start Time <span className="required">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledStartTime"
                    name="scheduledStartTime"
                    value={formData.scheduledStartTime}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="scheduledEndTime">
                    🕑 End Time
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledEndTime"
                    name="scheduledEndTime"
                    value={formData.scheduledEndTime}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              {/* Recurrence */}
              <div className="form-group">
                <label htmlFor="recurrence">🔄 Recurrence</label>
                <select
                  id="recurrence"
                  name="recurrence"
                  value={formData.recurrence}
                  onChange={handleInputChange}
                >
                  <option value="once">Once</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              {/* Reminders */}
              <div className="form-group">
                <label>🔔 Send Reminders</label>
                <div className="reminders-group">
                  {['24h', '1h', '30m'].map(time => (
                    <label key={time} className="reminder-checkbox">
                      <input
                        type="checkbox"
                        checked={formData.reminders[time]}
                        onChange={() => handleReminderToggle(time)}
                      />
                      <span>{time === '24h' ? '24 hours' : time === '1h' ? '1 hour' : '30 minutes'} before</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className="submit-btn"
                disabled={loading}
              >
                {loading ? 'Creating...' : '✓ Create Schedule'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Panel: Dashboard */}
        <div className="dashboard-panel">
          <ScheduledStreamsDashboard 
            key={refreshKey}
            hostId={user?.id} 
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>
    </div>
  );
}
