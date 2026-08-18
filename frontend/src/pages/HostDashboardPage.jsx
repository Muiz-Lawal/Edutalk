import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate, Link, useLocation, useSearchParams } from 'react-router-dom';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import RecommendationMetrics from '../components/RecommendationMetrics';
import ClassForm from '../components/ClassForm';
import { getHostClasses, deleteClass } from '../utils/api';
import '../styles/Dashboard.css';

export default function HostDashboardPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [classes, setClasses] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [actionMessage, setActionMessage] = useState('');
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [classToEdit, setClassToEdit] = useState(null);

  useEffect(() => {
    if (isAuthenticated && user?.isHost) {
      fetchHostClasses();
    }
  }, [isAuthenticated, user?.isHost]);

  useEffect(() => {
    const modal = searchParams.get('modal');
    const editId = searchParams.get('edit');

    if (modal === 'create') {
      setClassToEdit(null);
      setIsClassModalOpen(true);
      return;
    }

    if (modal === 'edit' && editId) {
      setClassToEdit({ _id: editId });
      setIsClassModalOpen(true);
      return;
    }

    if (!modal && isClassModalOpen) {
      setClassToEdit(null);
      setIsClassModalOpen(false);
    }
  }, [searchParams, isClassModalOpen]);

  const fetchHostClasses = async () => {
    try {
      const response = await getHostClasses();
      const hostClasses = response?.classes || response || [];
      setClasses(hostClasses);
      if (hostClasses.length > 0 && !selectedClassId) {
        setSelectedClassId(hostClasses[0]._id);
      }
    } catch (error) {
      console.error('Failed to fetch host classes:', error);
      setActionMessage('Unable to load your classes right now.');
    }
  };

  const openCreateModal = () => {
    setClassToEdit(null);
    setIsClassModalOpen(true);
  };

  const openEditModal = (cls) => {
    setClassToEdit(cls);
    setIsClassModalOpen(true);
  };

  const closeClassModal = () => {
    setIsClassModalOpen(false);
    setClassToEdit(null);
  };

  const handleClassModalSuccess = async (_classData, meta = {}) => {
    setActionMessage(meta.isEditing ? 'Class updated successfully.' : 'Class created successfully.');
    setIsClassModalOpen(false);
    setClassToEdit(null);
    await fetchHostClasses();
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm('Delete this class?')) return;
    try {
      await deleteClass(classId);
      setActionMessage('Class deleted successfully.');
      await fetchHostClasses();
    } catch (error) {
      console.error('Failed to delete class:', error);
      setActionMessage('Failed to delete class.');
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated || !user?.isHost) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-page">
      <div className="container">
        <div className="dashboard-header">
          <div>
            <h1>Host Dashboard</h1>
            <p>Manage your classes, sessions, and student insights from one place.</p>
          </div>
          <div className="dashboard-header-actions">
            <button type="button" className="btn btn-primary" onClick={openCreateModal}>+ Create Class</button>
          </div>
        </div>

        {actionMessage && <div className={`dashboard-alert ${actionMessage.includes('Failed') ? 'dashboard-alert--error' : ''}`}>{actionMessage}</div>}

        <div className="host-stats">
          <div className="stat-card">
            <h3>Total Classes</h3>
            <p className="stat-number">{classes.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Students</h3>
            <p className="stat-number">{user?.totalActiveStudents || 0}</p>
          </div>
          <div className="stat-card">
            <h3>Plan Tier</h3>
            <p className="stat-text">{user?.planTier?.toUpperCase() || 'STARTER'}</p>
          </div>
          <div className="stat-card">
            <h3>Average Rating</h3>
            <p className="stat-number">{user?.averageRating?.toFixed(1) || '0'}</p>
          </div>
        </div>

        <div className="dashboard-grid">
          <section className="dashboard-card quick-actions-card">
            <h2>Quick Actions</h2>
            <div className="quick-actions-grid">
              <Link to="/moderation" className="btn btn-primary">🛡️ Moderation</Link>
              <Link to="/appeals" className="btn btn-primary">📋 Appeals</Link>
              <Link to="/analytics" className="btn btn-primary">📊 Analytics</Link>
              <Link to="/schedules" className="btn btn-primary">📅 Schedules</Link>
            </div>
          </section>

          <section className="dashboard-card">
            <h2>My Classes</h2>
            {classes.length > 0 ? (
              <div className="class-list">
                {classes.map((cls) => (
                  <div key={cls._id} className={`class-item ${selectedClassId === cls._id ? 'active' : ''}`}>
                    <div className="class-item__main" onClick={() => setSelectedClassId(cls._id)}>
                      <div className="class-item__top">
                        <h4>{cls.title}</h4>
                        <span className="class-item__badge">{cls.category || 'General'}</span>
                      </div>
                      <p className="class-item__meta">
                        {cls.monthlyPrice ? `$${cls.monthlyPrice}/mo` : 'Flexible pricing'} • {cls.schedule?.length ? `${cls.schedule.length} sessions` : 'Custom schedule'}
                      </p>
                    </div>
                    <div className="class-item__actions">
                      <Link to={`/class/${cls._id}`} className="btn btn-sm btn-secondary">View</Link>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => openEditModal(cls)}>Edit</button>
                      <button type="button" className="btn btn-sm btn-secondary" onClick={() => handleDeleteClass(cls._id)}>Delete</button>
                      <Link to={`/go-live/${cls._id}`} className="btn btn-sm btn-success">Go Live</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p>You haven't created any classes yet.</p>
                <button type="button" className="btn btn-primary" onClick={openCreateModal}>Create a New Class</button>
              </>
            )}
          </section>

          <section className="dashboard-card">
            <h2>Quick Stats</h2>
            <div className="quick-stats">
              <div className="quick-stat">
                <span className="label">Total Revenue</span>
                <span className="value">$0.00</span>
              </div>
              <div className="quick-stat">
                <span className="label">Free Admission Slots</span>
                <span className="value">{user?.freeAdmissionSlots || 0}</span>
              </div>
              <div className="quick-stat">
                <span className="label">Students This Month</span>
                <span className="value">0</span>
              </div>
            </div>
          </section>
        </div>

        {selectedClassId && (
          <div className="recommendation-metrics-section">
            <RecommendationMetrics classId={selectedClassId} />
          </div>
        )}
        {selectedClassId && (
          <div className="analytics-section">
            <AnalyticsDashboard classId={selectedClassId} />
          </div>
        )}
      </div>

      {isClassModalOpen && (
        <div className="class-modal-overlay" onClick={closeClassModal}>
          <div className="class-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary btn-sm" onClick={closeClassModal} aria-label="Close class form">
                ✕
              </button>
            </div>
            <ClassForm initialData={classToEdit || null} onSuccess={handleClassModalSuccess} onCancel={closeClassModal} showHeader={true} />
          </div>
        </div>
      )}
    </div>
  );
}
