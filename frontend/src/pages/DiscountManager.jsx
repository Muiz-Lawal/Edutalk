import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import DiscountAnalyticsDashboard from '../components/DiscountAnalyticsDashboard';
import ConfirmDialog from '../components/ConfirmDialog';
import MessageBanner from '../components/MessageBanner';
import '../styles/DiscountManager.css';

export default function DiscountManager() {
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const initialFormState = {
    code: '',
    name: '',
    description: '',
    type: 'percentage',
    value: 10,
    conditions: {
      minPurchase: 0,
      maxUses: '',
      validFrom: '',
      validUntil: '',
      applicableTo: 'all',
      specificItems: [],
      userRestrictions: {
        firstTimeOnly: false,
        maxUsesPerUser: ''
      }
    }
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // FETCH DISCOUNTS
  const fetchDiscounts = async () => {
    try {
      setLoading(true);

      const response = await api.get('/discounts');

      setDiscounts(response.data?.discounts || []);
    } catch (err) {
      setError('Failed to load discounts');
      console.error('Fetch discounts error:', err);
    } finally {
      setLoading(false);
    }
  };

  // RESET FORM
  const resetForm = () => {
    setFormData(initialFormState);
    setEditingDiscount(null);
    setShowCreateForm(false);
    setError(null);
  };

  // INPUT CHANGES
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // CONDITIONS CHANGES
  const handleConditionsChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [name]: type === 'checkbox' ? checked : value
      }
    }));
  };

  // USER RESTRICTIONS CHANGES
  const handleUserRestrictionsChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        userRestrictions: {
          ...prev.conditions.userRestrictions,
          [name]: type === 'checkbox' ? checked : value
        }
      }
    }));
  };

  // SUBMIT FORM
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const discountData = {
        ...formData,
        code: formData.code.toUpperCase(),
        value: Number(formData.value),

        conditions: {
          ...formData.conditions,

          minPurchase:
            parseFloat(formData.conditions.minPurchase) || 0,

          maxUses: formData.conditions.maxUses
            ? parseInt(formData.conditions.maxUses)
            : undefined,

          validFrom:
            formData.conditions.validFrom ||
            new Date().toISOString(),

          validUntil:
            formData.conditions.validUntil || undefined,

          userRestrictions: {
            ...formData.conditions.userRestrictions,

            maxUsesPerUser:
              formData.conditions.userRestrictions.maxUsesPerUser
                ? parseInt(
                    formData.conditions.userRestrictions
                      .maxUsesPerUser
                  )
                : undefined
          }
        }
      };

      // UPDATE
      if (editingDiscount) {
        await api.put(
          `/discounts/${editingDiscount._id}`,
          discountData
        );
      }

      // CREATE
      else {
        await api.post('/discounts', discountData);
      }

      resetForm();
      fetchDiscounts();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Failed to save discount'
      );

      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // EDIT DISCOUNT
  const handleEdit = (discount) => {
    setFormData({
      code: discount.code || '',
      name: discount.name || '',
      description: discount.description || '',
      type: discount.type || 'percentage',
      value: discount.value || 0,

      conditions: {
        minPurchase:
          discount.conditions?.minPurchase || 0,

        maxUses:
          discount.conditions?.maxUses || '',

        validFrom: discount.conditions?.validFrom
          ? new Date(discount.conditions.validFrom)
              .toISOString()
              .split('T')[0]
          : '',

        validUntil: discount.conditions?.validUntil
          ? new Date(discount.conditions.validUntil)
              .toISOString()
              .split('T')[0]
          : '',

        applicableTo:
          discount.conditions?.applicableTo || 'all',

        specificItems:
          discount.conditions?.specificItems || [],

        userRestrictions: {
          firstTimeOnly:
            discount.conditions?.userRestrictions
              ?.firstTimeOnly || false,

          maxUsesPerUser:
            discount.conditions?.userRestrictions
              ?.maxUsesPerUser || ''
        }
      }
    });

    setEditingDiscount(discount);
    setShowCreateForm(true);
  };

  // DELETE DISCOUNT
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  const handleDelete = (discountId) => {
    setConfirm({
      open: true,
      title: 'Delete Discount',
      message: 'Are you sure you want to delete this discount?',
      onConfirm: async () => {
        setConfirm({ open: false });
        try {
          await api.delete(`/discounts/${discountId}`);
          fetchDiscounts();
        } catch (err) {
          setError('Failed to delete discount');
          console.error(err);
        }
      },
    });
  };

  // TOGGLE STATUS
  const toggleDiscountStatus = async (discount) => {
    try {
      await api.put(`/discounts/${discount._id}`, {
        ...discount,
        isActive: !discount.isActive
      });

      fetchDiscounts();
    } catch (err) {
      setError('Failed to update discount status');

      console.error('Toggle status error:', err);
    }
  };

  // VIEW ANALYTICS
  const handleViewAnalytics = (discount) => {
    setSelectedDiscount(discount);
    setViewMode('analytics');
  };

  // VIEW OVERALL ANALYTICS
  const handleViewOverallAnalytics = () => {
    setSelectedDiscount(null);
    setViewMode('overall');
  };

  // BACK TO LIST
  const handleBackToList = () => {
    setViewMode('list');
    setSelectedDiscount(null);
  };

  // FORMAT DATE
  const formatDate = (dateString) => {
    if (!dateString) return 'No limit';

    return new Date(dateString).toLocaleDateString();
  };

  // STATUS BADGES
  const getStatusBadge = (discount) => {
    if (!discount.isActive) {
      return (
        <span className="status inactive">
          Inactive
        </span>
      );
    }

    if (discount.isExpired) {
      return (
        <span className="status expired">
          Expired
        </span>
      );
    }

    if (!discount.isAvailable) {
      return (
        <span className="status unavailable">
          Unavailable
        </span>
      );
    }

    return (
      <span className="status active">
        Active
      </span>
    );
  };

  // LOADING SCREEN
  if (loading && discounts.length === 0) {
    return (
      <div className="discount-manager">
        <div className="loading">
          Loading discounts...
        </div>
      </div>
    );
  }

  return (
    <div className="discount-manager">
      {error && (
        <MessageBanner type="error" title="Discounts" message={error} onClose={() => setError(null)} />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false })}
      />

      {/* HEADER */}
      <div className="manager-header">
        <h1>Discount Code Manager</h1>

        <p>
          Create and manage discount codes
          for your courses and bundles
        </p>

        <div className="header-actions">

          {viewMode !== 'list' && (
            <button
              onClick={handleBackToList}
              className="btn btn-secondary"
            >
              ← Back to List
            </button>
          )}

          {viewMode === 'list' && (
            <>
              <button
                onClick={() =>
                  setShowCreateForm(!showCreateForm)
                }
                className="btn btn-primary"
              >
                {showCreateForm
                  ? 'Cancel'
                  : 'Create New Discount'}
              </button>
              {discounts.length >= 3 && (
                <button
                  onClick={handleViewOverallAnalytics}
                  className="btn btn-info"
                >
                  📊 Overall Analytics
                </button>
              )}
              {discounts.length < 3 && (
                <div className="analytics-note">
                  Create at least 3 discount codes to enable overall analytics for the full set.
                </div>
              )}
            </>
          )}

        </div>
      </div>

      {/* ERROR */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ANALYTICS */}
      {viewMode === 'analytics' && selectedDiscount ? (
        <DiscountAnalyticsDashboard
          discountId={selectedDiscount._id}
        />
      ) : viewMode === 'overall' ? (
        <DiscountAnalyticsDashboard overall />
      ) : (
        <>
          {/* FORM */}
          {showCreateForm && (
            <form
              onSubmit={handleSubmit}
              className="discount-form"
            >

              <h2>
                {editingDiscount
                  ? 'Edit Discount'
                  : 'Create New Discount'}
              </h2>

              {/* CODE + NAME */}
              <div className="form-row">

                <div className="form-group">
                  <label>Discount Code *</label>

                  <input
                    type="text"
                    name="code"
                    value={formData.code}
                    onChange={handleInputChange}
                    placeholder="SUMMER2026"
                    required
                    disabled={editingDiscount}
                  />
                </div>

                <div className="form-group">
                  <label>Name *</label>

                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Summer Sale"
                    required
                  />
                </div>

              </div>

              {/* DESCRIPTION */}
              <div className="form-group">
                <label>Description</label>

                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              {/* TYPE + VALUE */}
              <div className="form-row">

                <div className="form-group">
                  <label>Discount Type</label>

                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="percentage">
                      Percentage
                    </option>

                    <option value="fixed">
                      Fixed Amount
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    {formData.type === 'percentage'
                      ? 'Discount %'
                      : 'Discount Amount ($)'}
                  </label>

                  <input
                    type="number"
                    name="value"
                    value={formData.value}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>

              </div>

              {/* ACTION BUTTONS */}
              <div className="form-actions">

                <button
                  type="button"
                  onClick={resetForm}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading
                    ? 'Saving...'
                    : editingDiscount
                    ? 'Update Discount'
                    : 'Create Discount'}
                </button>

              </div>

            </form>
          )}

          {/* DISCOUNTS LIST */}
          <div className="discounts-list">

            <h2>Your Discount Codes</h2>

            {discounts.length === 0 ? (
              <div className="no-discounts">

                <p>
                  You haven't created any
                  discount codes yet.
                </p>

                <button
                  onClick={() =>
                    setShowCreateForm(true)
                  }
                  className="btn btn-primary"
                >
                  Create Your First Discount
                </button>

              </div>
            ) : (
              <div className="discounts-grid">
                {discounts.length >= 3 && (
                  <div className="discount-card overall-analytics-card">
                    <div className="discount-header">
                      <div className="discount-code">ALL DISCOUNTS</div>
                      <span className="status active">Overview</span>
                    </div>
                    <div className="discount-content">
                      <h3>Overall Discount Analytics</h3>
                      <p>
                        Review total code usage, revenue impact, and top-performing discounts across your entire account.
                      </p>
                    </div>
                    <div className="discount-actions">
                      <button
                        onClick={handleViewOverallAnalytics}
                        className="btn btn-info"
                      >
                        View Overall Analytics
                      </button>
                    </div>
                  </div>
                )}

                {discounts.map((discount) => (
                  <div
                    key={discount._id}
                    className="discount-card"
                  >

                    {/* HEADER */}
                    <div className="discount-header">

                      <div className="discount-code">
                        {discount.code}
                      </div>

                      {getStatusBadge(discount)}

                    </div>

                    {/* CONTENT */}
                    <div className="discount-content">

                      <h3>{discount.name}</h3>

                      <p>
                        {discount.description ||
                          'No description provided'}
                      </p>

                      <div className="discount-details">

                        <div className="detail-row">
                          <span>Type:</span>

                          <span>
                            {discount.type ===
                            'percentage'
                              ? `${discount.value}% off`
                              : `$${discount.value} off`}
                          </span>
                        </div>

                        <div className="detail-row">
                          <span>Uses:</span>

                          <span>
                            {discount.conditions
                              ?.usageCount || 0}
                          </span>
                        </div>

                        <div className="detail-row">
                          <span>Expires:</span>

                          <span>
                            {formatDate(
                              discount.conditions
                                ?.validUntil
                            )}
                          </span>
                        </div>

                      </div>
                    </div>

                    {/* ACTIONS */}
                    <div className="discount-actions">

                      <button
                        onClick={() =>
                          handleViewAnalytics(
                            discount
                          )
                        }
                        className="btn btn-info"
                      >
                        📊 Analytics
                      </button>

                      <button
                        onClick={() =>
                          toggleDiscountStatus(
                            discount
                          )
                        }
                        className={`btn ${
                          discount.isActive
                            ? 'btn-warning'
                            : 'btn-success'
                        }`}
                      >
                        {discount.isActive
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>

                      <button
                        onClick={() =>
                          handleEdit(discount)
                        }
                        className="btn btn-secondary"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(
                            discount._id
                          )
                        }
                        className="btn btn-danger"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}