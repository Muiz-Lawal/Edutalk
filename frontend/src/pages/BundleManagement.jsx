import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import BundleCard from '../components/BundleCard';
import BundleForm from '../components/BundleForm';
import './BundleManagement.css';

const BundleManagement = () => {
  const { user } = useAuth();
  const [bundles, setBundles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch host bundles
  useEffect(() => {
    fetchBundles();
  }, []);

  const fetchBundles = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/host/bundles');
      setBundles(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch bundles');
      setBundles([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort bundles
  const filteredBundles = bundles
    .filter((bundle) => {
      if (filterStatus !== 'all' && bundle.status !== filterStatus) {
        return false;
      }
      if (
        searchTerm &&
        !bundle.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !bundle.description.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        return false;
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'enrollments':
          return (b.enrollments || 0) - (a.enrollments || 0);
        case 'revenue':
          return (b.revenue || 0) - (a.revenue || 0);
        case 'created':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt);
      }
    });

  const handleCreateBundle = () => {
    setEditingBundle(null);
    setShowForm(true);
  };

  const handleEditBundle = (bundleId) => {
    const bundle = bundles.find((b) => b._id === bundleId);
    setEditingBundle(bundle);
    setShowForm(true);
  };

  const handleDeleteBundle = async (bundleId) => {
    try {
      await api.delete(`/api/bundles/${bundleId}`);
      setBundles(bundles.filter((b) => b._id !== bundleId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bundle');
    }
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingBundle) {
        // Update existing bundle
        const response = await api.put(`/api/bundles/${editingBundle._id}`, formData);
        setBundles(bundles.map((b) => (b._id === editingBundle._id ? response.data : b)));
      } else {
        // Create new bundle
        const response = await api.post('/api/bundles', formData);
        setBundles([response.data, ...bundles]);
      }
      setShowForm(false);
      setEditingBundle(null);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save bundle');
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingBundle(null);
  };

  if (!user || user.role !== 'host') {
    return (
      <div className="bundle-management__error">
        <h2>Access Denied</h2>
        <p>Only hosts can manage bundles. Please upgrade to host status first.</p>
      </div>
    );
  }

  return (
    <div className="bundle-management">
      <header className="bundle-management__header">
        <h1>Bundle Management</h1>
        <p className="bundle-management__subtitle">
          Group courses together at a discounted rate
        </p>
      </header>

      {/* Action Bar */}
      <div className="bundle-management__actions">
        <button
          className="bundle-management__create-btn"
          onClick={handleCreateBundle}
          aria-label="Create new bundle"
        >
          ➕ Create Bundle
        </button>
      </div>

      {/* Search and Filter Bar */}
      <div className="bundle-management__controls">
        <input
          type="text"
          className="bundle-management__search"
          placeholder="Search bundles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          aria-label="Search bundles"
        />

        <select
          className="bundle-management__filter"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="archived">Archived</option>
        </select>

        <select
          className="bundle-management__sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          aria-label="Sort by"
        >
          <option value="created">Newest First</option>
          <option value="enrollments">Most Enrollments</option>
          <option value="revenue">Highest Revenue</option>
        </select>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bundle-management__error-banner" role="alert">
          {error}
          <button
            className="bundle-management__close-error"
            onClick={() => setError(null)}
            aria-label="Close error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Bundle Form Modal */}
      {showForm && (
        <div className="bundle-management__modal-overlay" onClick={handleFormCancel}>
          <div
            className="bundle-management__modal"
            onClick={(e) => e.stopPropagation()}
          >
            <BundleForm
              bundle={editingBundle}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
            />
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bundle-management__loading">
          <div className="bundle-management__spinner"></div>
          <p>Loading bundles...</p>
        </div>
      ) : filteredBundles.length === 0 ? (
        <div className="bundle-management__empty">
          <p className="bundle-management__empty-icon">📦</p>
          <h3>No bundles yet</h3>
          <p>
            {bundles.length === 0
              ? 'Create your first bundle to group courses together and offer discounts to students.'
              : 'No bundles match your search or filters.'}
          </p>
          {bundles.length === 0 && (
            <button
              className="bundle-management__empty-btn"
              onClick={handleCreateBundle}
            >
              Create Your First Bundle
            </button>
          )}
        </div>
      ) : (
        <div className="bundle-management__grid">
          {filteredBundles.map((bundle) => (
            <BundleCard
              key={bundle._id}
              bundle={bundle}
              showActions={true}
              onEdit={handleEditBundle}
              onDelete={handleDeleteBundle}
            />
          ))}
        </div>
      )}

      {/* Stats Footer */}
      {bundles.length > 0 && (
        <div className="bundle-management__stats">
          <div className="bundle-management__stat">
            <span className="bundle-management__stat-label">Total Bundles</span>
            <span className="bundle-management__stat-value">{bundles.length}</span>
          </div>
          <div className="bundle-management__stat">
            <span className="bundle-management__stat-label">Active Bundles</span>
            <span className="bundle-management__stat-value">
              {bundles.filter((b) => b.status === 'active').length}
            </span>
          </div>
          <div className="bundle-management__stat">
            <span className="bundle-management__stat-label">Total Revenue</span>
            <span className="bundle-management__stat-value">
              ${bundles.reduce((sum, b) => sum + (b.revenue || 0), 0).toFixed(2)}
            </span>
          </div>
          <div className="bundle-management__stat">
            <span className="bundle-management__stat-label">Total Enrollments</span>
            <span className="bundle-management__stat-value">
              {bundles.reduce((sum, b) => sum + (b.enrollments || 0), 0)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BundleManagement;
