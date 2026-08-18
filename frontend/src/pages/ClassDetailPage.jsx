import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { getClassById, getClassSchedule, calculatePricing } from '../utils/api';
import useEventLogger from '../hooks/useEventLogger';
import '../styles/ClassDetail.css';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const getFallbackPrice = (monthlyPrice, days) => {
  const multiplier = days <= 3 ? 1.8 : days <= 6 ? 1.5 : days <= 13 ? 1.25 : days <= 20 ? 1.1 : 1;
  return monthlyPrice * (multiplier / 30) * days;
};

export default function ClassDetailPage() {
  const { classId } = useParams();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { logEvent } = useEventLogger();
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDays, setSelectedDays] = useState(1);
  const [totalPrice, setTotalPrice] = useState(null);
  const [perDayPrice, setPerDayPrice] = useState(null);
  const [pricingTiers, setPricingTiers] = useState([]);
  const [sessionCount, setSessionCount] = useState(0);

  useEffect(() => {
    const fetchClass = async () => {
      try {
        const data = await getClassById(classId);
        const payload = data?.class || data;
        setClassData(payload);
        setPricingTiers(data?.pricingTiers || []);
        setSessionCount(data?.totalSessions || 0);
        try {
          const sched = await getClassSchedule(classId);
          const sessions = sched?.upcomingSessions || sched?.sessions || sched?.schedule || [];
          setClassData((prev) => (prev ? { ...prev, sessions } : prev));
        } catch (schedErr) {
          console.warn('Failed to fetch schedule', schedErr);
        }
      } catch (error) {
        console.error('Failed to fetch class:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchClass();
  }, [classId]);

  useEffect(() => {
    if (classData) {
      logEvent({ action: 'view_class', targetType: 'class', targetId: classData._id });
    }
  }, [classData, logEvent]);

  useEffect(() => {
    const fetchPricing = async () => {
      if (!classData?.monthlyPrice) return;
      try {
        const res = await calculatePricing(classData.monthlyPrice, selectedDays);
        const total = res?.total || res?.price || res?.totalPrice || res?.amount || null;
        const perDay = res?.perDay || res?.per_day || (total && selectedDays ? total / selectedDays : null);
        setTotalPrice(total);
        setPerDayPrice(perDay);
      } catch (err) {
        console.warn('Pricing fetch failed', err);
        setTotalPrice(getFallbackPrice(classData.monthlyPrice, selectedDays));
        setPerDayPrice(getFallbackPrice(classData.monthlyPrice, selectedDays) / selectedDays);
      }
    };

    fetchPricing();
  }, [classData?.monthlyPrice, selectedDays]);

  const handleEnroll = () => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      navigate(`/class/${classId}/enroll?days=${selectedDays}`);
    }
  };

  if (loading) {
    return <div className="loading">Loading class details...</div>;
  }

  if (!classData) {
    return <div className="error">Class not found</div>;
  }

  const minDays = classData.minPurchaseDays || 1;
  const maxDays = classData.maxPurchaseDays || 30;
  const hostName = [classData.hostId?.firstName, classData.hostId?.lastName].filter(Boolean).join(' ') || 'EduTalk host';
  const scheduleEntries = classData.schedule || [];
  const sessions = classData.sessions || [];
  const featuredTags = classData.tags?.slice(0, 6) || [];

  return (
    <div className="class-detail-page">
      <div className="container">
        <div className="class-header">
          <div className="class-header__content">
            <div className="class-badges">
              {classData.category && <span className="tag tag--category">{classData.category}</span>}
              {sessionCount > 0 && <span className="tag">{sessionCount} upcoming sessions</span>}
            </div>
            <h1>{classData.title}</h1>
            <p className="host-info">by {hostName}</p>
            <p className="class-summary">{classData.description?.slice(0, 180)}{classData.description?.length > 180 ? '…' : ''}</p>
          </div>
          <button className="btn btn-primary btn-inline" onClick={() => {
            logEvent({ action: 'click_enroll', targetType: 'class', targetId: classData._id });
            handleEnroll();
          }}>
            {isAuthenticated ? 'Enroll Now' : 'Sign in to Enroll'}
          </button>
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
              <h2>What you’ll get</h2>
              <div className="benefit-list">
                <div className="benefit-item">Live sessions tailored to your schedule</div>
                <div className="benefit-item">Personalized feedback and accountability</div>
                <div className="benefit-item">Access to recorded lessons and class notes</div>
              </div>
            </section>

            <section className="section">
              <h2>Schedule</h2>
              <div className="schedule-info">
                {scheduleEntries.length > 0 ? (
                  <ul>
                    {scheduleEntries.map((session, idx) => (
                      <li key={idx}>
                        <span className="schedule-day">{dayNames[session.dayOfWeek] || 'Flexible'}</span>
                        <span className="schedule-time">{session.startTime} • {session.duration || 60} min</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Schedule to be announced</p>
                )}
              </div>
            </section>

            <section className="section">
              <h2>Upcoming Sessions ({sessions.length})</h2>
              <div className="sessions-list">
                {sessions.length > 0 ? (
                  sessions.slice(0, 5).map((session, index) => (
                    <div key={session._id || `${session.scheduledStartTime}-${index}`} className="session-item">
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
              <h2>About the host</h2>
              <div className="host-card">
                <div className="host-card__avatar">{hostName.charAt(0).toUpperCase()}</div>
                <div>
                  <h3>{hostName}</h3>
                  <p>{classData.hostId?.bio || 'The host is preparing a great learning experience for students.'}</p>
                </div>
              </div>
            </section>

            <section className="section">
              <h2>Category & Tags</h2>
              <div className="tags">
                {classData.category && <span className="tag tag--category">{classData.category}</span>}
                {featuredTags.map((tag) => (
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
                <label htmlFor="days-selector">Select Duration</label>
                <input
                  id="days-selector"
                  type="range"
                  min={minDays}
                  max={maxDays}
                  value={selectedDays}
                  onChange={(e) => setSelectedDays(parseInt(e.target.value, 10))}
                />
                <p className="days-display">{selectedDays} day{selectedDays === 1 ? '' : 's'} selected</p>
              </div>

              <div className="price-calculation">
                <p><strong>Total Price:</strong> {totalPrice != null ? `$${Number(totalPrice).toFixed(2)}` : `$${getFallbackPrice(classData.monthlyPrice, selectedDays).toFixed(2)}`}</p>
                {perDayPrice != null && <p className="price-per-day">Per day: ${Number(perDayPrice).toFixed(2)}</p>}
              </div>

              {pricingTiers.length > 0 && (
                <div className="pricing-tiers">
                  <h4>Flexible pricing</h4>
                  <ul>
                    {pricingTiers.map((tier) => (
                      <li key={tier.days}>
                        <span>{tier.days} days</span>
                        <strong>${tier.price.toFixed(2)}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button className="btn btn-primary" onClick={() => {
                logEvent({ action: 'click_enroll', targetType: 'class', targetId: classData._id });
                handleEnroll();
              }}>
                {isAuthenticated ? 'Enroll Now' : 'Sign in to Enroll'}
              </button>

              <div className="class-stats">
                <div className="stat">
                  <span className="label">Students</span>
                  <span className="value">{classData.totalEnrolled || 0}</span>
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
