import React, { useState } from 'react';
import '../styles/ScheduleReportForm.css';

export default function ScheduleReportForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    frequency: 'weekly',
    dayOfWeek: 1,
    dayOfMonth: 1,
    hour: 9,
    minute: 0,
    timezone: 'UTC',
    recipients: [''],
    subject: 'Weekly Analytics Report',
    includeAttachment: true,
    reportType: 'summary',
    includeMetrics: [
      'totalViewers',
      'peakViewers',
      'avgWatchTime',
      'engagementScore',
    ],
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRecipientChange = (index, value) => {
    const newRecipients = [...formData.recipients];
    newRecipients[index] = value;
    setFormData(prev => ({
      ...prev,
      recipients: newRecipients,
    }));
  };

  const addRecipient = () => {
    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, ''],
    }));
  };

  const removeRecipient = (index) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter((_, i) => i !== index),
    }));
  };

  const handleMetricsChange = (metric) => {
    const newMetrics = formData.includeMetrics.includes(metric)
      ? formData.includeMetrics.filter(m => m !== metric)
      : [...formData.includeMetrics, metric];
    
    setFormData(prev => ({
      ...prev,
      includeMetrics: newMetrics,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="schedule-report-form">
      <h3>Schedule Analytics Report</h3>
      
      <form onSubmit={handleSubmit}>
        {/* Frequency Selection */}
        <div className="form-group">
          <label>Frequency</label>
          <select 
            name="frequency" 
            value={formData.frequency} 
            onChange={handleChange}
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>

        {/* Day Selection */}
        {formData.frequency === 'weekly' && (
          <div className="form-group">
            <label>Day of Week</label>
            <select 
              name="dayOfWeek" 
              value={formData.dayOfWeek} 
              onChange={handleChange}
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>
        )}

        {formData.frequency === 'monthly' && (
          <div className="form-group">
            <label>Day of Month</label>
            <input 
              type="number" 
              name="dayOfMonth" 
              value={formData.dayOfMonth} 
              onChange={handleChange}
              min="1"
              max="31"
            />
          </div>
        )}

        {/* Time Selection */}
        <div className="form-row">
          <div className="form-group">
            <label>Hour (0-23)</label>
            <input 
              type="number" 
              name="hour" 
              value={formData.hour} 
              onChange={handleChange}
              min="0"
              max="23"
            />
          </div>
          <div className="form-group">
            <label>Minute (0-59)</label>
            <input 
              type="number" 
              name="minute" 
              value={formData.minute} 
              onChange={handleChange}
              min="0"
              max="59"
            />
          </div>
        </div>

        {/* Timezone */}
        <div className="form-group">
          <label>Timezone</label>
          <select 
            name="timezone" 
            value={formData.timezone} 
            onChange={handleChange}
          >
            <option value="UTC">UTC</option>
            <option value="America/New_York">US Eastern</option>
            <option value="America/Chicago">US Central</option>
            <option value="America/Denver">US Mountain</option>
            <option value="America/Los_Angeles">US Pacific</option>
            <option value="Europe/London">London</option>
            <option value="Europe/Paris">Paris</option>
            <option value="Asia/Tokyo">Tokyo</option>
          </select>
        </div>

        {/* Email Recipients */}
        <div className="form-group">
          <label>Email Recipients</label>
          {formData.recipients.map((recipient, index) => (
            <div key={index} className="recipient-input">
              <input 
                type="email" 
                value={recipient} 
                onChange={(e) => handleRecipientChange(index, e.target.value)}
                placeholder="email@example.com"
              />
              {formData.recipients.length > 1 && (
                <button 
                  type="button" 
                  onClick={() => removeRecipient(index)}
                  className="btn-remove"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button 
            type="button" 
            onClick={addRecipient}
            className="btn-add-recipient"
          >
            + Add Recipient
          </button>
        </div>

        {/* Report Type */}
        <div className="form-group">
          <label>Report Type</label>
          <select 
            name="reportType" 
            value={formData.reportType} 
            onChange={handleChange}
          >
            <option value="summary">Summary (Key metrics only)</option>
            <option value="detailed">Detailed (All metrics)</option>
          </select>
        </div>

        {/* Subject Line */}
        <div className="form-group">
          <label>Email Subject</label>
          <input aria-label="Email subject line" 
            type="text" 
            name="subject" 
            value={formData.subject} 
            onChange={handleChange}
             placeholder="Email subject line"
          />
        </div>

        {/* Include Attachment */}
        <div className="form-group checkbox">
          <label>
            <input 
              type="checkbox" 
              name="includeAttachment" 
              checked={formData.includeAttachment} 
              onChange={handleChange}
            />
            Include CSV attachment in email
          </label>
        </div>

        {/* Metrics Selection */}
        <div className="form-group">
          <label>Metrics to Include</label>
          <div className="metrics-checkboxes">
            {[
              { id: 'totalViewers', label: 'Total Viewers' },
              { id: 'peakViewers', label: 'Peak Viewers' },
              { id: 'avgWatchTime', label: 'Avg Watch Time' },
              { id: 'engagementScore', label: 'Engagement Score' },
              { id: 'chatMessages', label: 'Chat Messages' },
              { id: 'qualityDistribution', label: 'Quality Distribution' },
            ].map(metric => (
              <label key={metric.id} className="metric-checkbox">
                <input 
                  type="checkbox" 
                  checked={formData.includeMetrics.includes(metric.id)}
                  onChange={() => handleMetricsChange(metric.id)}
                />
                {metric.label}
              </label>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div className="form-buttons">
          <button type="submit" className="btn-primary">
            Schedule Report
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

