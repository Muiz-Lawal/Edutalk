import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './BundleForm.css';

const BundleForm = ({ bundle = null, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    courseIds: [],
    pricing: {
      model: 'flat',
      amount: 0,
      totalOriginalPrice: 0,
      totalBundlePrice: 0,
    },
    category: 'Other',
    tags: '',
    thumbnailUrl: '',
    allowedStudents: 'any',
  });

  const [courses, setCourses] = useState([]);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        setLoadingCourses(true);
        const response = await api.get('/api/host/my-classes');
        setCourses(response.data || []);
      } catch (err) {
        setError('Failed to fetch courses');
      } finally {
        setLoadingCourses(false);
      }
    };

    fetchCourses();

    // Populate form if editing
    if (bundle) {
      setFormData({
        title: bundle.title || '',
        description: bundle.description || '',
        courseIds: bundle.courseIds || [],
        pricing: bundle.pricing || {
          model: 'flat',
          amount: 0,
          totalOriginalPrice: 0,
          totalBundlePrice: 0,
        },
        category: bundle.category || 'Other',
        tags: (bundle.tags || []).join(', '),
        thumbnailUrl: bundle.thumbnailUrl || '',
        allowedStudents: bundle.allowedStudents || 'any',
      });
    }
  }, [bundle]);

  // Calculate original price from selected courses
  useEffect(() => {
    const selectedCourses = courses.filter((c) =>
      formData.courseIds.includes(c._id)
    );
    const totalPrice = selectedCourses.reduce((sum, c) => sum + (c.price || 0), 0);

    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        totalOriginalPrice: totalPrice,
        totalBundlePrice: calculateBundlePrice(
          prev.pricing.model,
          prev.pricing.amount,
          totalPrice
        ),
      },
    }));
  }, [formData.courseIds, courses]);

  const calculateBundlePrice = (model, amount, originalPrice) => {
    if (model === 'percentage') {
      return originalPrice * (1 - amount / 100);
    } else {
      return amount;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    const model = name === 'model' ? value : formData.pricing.model;
    const amount = name === 'amount' ? parseFloat(value) : formData.pricing.amount;

    setFormData((prev) => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [name]: name === 'amount' ? amount : value,
        totalBundlePrice: calculateBundlePrice(
          model,
          amount,
          prev.pricing.totalOriginalPrice
        ),
      },
    }));
  };

  const handleCourseToggle = (courseId) => {
    setFormData((prev) => {
      const courseIds = prev.courseIds.includes(courseId)
        ? prev.courseIds.filter((id) => id !== courseId)
        : [...prev.courseIds, courseId];

      if (courseIds.length > 10) {
        setError('Bundle can contain maximum 10 courses');
        return prev;
      }

      return { ...prev, courseIds };
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.title.trim()) {
      setError('Bundle title is required');
      return;
    }

    if (!formData.description.trim()) {
      setError('Bundle description is required');
      return;
    }

    if (formData.courseIds.length < 2) {
      setError('Bundle must contain at least 2 courses');
      return;
    }

    if (formData.courseIds.length > 10) {
      setError('Bundle can contain maximum 10 courses');
      return;
    }

    if (formData.pricing.model === 'flat' && formData.pricing.amount <= 0) {
      setError('Bundle price must be greater than 0');
      return;
    }

    if (formData.pricing.model === 'percentage' && formData.pricing.amount > 100) {
      setError('Discount percentage cannot exceed 100%');
      return;
    }

    try {
      setSaving(true);
      const submitData = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag.length > 0),
      };

      onSubmit(submitData);
    } catch (err) {
      setError(err.message || 'Failed to save bundle');
    } finally {
      setSaving(false);
    }
  };

  if (loadingCourses) {
    return <div className="bundle-form__loading">Loading courses...</div>;
  }

  if (courses.length === 0) {
    return (
      <div className="bundle-form__error">
        <p>You need to create at least 2 courses before creating a bundle.</p>
        <button onClick={onCancel}>Cancel</button>
      </div>
    );
  }

  return (
    <form className="bundle-form" onSubmit={handleSubmit}>
      <div className="bundle-form__header">
        <h2 className="bundle-form__title">
          {bundle ? 'Edit Bundle' : 'Create New Bundle'}
        </h2>
        <button
          type="button"
          className="bundle-form__close"
          onClick={onCancel}
          aria-label="Close form"
        >
          ✕
        </button>
      </div>

      {error && (
        <div className="bundle-form__error-message" role="alert">
          {error}
        </div>
      )}

      <div className="bundle-form__scroll">
        {/* Basic Info */}
        <fieldset className="bundle-form__section">
          <legend>Basic Information</legend>

          <div className="bundle-form__field">
            <label htmlFor="title" className="bundle-form__label">
              Bundle Title <span className="bundle-form__required">*</span>
            </label>
            <input
              id="title"
              type="text"
              name="title"
              className="bundle-form__input"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter bundle title (e.g., 'Complete Web Development')"
              maxLength={100}
              required
            />
            <span className="bundle-form__help">
              {formData.title.length}/100 characters
            </span>
          </div>

          <div className="bundle-form__field">
            <label htmlFor="description" className="bundle-form__label">
              Description <span className="bundle-form__required">*</span>
            </label>
            <textarea
              id="description"
              name="description"
              className="bundle-form__textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what students will learn from this bundle"
              maxLength={2000}
              rows={4}
              required
            />
            <span className="bundle-form__help">
              {formData.description.length}/2000 characters
            </span>
          </div>

          <div className="bundle-form__field">
            <label htmlFor="category" className="bundle-form__label">
              Category
            </label>
            <select
              id="category"
              name="category"
              className="bundle-form__select"
              value={formData.category}
              onChange={handleInputChange}
            >
              <option value="Technology">Technology</option>
              <option value="Business">Business</option>
              <option value="Design">Design</option>
              <option value="Art">Art</option>
              <option value="Music">Music</option>
              <option value="Language">Language</option>
              <option value="Health">Health</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="bundle-form__field">
            <label htmlFor="tags" className="bundle-form__label">
              Tags (comma-separated)
            </label>
            <input
              id="tags"
              type="text"
              name="tags"
              className="bundle-form__input"
              value={formData.tags}
              onChange={handleInputChange}
              placeholder="e.g., beginner, comprehensive, career-focused"
            />
          </div>
        </fieldset>

        {/* Courses Selection */}
        <fieldset className="bundle-form__section">
          <legend>
            Select Courses <span className="bundle-form__required">*</span>
            <span className="bundle-form__count">
              ({formData.courseIds.length}/10)
            </span>
          </legend>

          <div className="bundle-form__courses">
            {courses.map((course) => (
              <label key={course._id} className="bundle-form__course-item">
                <input
                  type="checkbox"
                  className="bundle-form__checkbox"
                  checked={formData.courseIds.includes(course._id)}
                  onChange={() => handleCourseToggle(course._id)}
                  disabled={
                    !formData.courseIds.includes(course._id) &&
                    formData.courseIds.length >= 10
                  }
                />
                <div className="bundle-form__course-info">
                  <span className="bundle-form__course-name">{course.title}</span>
                  <span className="bundle-form__course-price">
                    ${course.price?.toFixed(2) || '0.00'}
                  </span>
                </div>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Pricing */}
        <fieldset className="bundle-form__section">
          <legend>Pricing <span className="bundle-form__required">*</span></legend>

          <div className="bundle-form__field">
            <label htmlFor="model" className="bundle-form__label">
              Pricing Model
            </label>
            <div className="bundle-form__radio-group">
              <label className="bundle-form__radio">
                <input
                  type="radio"
                  name="model"
                  value="flat"
                  checked={formData.pricing.model === 'flat'}
                  onChange={handlePricingChange}
                />
                Fixed Price
              </label>
              <label className="bundle-form__radio">
                <input
                  type="radio"
                  name="model"
                  value="percentage"
                  checked={formData.pricing.model === 'percentage'}
                  onChange={handlePricingChange}
                />
                Percentage Discount
              </label>
            </div>
          </div>

          <div className="bundle-form__field">
            <label htmlFor="amount" className="bundle-form__label">
              {formData.pricing.model === 'flat' ? 'Bundle Price ($)' : 'Discount (%)'}
              <span className="bundle-form__required">*</span>
            </label>
            <input
              id="amount"
              type="number"
              name="amount"
              className="bundle-form__input"
              value={formData.pricing.amount}
              onChange={handlePricingChange}
              min="0"
              max={formData.pricing.model === 'percentage' ? 100 : undefined}
              step="0.01"
              required
            />
          </div>

          <div className="bundle-form__pricing-summary">
            <div className="bundle-form__summary-item">
              <span>Original Price:</span>
              <span className="bundle-form__summary-value">
                ${formData.pricing.totalOriginalPrice.toFixed(2)}
              </span>
            </div>
            <div className="bundle-form__summary-item">
              <span>Bundle Price:</span>
              <span className="bundle-form__summary-value bundle-form__summary-value--highlight">
                ${formData.pricing.totalBundlePrice.toFixed(2)}
              </span>
            </div>
            <div className="bundle-form__summary-item">
              <span>Student Saves:</span>
              <span className="bundle-form__summary-value bundle-form__summary-value--savings">
                ${(
                  formData.pricing.totalOriginalPrice - formData.pricing.totalBundlePrice
                ).toFixed(2)}
              </span>
            </div>
          </div>
        </fieldset>

        {/* Settings */}
        <fieldset className="bundle-form__section">
          <legend>Settings</legend>

          <div className="bundle-form__field">
            <label htmlFor="allowedStudents" className="bundle-form__label">
              Who Can Enroll?
            </label>
            <select
              id="allowedStudents"
              name="allowedStudents"
              className="bundle-form__select"
              value={formData.allowedStudents}
              onChange={handleInputChange}
            >
              <option value="any">Any Student</option>
              <option value="new">New Students Only</option>
              <option value="existing">Existing Students Only</option>
            </select>
          </div>

          <div className="bundle-form__field">
            <label htmlFor="thumbnailUrl" className="bundle-form__label">
              Thumbnail URL
            </label>
            <input
              id="thumbnailUrl"
              type="url"
              name="thumbnailUrl"
              className="bundle-form__input"
              value={formData.thumbnailUrl}
              onChange={handleInputChange}
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </fieldset>
      </div>

      {/* Actions */}
      <div className="bundle-form__footer">
        <button
          type="button"
          className="bundle-form__button bundle-form__button--cancel"
          onClick={onCancel}
          disabled={saving}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bundle-form__button bundle-form__button--submit"
          disabled={saving || formData.courseIds.length < 2}
        >
          {saving ? 'Saving...' : bundle ? 'Update Bundle' : 'Create Bundle'}
        </button>
      </div>
    </form>
  );
};

export default BundleForm;
