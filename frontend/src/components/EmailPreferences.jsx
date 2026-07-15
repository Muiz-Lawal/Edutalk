import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './EmailPreferences.css';

const EmailPreferences = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    paymentConfirmations: true,
    sessionReminders: true,
    subscriptionExpiry: true,
    classAnnouncements: true,
    marketingEmails: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/user/email-preferences');
      setPreferences(response.data);
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setMessage('Failed to load email preferences');
    } finally {
      setLoading(false);
    }
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    setMessage('');

    try {
      await api.put('/user/email-preferences', preferences);
      setMessage('Email preferences saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage('Failed to save email preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="email-preferences-loading">Loading preferences...</div>;
  }

  return (
    <div className="email-preferences">
      <h2>Email Preferences</h2>
      <p className="email-preferences-description">
        Choose which emails you'd like to receive from EduTalk. You can change these settings at any time.
      </p>

      {message && (
        <div className={`email-preferences-message ${message.includes('successfully') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="email-preferences-list">
        <div className="email-preference-item">
          <div className="preference-content">
            <h3>Payment Confirmations</h3>
            <p>Receive emails when payments are processed successfully</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.paymentConfirmations}
              onChange={(e) => handlePreferenceChange('paymentConfirmations', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="email-preference-item">
          <div className="preference-content">
            <h3>Session Reminders</h3>
            <p>Get reminded about upcoming class sessions</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.sessionReminders}
              onChange={(e) => handlePreferenceChange('sessionReminders', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="email-preference-item">
          <div className="preference-content">
            <h3>Subscription Expiry Warnings</h3>
            <p>Receive warnings when your class subscriptions are about to expire</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.subscriptionExpiry}
              onChange={(e) => handlePreferenceChange('subscriptionExpiry', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="email-preference-item">
          <div className="preference-content">
            <h3>Class Announcements</h3>
            <p>Stay updated with important announcements from your classes</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.classAnnouncements}
              onChange={(e) => handlePreferenceChange('classAnnouncements', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>

        <div className="email-preference-item">
          <div className="preference-content">
            <h3>Marketing Emails</h3>
            <p>Receive promotional emails about new features and classes</p>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={preferences.marketingEmails}
              onChange={(e) => handlePreferenceChange('marketingEmails', e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        </div>
      </div>

      <div className="email-preferences-actions">
        <button
          className="save-preferences-btn"
          onClick={savePreferences}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};

export default EmailPreferences;
