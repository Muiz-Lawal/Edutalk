import React, { useState, useEffect } from 'react';
import PromptDialog from '../components/PromptDialog';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import '../styles/UserAppeals.css';

const UserAppealsPage = () => {
  const { user } = useAuth();
  const [appeals, setAppeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedAppeal, setSelectedAppeal] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [promptOpen, setPromptOpen] = useState(false);
  const [promptTarget, setPromptTarget] = useState(null);

  useEffect(() => {
    fetchAppeals();
  }, []);

  const [eligible, setEligible] = useState([]);

  const fetchAppeals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/moderation/appeals/my-appeals');
      setAppeals(response.data.appeals);

      // Fetch rejected items eligible for appeal
      const rej = await api.get('/moderation/my/rejected');
      setEligible(rej.data.logs || []);
    } catch (error) {
      console.error('Error fetching appeals:', error);
    } finally {
      setLoading(false);
    }
  };

  const submitAppeal = (logId) => {
    setPromptTarget(logId);
    setPromptOpen(true);
  };

  const doSubmitAppeal = async (reason) => {
    if (!reason) return;
    setPromptOpen(false);
    try {
      await api.post(`/moderation/${promptTarget}/appeal`, { reason });
      setSuccess('Appeal submitted');
      setTimeout(() => setSuccess(null), 4000);
      fetchAppeals();
    } catch (err) {
      console.error('Failed to submit appeal', err);
      setError('Failed to submit appeal');
      setTimeout(() => setError(null), 4000);
    }
  };

  if (loading) {
    return <div className="appeals-page"><div className="loading">Loading your appeals...</div></div>;
  }

  return (
    <div className="appeals-page">
      <div className="appeals-header">
        <h1>📋 My Appeals</h1>
        <p>Track and manage your content appeals</p>
      </div>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}
        <PromptDialog
          open={promptOpen}
          title="Submit Appeal"
          label="Reason"
          placeholder="Explain why this should be reinstated"
          onConfirm={doSubmitAppeal}
          onCancel={() => setPromptOpen(false)}
          confirmLabel="Submit"
          cancelLabel="Cancel"
        />

      <div className="appeals-section">
        <h2>Eligible to Appeal</h2>
        {eligible.length === 0 ? (
          <p>No recently rejected items to appeal.</p>
        ) : (
          <div className="eligible-list">
            {eligible.map(item => (
              <div key={item._id} className="eligible-card">
                <div className="eligible-meta">
                  <strong>{item.contentType.replace(/_/g, ' ')}</strong>
                  <small>Rejected: {new Date(item.rejectedAt || item.createdAt).toLocaleDateString()}</small>
                </div>
                <div className="eligible-content">{item.content.substring(0, 150)}...</div>
                <div className="eligible-actions">
                  <button onClick={() => submitAppeal(item._id)} className="btn">Submit Appeal</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="appeals-list">
        {appeals.map(appeal => (
          <div
            key={appeal._id}
            className={`appeal-card appeal-${appeal.appeal?.status || 'none'}`}
            onClick={() => setSelectedAppeal(selectedAppeal === appeal._id ? null : appeal._id)}
          >
            <div className="appeal-header">
              <div className="appeal-title">
                <span className="content-type">{appeal.contentType.replace(/_/g, ' ')}</span>
                <span className={`appeal-status status-${appeal.appeal?.status || 'none'}`}>
                  {appeal.appeal?.status ? appeal.appeal.status.toUpperCase() : 'NO APPEAL'}
                </span>
              </div>
              <small className="appeal-date">
                {new Date(appeal.createdAt).toLocaleDateString()}
              </small>
            </div>

            {selectedAppeal === appeal._id && (
              <div className="appeal-details">
                <div className="detail-section">
                  <h4>Original Content</h4>
                  <div className="content-box">
                    {appeal.content}
                  </div>
                </div>

                <div className="detail-section">
                  <h4>Rejection Reason</h4>
                  <p className="reason-text">
                    {appeal.reviewNotes || 'No specific reason provided'}
                  </p>
                </div>

                {appeal.categories && Object.keys(appeal.categories).filter(k => appeal.categories[k]).length > 0 && (
                  <div className="detail-section">
                    <h4>Violation Categories</h4>
                    <div className="categories">
                      {Object.keys(appeal.categories)
                        .filter(k => appeal.categories[k])
                        .map(category => (
                          <span key={category} className="category-badge">
                            {category.replace(/_/g, ' ')}
                          </span>
                        ))}
                    </div>
                  </div>
                )}

                {appeal.appeal?.status === 'pending' && (
                  <div className="detail-section">
                    <h4>Your Appeal</h4>
                    <p className="appeal-text">
                      <strong>Submitted:</strong> {new Date(appeal.appeal.submittedAt).toLocaleDateString()}
                    </p>
                    <p className="appeal-text">
                      <strong>Your Reason:</strong>
                    </p>
                    <div className="content-box">
                      {appeal.appeal.reason}
                    </div>
                    <p className="pending-message">
                      ⏳ Your appeal is being reviewed. You'll receive an email when a decision is made.
                    </p>
                  </div>
                )}

                {appeal.appeal?.status === 'approved' && (
                  <div className="detail-section success">
                    <h4>✅ Appeal Approved</h4>
                    <p>
                      <strong>Decision Date:</strong> {new Date(appeal.appeal.reviewedAt).toLocaleDateString()}
                    </p>
                    <p>
                      Your appeal has been approved. Your content has been restored and is now visible again.
                    </p>
                    {appeal.appeal.appealNotes && (
                      <p>
                        <strong>Admin Notes:</strong> {appeal.appeal.appealNotes}
                      </p>
                    )}
                  </div>
                )}

                {appeal.appeal?.status === 'rejected' && (
                  <div className="detail-section error">
                    <h4>❌ Appeal Rejected</h4>
                    <p>
                      <strong>Decision Date:</strong> {new Date(appeal.appeal.reviewedAt).toLocaleDateString()}
                    </p>
                    <p>
                      Your appeal has been reviewed and rejected. The original decision to reject this content stands.
                    </p>
                    {appeal.appeal.appealNotes && (
                      <p>
                        <strong>Admin Notes:</strong> {appeal.appeal.appealNotes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAppealsPage;
