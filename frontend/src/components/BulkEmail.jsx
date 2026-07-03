import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import './BulkEmail.css';

const BulkEmail = () => {
  const { user } = useAuth();
  const [emailType, setEmailType] = useState('all');
  const [classId, setClassId] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [stats, setStats] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (user?.isHost) {
      fetchClasses();
      fetchStats();
    }
  }, [user]);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/classes/my-classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/admin/email-stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching email stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleSendEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      setMessage('Please fill in both subject and content');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      let endpoint = '/admin/bulk-email/all';
      let payload = {
        subject: subject.trim(),
        content: content.trim(),
        userType: emailType,
      };

      if (emailType === 'class' && classId) {
        endpoint = `/admin/bulk-email/class/${classId}`;
        payload = {
          subject: subject.trim(),
          content: content.trim(),
        };
      }

      const response = await api.post(endpoint, payload);

      setMessage(`Email sent successfully! Sent: ${response.data.results.sent}, Failed: ${response.data.results.failed}`);
      setSubject('');
      setContent('');
      fetchStats(); // Refresh stats
    } catch (error) {
      console.error('Error sending bulk email:', error);
      setMessage('Failed to send email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleTestEmail = async () => {
    if (!subject.trim() || !content.trim()) {
      setMessage('Please fill in both subject and content');
      return;
    }

    if (!user?.email) {
      setMessage('No email address available for testing');
      return;
    }

    setSending(true);
    setMessage('');

    try {
      await api.post('/admin/test-email', {
        email: user.email,
        subject: subject.trim(),
        content: content.trim(),
      });

      setMessage('Test email sent successfully!');
    } catch (error) {
      console.error('Error sending test email:', error);
      setMessage('Failed to send test email. Please try again.');
    } finally {
      setSending(false);
    }
  };

  if (!user?.isHost) {
    return (
      <div className="bulk-email-access-denied">
        <h2>Access Denied</h2>
        <p>You need to be a host to access bulk email functionality.</p>
      </div>
    );
  }

  return (
    <div className="bulk-email">
      <h2>Bulk Email Management</h2>

      {stats && (
        <div className="email-stats">
          <h3>Email Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Users:</span>
              <span className="stat-value">{stats.totalUsers}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Verified Emails:</span>
              <span className="stat-value">{stats.verifiedUsers} ({stats.verificationRate}%)</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Marketing Opt-ins:</span>
              <span className="stat-value">{stats.marketingOptIns} ({stats.marketingOptInRate}%)</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Session Reminders:</span>
              <span className="stat-value">{stats.sessionReminders}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Expiry Warnings:</span>
              <span className="stat-value">{stats.expiryWarnings}</span>
            </div>
          </div>
        </div>
      )}

      <div className="bulk-email-form">
        <h3>Send Bulk Email</h3>

        {message && (
          <div className={`bulk-email-message ${message.includes('successfully') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="form-group">
          <label>Email Type:</label>
          <select
            value={emailType}
            onChange={(e) => setEmailType(e.target.value)}
          >
            <option value="all">All Users</option>
            <option value="students">Students Only</option>
            <option value="hosts">Hosts Only</option>
            <option value="class">Specific Class Subscribers</option>
          </select>
        </div>

        {emailType === 'class' && (
          <div className="form-group">
            <label>Select Class:</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              required
            >
              <option value="">Choose a class...</option>
              {classes.map(cls => (
                <option key={cls._id} value={cls._id}>
                  {cls.title}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-group">
          <label>Subject:</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject line"
            required
          />
        </div>

        <div className="form-group">
          <label>Content:</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Email content (HTML supported)"
            rows={10}
            required
          />
        </div>

        <div className="form-actions">
          <button
            className="test-email-btn"
            onClick={handleTestEmail}
            disabled={sending}
          >
            Send Test Email
          </button>
          <button
            className="send-bulk-btn"
            onClick={handleSendEmail}
            disabled={sending || (emailType === 'class' && !classId)}
          >
            {sending ? 'Sending...' : 'Send Bulk Email'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkEmail;