import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import ProgressChart from '../components/ProgressChart';
import AtRiskStudentsList from '../components/AtRiskStudentsList';
import '../styles/HostProgressAnalyticsPage.css';

const HostProgressAnalyticsPage = () => {
  const { classId } = useParams();
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterPeriod, setFilterPeriod] = useState('week'); // week, month, all

  const handleExportCsv = async () => {
    try {
      const response = await api.get(`/progress/class/${classId}/export`, {
        params: { format: 'csv' },
        responseType: 'blob'
      });
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `class-progress-${classId}.csv`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to download CSV report');
    }
  };

  const handleEmailReport = () => {
    alert('Email reporting is not configured yet.');
  };

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const daysMap = {
          week: 7,
          month: 30,
          all: 365
        };
        const response = await api.get(`/progress/class/${classId}/analytics`, {
          params: {
            days: daysMap[filterPeriod] || 7
          }
        });

        const data = response.data?.data || response.data || {};
        setAnalytics(data);

        const dataPoints = (data.dailyMetrics || data.metricsOverTime || []).map(metric => ({
          label: new Date(metric.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          value: metric.completionRate || metric.completionRate || 0
        }));
        setChartData(dataPoints);
      } catch (err) {
        setError(err.response?.data?.message || err.message || 'Failed to fetch analytics');
      } finally {
        setLoading(false);
      }
    };

    if (classId) {
      fetchAnalytics();
    }
  }, [classId, filterPeriod]);

  if (loading) {
    return (
      <div className="host-progress-analytics-page">
        <div className="host-progress-analytics-page__loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="host-progress-analytics-page">
      <div className="host-progress-analytics-page__header">
        <h1 className="host-progress-analytics-page__title">Class Analytics & Progress</h1>
        <p className="host-progress-analytics-page__subtitle">
          Comprehensive insights into student performance and engagement
        </p>
      </div>

      {error && (
        <div className="host-progress-analytics-page__error">
          <p>Error: {error}</p>
        </div>
      )}

      {/* Period Filter */}
      <div className="host-progress-analytics-page__controls">
        <div className="host-progress-analytics-page__filter">
          <label>View Period:</label>
          <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="host-progress-analytics-page__kpis">
        <div className="host-progress-analytics-page__kpi">
          <div className="host-progress-analytics-page__kpi-label">Total Students</div>
          <div className="host-progress-analytics-page__kpi-value">
            {analytics?.totalStudents}
          </div>
          <div className="host-progress-analytics-page__kpi-change">
            {analytics?.newStudents} new this period
          </div>
        </div>

        <div className="host-progress-analytics-page__kpi">
          <div className="host-progress-analytics-page__kpi-label">Avg Completion Rate</div>
          <div className="host-progress-analytics-page__kpi-value">
            {analytics?.avgCompletionRate != null ? analytics.avgCompletionRate.toFixed(1) : '0'}%
          </div>
          <div className="host-progress-analytics-page__kpi-change">
            {analytics?.completionTrend != null ? (analytics.completionTrend > 0 ? '📈' : '📉') : '📉'} {Math.abs(analytics?.completionTrend || 0).toFixed(1)}%
          </div>
        </div>

        <div className="host-progress-analytics-page__kpi">
          <div className="host-progress-analytics-page__kpi-label">Pass Rate</div>
          <div className="host-progress-analytics-page__kpi-value">
            {analytics?.passRate != null ? analytics.passRate.toFixed(1) : '0'}%
          </div>
          <div className="host-progress-analytics-page__kpi-change">
            {analytics?.passedStudents}/{analytics?.totalStudents} students
          </div>
        </div>

        <div className="host-progress-analytics-page__kpi">
          <div className="host-progress-analytics-page__kpi-label">Avg Engagement</div>
          <div className="host-progress-analytics-page__kpi-value">
            {analytics?.avgEngagement != null ? analytics.avgEngagement.toFixed(1) : '0'}%
          </div>
          <div className="host-progress-analytics-page__kpi-change">
            {analytics?.atRiskCount || 0} students at risk
          </div>
        </div>
      </div>

      {/* Progress Trend Chart */}
      <div className="host-progress-analytics-page__section">
        <ProgressChart
          data={chartData}
          title="Student Progress Trend"
          height={350}
        />
      </div>

      {/* Detailed Stats */}
      <div className="host-progress-analytics-page__stats-grid">
        <div className="host-progress-analytics-page__stat-card">
          <h3 className="host-progress-analytics-page__card-title">Performance Distribution</h3>
          <div className="host-progress-analytics-page__distribution">
            {[
              { label: 'Excellent (90-100%)', count: analytics?.performanceDistribution?.[0] || 0, color: '#22c55e' },
              { label: 'Good (70-89%)', count: analytics?.performanceDistribution?.[1] || 0, color: '#3b82f6' },
              { label: 'Average (50-69%)', count: analytics?.performanceDistribution?.[2] || 0, color: '#f59e0b' },
              { label: 'Below Average (<50%)', count: analytics?.performanceDistribution?.[3] || 0, color: '#ef4444' }
            ].map((item, idx) => (
              <div key={idx} className="host-progress-analytics-page__distribution-row">
                <div
                  className="host-progress-analytics-page__distribution-color"
                  style={{ backgroundColor: item.color }}
                ></div>
                <div className="host-progress-analytics-page__distribution-label">{item.label}</div>
                <div className="host-progress-analytics-page__distribution-count">{item.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="host-progress-analytics-page__stat-card">
          <h3 className="host-progress-analytics-page__card-title">Course Health</h3>
          <div className="host-progress-analytics-page__health">
            <div className="host-progress-analytics-page__health-item">
              <span>Attendance Rate</span>
              <div className="host-progress-analytics-page__health-bar">
                <div 
                  className="host-progress-analytics-page__health-bar-fill"
                  style={{ width: `${analytics?.metrics?.attendanceRate || 0}%` }}
                ></div>
              </div>
              <span>{analytics?.metrics?.attendanceRate != null ? analytics.metrics.attendanceRate.toFixed(1) : '0'}%</span>
            </div>

            <div className="host-progress-analytics-page__health-item">
              <span>Assignment Completion</span>
              <div className="host-progress-analytics-page__health-bar">
                <div 
                  className="host-progress-analytics-page__health-bar-fill"
                  style={{ width: `${analytics?.metrics?.assignmentCompletion || 0}%` }}
                ></div>
              </div>
              <span>{analytics?.metrics?.assignmentCompletion != null ? analytics.metrics.assignmentCompletion.toFixed(1) : '0'}%</span>
            </div>

            <div className="host-progress-analytics-page__health-item">
              <span>Quiz Average Score</span>
              <div className="host-progress-analytics-page__health-bar">
                <div 
                  className="host-progress-analytics-page__health-bar-fill"
                  style={{ width: `${analytics?.metrics?.quizAverageScore || 0}%` }}
                ></div>
              </div>
              <span>{analytics?.metrics?.quizAverageScore != null ? analytics.metrics.quizAverageScore.toFixed(1) : '0'}%</span>
            </div>

            <div className="host-progress-analytics-page__health-item">
              <span>Participation Rate</span>
              <div className="host-progress-analytics-page__health-bar">
                <div 
                  className="host-progress-analytics-page__health-bar-fill"
                  style={{ width: `${analytics?.metrics?.participationRate || 0}%` }}
                ></div>
              </div>
              <span>{analytics?.metrics?.participationRate != null ? analytics.metrics.participationRate.toFixed(1) : '0'}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* At-Risk Students */}
      <div className="host-progress-analytics-page__section">
        <AtRiskStudentsList
          students={analytics?.atRiskStudents || []}
          title="Students Needing Intervention"
          onContactStudent={(student) => console.log('Contact:', student)}
          onViewDetails={(student) => console.log('View:', student)}
        />
      </div>

      {/* Export Options */}
      <div className="host-progress-analytics-page__actions">
        <button
          className="host-progress-analytics-page__button host-progress-analytics-page__button--primary"
          onClick={() => alert('PDF export is not available yet.')}
        >
          📊 Export Report (PDF)
        </button>
        <button
          className="host-progress-analytics-page__button host-progress-analytics-page__button--secondary"
          onClick={handleExportCsv}
        >
          📥 Download Data (CSV)
        </button>
        <button
          className="host-progress-analytics-page__button host-progress-analytics-page__button--secondary"
          onClick={handleEmailReport}
        >
          📧 Email Report to Students
        </button>
      </div>
    </div>
  );
};

export default HostProgressAnalyticsPage;
