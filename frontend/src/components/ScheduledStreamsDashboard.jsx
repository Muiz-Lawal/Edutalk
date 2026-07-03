import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import ScheduleCard from './ScheduleCard';
import '../styles/ScheduledStreamsDashboard.css';

export default function ScheduledStreamsDashboard({ hostId, onRefresh }) {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    fetchSchedules();
    const interval = setInterval(fetchSchedules, 30000);
    return () => clearInterval(interval);
  }, [hostId]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/schedules/host/${hostId}`);
      setSchedules(response.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching schedules:', err);
      setError('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  };

  const categorizeSchedules = (allSchedules) => {
    const now = new Date();
    return {
      upcoming: allSchedules.filter(s => new Date(s.scheduledStartTime) > now && s.status !== 'cancelled'),
      active: allSchedules.filter(s => s.status === 'live'),
      past: allSchedules.filter(s => new Date(s.scheduledStartTime) <= now || s.status === 'completed')
    };
  };

  const getCategorized = categorizeSchedules(schedules);
  const tabData = getCategorized[activeTab];

  const filteredSchedules = tabData.filter(schedule =>
    schedule.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (schedule.description && schedule.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const paginatedSchedules = filteredSchedules.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);

  const handleEdit = async (schedule) => {
    // This would typically navigate to edit page or open modal
    console.log('Edit schedule:', schedule);
  };

  const handleCancel = async (schedule) => {
    if (!window.confirm('Are you sure you want to cancel this schedule?')) return;

    try {
      await api.put(`/schedules/${schedule._id}`, { status: 'cancelled' });
      fetchSchedules();
    } catch (err) {
      console.error('Error cancelling schedule:', err);
      setError('Failed to cancel schedule');
    }
  };

  const handleViewDetails = (schedule) => {
    console.log('View details:', schedule);
  };

  const getStats = () => ({
    upcoming: getCategorized.upcoming.length,
    active: getCategorized.active.length,
    past: getCategorized.past.length
  });

  const stats = getStats();

  const getEmptyMessage = () => {
    const messages = {
      upcoming: 'No upcoming scheduled streams. Create one to get started!',
      active: 'No active streams right now.',
      past: 'No completed streams yet.'
    };
    return messages[activeTab];
  };

  return (
    <div className="scheduled-streams-dashboard">
      {/* Stats Section */}
      <div className="stats-section">
        <div className="stat-card">
          <div className="stat-number">{stats.upcoming}</div>
          <div className="stat-label">Upcoming</div>
        </div>
        <div className="stat-card active">
          <div className="stat-number">{stats.active}</div>
          <div className="stat-label">Active Now</div>
        </div>
        <div className="stat-card completed">
          <div className="stat-number">{stats.past}</div>
          <div className="stat-label">Past</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('upcoming');
            setCurrentPage(1);
          }}
        >
          📅 Upcoming ({stats.upcoming})
        </button>
        <button
          className={`tab-button ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('active');
            setCurrentPage(1);
          }}
        >
          🔴 Active ({stats.active})
        </button>
        <button
          className={`tab-button ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('past');
            setCurrentPage(1);
          }}
        >
          ✅ Past ({stats.past})
        </button>
      </div>

      {/* Search and Create Section */}
      <div className="controls-section">
        <input
          type="text"
          placeholder="Search schedules by title or description..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />
        <button className="create-btn" onClick={() => window.location.href = '/schedules'}>
          ➕ Create New Schedule
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={fetchSchedules}>Retry</button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading schedules...</p>
        </div>
      )}

      {/* Schedules List */}
      {!loading && (
        <>
          {paginatedSchedules.length > 0 ? (
            <div className="schedules-list">
              {paginatedSchedules.map(schedule => (
                <ScheduleCard
                  key={schedule._id}
                  schedule={schedule}
                  onEdit={handleEdit}
                  onCancel={handleCancel}
                  onViewDetails={handleViewDetails}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <p>{getEmptyMessage()}</p>
              {activeTab === 'upcoming' && (
                <button 
                  className="create-btn-primary"
                  onClick={() => window.location.href = '/schedules'}
                >
                  Create Your First Schedule
                </button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="pagination-btn"
              >
                ← Previous
              </button>
              <span className="pagination-info">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                className="pagination-btn"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
