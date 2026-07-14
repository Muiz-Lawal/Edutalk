import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import ProgressChart from '../components/ProgressChart';
import AtRiskStudentsList from '../components/AtRiskStudentsList';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/ClassProgressPage.css';

const ClassProgressPage = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const [classData, setClassData] = useState(null);
  const [progressChart, setProgressChart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const fetchClassProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      if (!token) {
        setError('Authentication required. Please log in.');
        return;
      }

      if (!classId) {
        setError('Class ID is missing.');
        return;
      }

      const response = await api.get(`/progress/class/${classId}`);
      const responseData = response.data?.data || response.data || {};
      const students = responseData.students || [];
      const chartData = students
        .sort((a, b) => (b.completion || 0) - (a.completion || 0))
        .slice(0, 7)
        .map((student) => ({
          label: student.name || 'Student',
          value: student.completion || 0
        }));

      setClassData({
        ...responseData,
        className: responseData.className || responseData.classTitle || responseData.class?.title || responseData.title || 'Class Progress',
        passRate: responseData.passRate != null ? responseData.passRate : responseData.completionRate || 0,
        completionRate: responseData.completionRate != null ? responseData.completionRate : responseData.passRate || 0,
        completionDistribution: responseData.completionDistribution || [
          students.filter(s => s.completion < 25).length,
          students.filter(s => s.completion >= 25 && s.completion < 50).length,
          students.filter(s => s.completion >= 50 && s.completion < 75).length,
          students.filter(s => s.completion >= 75).length
        ],
        metrics: responseData.metrics || {
          avgAttendance: responseData.metrics?.avgAttendance || 0,
          quizCompletion: responseData.metrics?.quizCompletion || 0,
          participationRate: responseData.metrics?.participationRate || 0,
          avgSessionDuration: responseData.metrics?.avgSessionDuration || 0
        },
        atRiskStudents: responseData.atRiskStudents || []
      });
      setProgressChart(chartData);
    } catch (err) {
      console.error('Class progress fetch error:', err);
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchClassProgress();
    }
  }, [classId]);

  const handleRetry = async () => {
    setRetrying(true);
    await fetchClassProgress();
  };

  if (loading) {
    return (
      <div className="class-progress-page">
        <LoadingSpinner fullPage={true} message="Loading class progress..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="class-progress-page">
        <div className="class-progress-page__error">
          <div className="class-progress-page__error-icon">⚠️</div>
          <div className="class-progress-page__error-content">
            <p className="class-progress-page__error-message">{error}</p>
            <button 
              className="class-progress-page__error-button"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? 'Retrying...' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="class-progress-page">
      <div className="class-progress-page__header">
        <h1 className="class-progress-page__title">
          {classData?.className || 'Class Progress'}
        </h1>
        <p className="class-progress-page__subtitle">
          Detailed progress tracking for {classData?.totalStudents || 0} enrolled students
        </p>
      </div>

      <div className="class-progress-page__overview">
        <div className="class-progress-page__overview-item">
          <div className="class-progress-page__overview-label">Total Students</div>
          <div className="class-progress-page__overview-value">{classData?.totalStudents}</div>
        </div>

        <div className="class-progress-page__overview-item">
          <div className="class-progress-page__overview-label">Avg. Completion</div>
          <div className="class-progress-page__overview-value">
            {classData?.averageCompletion?.toFixed(1)}%
          </div>
        </div>

        <div className="class-progress-page__overview-item">
          <div className="class-progress-page__overview-label">Pass Rate</div>
          <div className="class-progress-page__overview-value">
            {classData?.passRate?.toFixed(1)}%
          </div>
        </div>

        <div className="class-progress-page__overview-item">
          <div className="class-progress-page__overview-label">Avg. Score</div>
          <div className="class-progress-page__overview-value">
            {classData?.averageScore?.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="class-progress-page__content">
        <div className="class-progress-page__section">
          <ProgressChart
            data={progressChart}
            title="Class Progress Trend"
            height={300}
          />
        </div>

        <div className="class-progress-page__section">
          <div className="class-progress-page__stats-grid">
            <div className="class-progress-page__stat-card">
              <h3 className="class-progress-page__stat-title">Completion Distribution</h3>
              <div className="class-progress-page__stat-content">
                <div className="class-progress-page__distribution-item">
                  <span>0-25%</span>
                  <div className="class-progress-page__bar">
                    <div 
                      className="class-progress-page__bar-fill class-progress-page__bar-fill--danger"
                      style={{ width: `${(classData?.completionDistribution?.[0] || 0) * 10}%` }}
                    ></div>
                  </div>
                  <span>{classData?.completionDistribution?.[0] || 0} students</span>
                </div>

                <div className="class-progress-page__distribution-item">
                  <span>25-50%</span>
                  <div className="class-progress-page__bar">
                    <div 
                      className="class-progress-page__bar-fill class-progress-page__bar-fill--warning"
                      style={{ width: `${(classData?.completionDistribution?.[1] || 0) * 10}%` }}
                    ></div>
                  </div>
                  <span>{classData?.completionDistribution?.[1] || 0} students</span>
                </div>

                <div className="class-progress-page__distribution-item">
                  <span>50-75%</span>
                  <div className="class-progress-page__bar">
                    <div 
                      className="class-progress-page__bar-fill class-progress-page__bar-fill--info"
                      style={{ width: `${(classData?.completionDistribution?.[2] || 0) * 10}%` }}
                    ></div>
                  </div>
                  <span>{classData?.completionDistribution?.[2] || 0} students</span>
                </div>

                <div className="class-progress-page__distribution-item">
                  <span>75-100%</span>
                  <div className="class-progress-page__bar">
                    <div 
                      className="class-progress-page__bar-fill class-progress-page__bar-fill--success"
                      style={{ width: `${(classData?.completionDistribution?.[3] || 0) * 10}%` }}
                    ></div>
                  </div>
                  <span>{classData?.completionDistribution?.[3] || 0} students</span>
                </div>
              </div>
            </div>

            <div className="class-progress-page__stat-card">
              <h3 className="class-progress-page__stat-title">Engagement Metrics</h3>
              <div className="class-progress-page__stat-content">
                <div className="class-progress-page__metric">
                  <span className="class-progress-page__metric-label">Avg Attendance</span>
                  <span className="class-progress-page__metric-value">
                    {classData?.metrics?.avgAttendance?.toFixed(1)}%
                  </span>
                </div>
                <div className="class-progress-page__metric">
                  <span className="class-progress-page__metric-label">Quiz Completion</span>
                  <span className="class-progress-page__metric-value">
                    {classData?.metrics?.quizCompletion?.toFixed(1)}%
                  </span>
                </div>
                <div className="class-progress-page__metric">
                  <span className="class-progress-page__metric-label">Participation Rate</span>
                  <span className="class-progress-page__metric-value">
                    {classData?.metrics?.participationRate?.toFixed(1)}%
                  </span>
                </div>
                <div className="class-progress-page__metric">
                  <span className="class-progress-page__metric-label">Avg Session Duration</span>
                  <span className="class-progress-page__metric-value">
                    {classData?.metrics?.avgSessionDuration} min
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="class-progress-page__section">
          <AtRiskStudentsList
            students={classData?.atRiskStudents || []}
            title="Students Needing Support"
          />
        </div>
      </div>
    </div>
  );
};

export default ClassProgressPage;
