import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import useEventLogger from '../hooks/useEventLogger';
import ProgressCard from '../components/ProgressCard';
import ProgressTimeline from '../components/ProgressTimeline';
import api from '../utils/api';
import '../styles/StudentProgressPage.css';
import { Skeleton } from '../components/AsyncBoundary';
import { formatDate } from '../lib/date';

const StudentProgressPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { logEvent } = useEventLogger();
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEnrollment, setSelectedEnrollment] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/progress/my-progress');
      const responseData = response.data?.data || response.data || [];
      const enrollmentsData = Array.isArray(responseData) ? responseData : responseData.enrollments || [];
      setEnrollments(enrollmentsData);
      if (enrollmentsData.length > 0) {
        setSelectedEnrollment(enrollmentsData[0]);
      }
    } catch (err) {
      console.error('Progress fetch error:', err);
      console.error('Progress fetch error:', err);
      setError(true);
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchProgress();
      logEvent('view_progress', 'student_progress', user.id);
    }
  }, [user]);

  const handleRetry = async () => {
    setRetrying(true);
    await fetchProgress();
  };

  if (loading) {
    return <div className="student-progress-page"><Skeleton variant="block" /></div>;
  }

  return (
    <div className="student-progress-page">
      <div className="student-progress-page__header">
        <h1 className="student-progress-page__title">My Learning Progress</h1>
        <p className="student-progress-page__subtitle">Track your course completion and achievements</p>
      </div>

      {error && (
        <div className="student-progress-page__error">
          <div className="student-progress-page__error-icon">⚠️</div>
          <div className="student-progress-page__error-content">
            <p className="student-progress-page__error-message">We couldn’t load your progress. Please try again.</p>
            <button 
              className="student-progress-page__error-button"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      )}

      <div className="student-progress-page__container">
        <div className="student-progress-page__grid">
          <div className="student-progress-page__cards">
            <h2 className="student-progress-page__section-title">My Courses</h2>
            {enrollments.length === 0 ? (
              <div className="student-progress-page__empty">
                <p>No enrolled courses yet</p>
                <button type="button" className="btn btn-primary" onClick={() => navigate('/browse')}>Browse classes</button>
              </div>
            ) : (
              <div className="student-progress-page__cards-grid">
                {enrollments.map((enrollment) => (
                  <ProgressCard
                    key={enrollment.enrollmentId}
                    title={enrollment.className}
                    percentage={enrollment.completionPercentage}
                    daysElapsed={enrollment.daysElapsed}
                    daysRemaining={enrollment.daysRemaining}
                    enrollmentId={enrollment.enrollmentId}
                    isCompletionCard={enrollment.completionPercentage === 100}
                    onClick={() => setSelectedEnrollment(enrollment)}
                  />
                ))}
              </div>
            )}
          </div>

          {selectedEnrollment && (
            <div className="student-progress-page__details">
              <h2 className="student-progress-page__section-title">
                {selectedEnrollment.className}
              </h2>

              <div className="student-progress-page__stats">
                <div className="student-progress-page__stat-box">
                  <div className="student-progress-page__stat-label">Overall Progress</div>
                  <div className="student-progress-page__stat-value">
                    {selectedEnrollment.completionPercentage}%
                  </div>
                </div>

                <div className="student-progress-page__stat-box">
                  <div className="student-progress-page__stat-label">Current Grade</div>
                  <div className="student-progress-page__stat-value">
                    {selectedEnrollment.currentGrade || 'N/A'}
                  </div>
                </div>

                <div className="student-progress-page__stat-box">
                  <div className="student-progress-page__stat-label">Engagement Score</div>
                  <div className="student-progress-page__stat-value">
                    {typeof selectedEnrollment.engagementScore === 'number'
                      ? `${selectedEnrollment.engagementScore <= 1 ? (selectedEnrollment.engagementScore * 100).toFixed(0) : selectedEnrollment.engagementScore.toFixed(0)}%`
                      : 'N/A'}
                  </div>
                </div>

                <div className="student-progress-page__stat-box">
                  <div className="student-progress-page__stat-label">Estimated Completion</div>
                  <div className="student-progress-page__stat-value">
                    {selectedEnrollment.estimatedCompletionDate
                      ? formatDate(selectedEnrollment.estimatedCompletionDate)
                      : 'TBD'}
                  </div>
                </div>
              </div>

              {selectedEnrollment.activities && (
                <ProgressTimeline
                  events={selectedEnrollment.activities}
                  title="Recent Activity"
                />
              )}

              <div className="student-progress-page__actions">
                <button className="student-progress-page__button student-progress-page__button--primary">
                  View Detailed Analytics
                </button>
                <button className="student-progress-page__button student-progress-page__button--secondary">
                  💬 Contact Instructor
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentProgressPage;
