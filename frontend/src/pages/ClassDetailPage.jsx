import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import useEventLogger from '../hooks/useEventLogger';
import '../styles/ClassDetail.css';

export default function ClassDetailPage() {
  const { classId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(1);

  useEffect(() => {
    fetchClass();
  }, [classId]);

  // Log that user viewed this class
  const { logEvent } = useEventLogger();
  useEffect(() => {
    if (classData) {
      logEvent({ action: 'view_class', targetType: 'class', targetId: classData._id });
    }
  }, [classData]);

  const fetchClass = async () => {
    try {
      const response = await api.get(`/classes/${classId}`);
      setClassData(response.data);
    } catch (error) {
      console.error('Failed to fetch class:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      // Redirect to payment flow
      navigate(`/class/${classId}/enroll?days=${selectedDays}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading class details...</div>;
  }

  if (!classData) {
    return <div className="error">Class not found</div>;
  }

  return (
    <div className="class-detail-page">
      <div className="container">
        <div className="class-header">
          <h1>{classData.title}</h1>
          <p className="host-info">by {classData.hostId?.firstName} {classData.hostId?.lastName}</p>
        </div>

        <div className="class-content">
          <div className="class-main">
            <div className="class-intro">
              {classData.thumbnailImage ? (
                <img src={classData.thumbnailImage} alt={classData.title} />
              ) : (
                <div className="placeholder">📚</div>
              )}
            </div>

            <section className="section">
              <h2>About This Class</h2>
              <p>{classData.description}</p>
            </section>

            <section className="section">
              <h2>Schedule</h2>
              <div className="schedule-info">
                {classData.schedule && classData.schedule.length > 0 ? (
                  <ul>
                    {classData.schedule.map((session, idx) => (
                      <li key={idx}>
                        {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][session.dayOfWeek]} at {session.startTime}
                        ({session.duration} minutes)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Schedule to be announced</p>
                )}
              </div>
            </section>

            <section className="section">
              <h2>Sessions ({classData.sessions?.length || 0})</h2>
              <div className="sessions-list">
                {classData.sessions && classData.sessions.length > 0 ? (
                  classData.sessions.slice(0, 5).map((session) => (
                    <div key={session._id} className="session-item">
                      <span className="session-date">
                        {new Date(session.scheduledStartTime).toLocaleDateString()}
                      </span>
                      <span className="session-time">
                        {new Date(session.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <p>No sessions scheduled yet</p>
                )}
              </div>
            </section>

            <section className="section">
              <h2>Category & Tags</h2>
              <div className="tags">
                {classData.category && <span className="tag category">{classData.category}</span>}
                {classData.tags?.map((tag) => (
                  <span key={tag} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          </div>

          <aside className="class-sidebar">
            <div className="enrollment-card">
              <div className="price-info">
                <h3>Pricing</h3>
                <p className="monthly-price">${classData.monthlyPrice}/month</p>
                <p className="daily-rate">Starting from ${(classData.monthlyPrice / 30).toFixed(2)}/day</p>
              </div>

              <div className="days-selector">
                <label>Select Duration</label>
                <input
                  type="range"
                  min={classData.minPurchaseDays || 1}
                  max="30"
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(parseInt(e.target.value))}
                />
                <p className="days-display">{selectedDays} days selected</p>
              </div>

              <div className="price-calculation">
                <p>
                  <strong>Total Price:</strong> $
                  {(
                    (classData.monthlyPrice / 30) *
                    (selectedDays <= 3 ? 1.8 : selectedDays <= 6 ? 1.5 : selectedDays <= 13 ? 1.25 : selectedDays <= 20 ? 1.1 : 1) *
                    selectedDays
                  ).toFixed(2)}
                </p>
              </div>

              <button className="btn btn-primary" onClick={() => {
                logEvent({ action: 'click_enroll', targetType: 'class', targetId: classData._id });
                handleEnroll();
              }}>
                {isAuthenticated ? 'Enroll Now' : 'Sign in to Enroll'}
              </button>

              <div className="class-stats">
                <div className="stat">
                  <span className="label">Students</span>
                  <span className="value">{classData.totalEnrolled}</span>
                </div>
                <div className="stat">
                  <span className="label">Rating</span>
                  <span className="value">⭐ {classData.averageRating?.toFixed(1) || 'N/A'}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
