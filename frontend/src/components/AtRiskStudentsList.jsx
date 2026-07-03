import React, { useState } from 'react';
import '../styles/AtRiskStudentsList.css';

const AtRiskStudentsList = ({ 
  students = [], 
  title = 'At-Risk Students',
  onContactStudent,
  onViewDetails 
}) => {
  const [filter, setFilter] = useState('all'); // all, critical, warning
  const [sortBy, setSortBy] = useState('score'); // score, attendance, engagement

  const getRiskLevel = (riskScore) => {
    if (riskScore >= 0.75) return { level: 'critical', label: 'Critical', color: '#ef4444' };
    if (riskScore >= 0.5) return { level: 'warning', label: 'Warning', color: '#f59e0b' };
    return { level: 'monitoring', label: 'Monitoring', color: '#3b82f6' };
  };

  const getRecommendations = (student) => {
    const recommendations = [];
    if (student.attendanceRate < 0.7) {
      recommendations.push('Increase attendance');
    }
    if (student.avgScore < 60) {
      recommendations.push('Additional tutoring');
    }
    if (student.engagementScore < 0.5) {
      recommendations.push('Increase participation');
    }
    if (student.daysInactive > 7) {
      recommendations.push('Check in with student');
    }
    return recommendations;
  };

  const filteredStudents = students.filter(student => {
    if (filter === 'all') return true;
    const risk = getRiskLevel(student.riskScore);
    return risk.level === filter;
  });

  const sortedStudents = [...filteredStudents].sort((a, b) => {
    if (sortBy === 'score') return b.avgScore - a.avgScore;
    if (sortBy === 'attendance') return b.attendanceRate - a.attendanceRate;
    if (sortBy === 'engagement') return b.engagementScore - a.engagementScore;
    return b.riskScore - a.riskScore;
  });

  if (!students || students.length === 0) {
    return (
      <div className="at-risk-students-list">
        <h3 className="at-risk-students-list__title">{title}</h3>
        <div className="at-risk-students-list__empty">
          <p>✓ All students are on track!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="at-risk-students-list">
      <div className="at-risk-students-list__header">
        <h3 className="at-risk-students-list__title">{title}</h3>
        <span className="at-risk-students-list__badge">
          {sortedStudents.length} student{sortedStudents.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Controls */}
      <div className="at-risk-students-list__controls">
        <div className="at-risk-students-list__filter">
          <label className="at-risk-students-list__label">Filter:</label>
          <select 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="at-risk-students-list__select"
          >
            <option value="all">All Students</option>
            <option value="critical">Critical Risk</option>
            <option value="warning">Warning</option>
          </select>
        </div>

        <div className="at-risk-students-list__sort">
          <label className="at-risk-students-list__label">Sort by:</label>
          <select 
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="at-risk-students-list__select"
          >
            <option value="score">Lowest Score First</option>
            <option value="attendance">Lowest Attendance</option>
            <option value="engagement">Lowest Engagement</option>
          </select>
        </div>
      </div>

      {/* Student List */}
      <div className="at-risk-students-list__container">
        {sortedStudents.map((student) => {
          const risk = getRiskLevel(student.riskScore);
          const recommendations = getRecommendations(student);

          return (
            <div 
              key={student.studentId}
              className={`at-risk-students-list__item at-risk-students-list__item--${risk.level}`}
            >
              <div className="at-risk-students-list__risk-indicator">
                <div 
                  className="at-risk-students-list__risk-dot"
                  style={{ backgroundColor: risk.color }}
                  title={`${risk.label} Risk`}
                ></div>
                <span className="at-risk-students-list__risk-label">{risk.label}</span>
              </div>

              <div className="at-risk-students-list__info">
                <h4 className="at-risk-students-list__student-name">
                  {student.studentName || 'Student'}
                </h4>
                <p className="at-risk-students-list__student-email">
                  {student.studentEmail}
                </p>
              </div>

              <div className="at-risk-students-list__metrics">
                <div className="at-risk-students-list__metric">
                  <span className="at-risk-students-list__metric-label">Score</span>
                  <span className="at-risk-students-list__metric-value">
                    {student.avgScore.toFixed(1)}%
                  </span>
                </div>
                <div className="at-risk-students-list__metric">
                  <span className="at-risk-students-list__metric-label">Attendance</span>
                  <span className="at-risk-students-list__metric-value">
                    {(student.attendanceRate * 100).toFixed(0)}%
                  </span>
                </div>
                <div className="at-risk-students-list__metric">
                  <span className="at-risk-students-list__metric-label">Days Inactive</span>
                  <span className="at-risk-students-list__metric-value">
                    {student.daysInactive}d
                  </span>
                </div>
              </div>

              <div className="at-risk-students-list__recommendations">
                <p className="at-risk-students-list__rec-title">Recommendations:</p>
                <ul className="at-risk-students-list__rec-list">
                  {recommendations.map((rec, idx) => (
                    <li key={idx} className="at-risk-students-list__rec-item">
                      • {rec}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="at-risk-students-list__actions">
                {onContactStudent && (
                  <button
                    className="at-risk-students-list__button at-risk-students-list__button--contact"
                    onClick={() => onContactStudent(student)}
                    title="Send message to student"
                  >
                    📧 Contact
                  </button>
                )}
                {onViewDetails && (
                  <button
                    className="at-risk-students-list__button at-risk-students-list__button--details"
                    onClick={() => onViewDetails(student)}
                    title="View student details"
                  >
                    📊 Details
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AtRiskStudentsList;
