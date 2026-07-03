import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '/Users/abdul/Desktop/class/frontend/src/styles/BundleCreation.css';

export default function BundleCreation() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    classes: [],
    pricing: {
      discountType: 'percentage', // 'percentage' or 'fixed'
      discountValue: 10
    },
    settings: {
      maxEnrollments: '',
      isActive: true
    }
  });

  const [dynamicPricing, setDynamicPricing] = useState({
    enableDemandPricing: false,
    enableSeasonalPricing: false,
    demandThresholds: [
      { percentage: 50, multiplier: 1.1 },
      { percentage: 75, multiplier: 1.2 },
      { percentage: 90, multiplier: 1.3 }
    ],
    seasonalConfig: [
      { name: 'Winter Sale', months: [11, 0, 1], multiplier: 0.9 },
      { name: 'Summer Promotion', months: [5, 6, 7], multiplier: 0.95 }
    ]
  });

  useEffect(() => {
    fetchHostClasses();
  }, []);

  const fetchHostClasses = async () => {
    try {
      const response = await api.get('/classes/my-classes');
      setAvailableClasses(response.data);
    } catch (err) {
      console.error('Fetch classes error:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePricingChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        [name]: value
      }
    }));
  };

  const handleDynamicPricingChange = (field, value) => {
    setDynamicPricing(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const updateDemandThreshold = (index, field, value) => {
    setDynamicPricing(prev => ({
      ...prev,
      demandThresholds: prev.demandThresholds.map((threshold, i) =>
        i === index ? { ...threshold, [field]: parseFloat(value) } : threshold
      )
    }));
  };

  const updateSeasonalConfig = (index, field, value) => {
    setDynamicPricing(prev => ({
      ...prev,
      seasonalConfig: prev.seasonalConfig.map((season, i) =>
        i === index ? { ...season, [field]: field === 'months' ? value.map(Number) : parseFloat(value) } : season
      )
    }));
  };

  const handleClassToggle = (classId) => {
    setFormData(prev => ({
      ...prev,
      classes: prev.classes.includes(classId)
        ? prev.classes.filter(id => id !== classId)
        : [...prev.classes, classId]
    }));
  };

  const calculateBundlePricing = () => {
    const selectedClasses = availableClasses.filter(cls =>
      formData.classes.includes(cls._id)
    );

    const totalOriginalPrice = selectedClasses.reduce((sum, cls) =>
      sum + (cls.monthlyPrice ?? 0), 0
    );

    let totalBundlePrice = totalOriginalPrice;
    if (formData.pricing.discountType === 'percentage') {
      const discount = totalOriginalPrice * (formData.pricing.discountValue / 100);
      totalBundlePrice = totalOriginalPrice - discount;
    } else {
      totalBundlePrice = Math.max(0, totalOriginalPrice - formData.pricing.discountValue);
    }

    return {
      totalOriginalPrice,
      totalBundlePrice,
      savings: totalOriginalPrice - totalBundlePrice
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.title.trim()) {
        throw new Error('Bundle title is required');
      }
      if (!formData.description.trim()) {
        throw new Error('Bundle description is required');
      }
      if (!formData.category) {
        throw new Error('Category is required');
      }
      if (formData.classes.length < 2) {
        throw new Error('At least 2 classes must be selected');
      }

      const calculatedPricing = calculateBundlePricing();
      const bundleData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        classIds: formData.classes,
        settings: {
          ...formData.settings,
          category: formData.category,
          validFrom: new Date(),
          validUntil: formData.settings.validUntil || null,
        },
        pricing: {
          ...formData.pricing,
          ...calculatedPricing,
          discountPercentage:
            formData.pricing.discountType === 'percentage'
              ? formData.pricing.discountValue
              : formData.pricing.discountValue && calculatedPricing.totalOriginalPrice > 0
                ? Math.round((formData.pricing.discountValue / calculatedPricing.totalOriginalPrice) * 100)
                : 0,
          dynamicRules: {
            timeBasedDiscounts: [],
            demandBasedPricing: {
              enabled: dynamicPricing.enableDemandPricing,
              priceIncreaseThresholds: dynamicPricing.demandThresholds.map(t => ({
                enrollmentPercentage: t.percentage,
                priceMultiplier: t.multiplier
              }))
            },
            seasonalPricing: {
              enabled: dynamicPricing.enableSeasonalPricing,
              seasonalMultipliers: dynamicPricing.seasonalConfig
            },
            lastPriceUpdate: new Date()
          }
        }
      };

      await api.post('/bundles', bundleData);
      setSuccess(true);

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        classes: [],
        pricing: {
          discountType: 'percentage',
          discountValue: 10
        },
        settings: {
          maxEnrollments: '',
          isActive: true
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const pricing = calculateBundlePricing();
  const categories = [
    'Technology', 'Business', 'Design', 'Marketing',
    'Language', 'Science', 'Arts', 'Health & Fitness', 'Other'
  ];

  return (
    <div className="bundle-creation">
      <div className="creation-header">
        <h1>Create Course Bundle</h1>
        <p>Combine multiple courses into a discounted bundle to increase sales</p>
      </div>

      {success && (
        <div className="success-message">
          Bundle created successfully! It will be available for students to purchase.
        </div>
      )}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bundle-form">
        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="title">Bundle Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., Complete Web Development Bootcamp"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Describe what students will learn from this bundle..."
              rows={4}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-section">
          <h2>Select Classes</h2>
          <p>Choose at least 2 classes to include in this bundle</p>

          {availableClasses.length === 0 ? (
            <div className="no-classes">
              <p>You haven't created any classes yet.</p>
              <a href="/create-class" className="create-class-link">
                Create your first class
              </a>
            </div>
          ) : (
            <div className="classes-selection">
              {availableClasses.map(cls => (
                <div key={cls._id} className="class-option">
                  <label className="class-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.classes.includes(cls._id)}
                      onChange={() => handleClassToggle(cls._id)}
                    />
                    <div className="class-info">
                      <div className="class-name">{cls.title}</div>
                      <div className="class-price">${cls.pricing.basePrice}</div>
                      <div className="class-category">{cls.category}</div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
          )}

          {formData.classes.length > 0 && (
            <div className="selected-count">
              {formData.classes.length} class(es) selected
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Pricing</h2>

          <div className="pricing-options">
            <div className="form-group">
              <label htmlFor="discountType">Discount Type</label>
              <select
                id="discountType"
                name="discountType"
                value={formData.pricing.discountType}
                onChange={handlePricingChange}
              >
                <option value="percentage">Percentage Discount</option>
                <option value="fixed">Fixed Amount Discount</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="discountValue">
                {formData.pricing.discountType === 'percentage' ? 'Discount %' : 'Discount Amount ($)'}
              </label>
              <input
                type="number"
                id="discountValue"
                name="discountValue"
                value={formData.pricing.discountValue}
                onChange={handlePricingChange}
                min="0"
                step={formData.pricing.discountType === 'percentage' ? '1' : '0.01'}
                max={formData.pricing.discountType === 'percentage' ? '100' : pricing.totalOriginalPrice}
              />
            </div>
          </div>

          {formData.classes.length >= 2 && (
            <div className="pricing-preview">
              <h3>Pricing Preview</h3>
              <div className="pricing-details">
                <div className="pricing-row">
                  <span>Individual Price:</span>
                  <span>${pricing.totalOriginalPrice.toFixed(2)}</span>
                </div>
                <div className="pricing-row">
                  <span>Bundle Price:</span>
                  <span>${pricing.totalBundlePrice.toFixed(2)}</span>
                </div>
                <div className="pricing-row savings">
                  <span>You Save:</span>
                  <span>${pricing.savings.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-section">
          <h2>Settings</h2>

          <div className="form-group">
            <label htmlFor="maxEnrollments">Maximum Enrollments (optional)</label>
            <input
              type="number"
              id="maxEnrollments"
              name="maxEnrollments"
              value={formData.settings.maxEnrollments}
              onChange={handleSettingsChange}
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.settings.isActive}
                onChange={handleSettingsChange}
              />
              Make bundle active immediately
            </label>
          </div>
        </div>

        <div className="form-section">
          <h2>Dynamic Pricing (Optional)</h2>
          <p className="section-description">
            Configure advanced pricing strategies that can automatically adjust bundle prices based on demand, seasons, or time-based rules.
          </p>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={dynamicPricing.enableDemandPricing}
                onChange={(e) => handleDynamicPricingChange('enableDemandPricing', e.target.checked)}
              />
              Enable demand-based pricing
            </label>
            <small className="help-text">
              Automatically increase prices as enrollment fills up to create urgency
            </small>
          </div>

          {dynamicPricing.enableDemandPricing && (
            <div className="dynamic-pricing-config">
              <h3>Demand Thresholds</h3>
              <div className="thresholds-list">
                {dynamicPricing.demandThresholds.map((threshold, index) => (
                  <div key={index} className="threshold-item">
                    <div className="threshold-inputs">
                      <div className="form-group">
                        <label>Enrollment %</label>
                        <input
                          type="number"
                          value={threshold.percentage}
                          onChange={(e) => updateDemandThreshold(index, 'percentage', e.target.value)}
                          min="1"
                          max="100"
                        />
                      </div>
                      <div className="form-group">
                        <label>Price Multiplier</label>
                        <input
                          type="number"
                          value={threshold.multiplier}
                          onChange={(e) => updateDemandThreshold(index, 'multiplier', e.target.value)}
                          step="0.1"
                          min="1"
                        />
                      </div>
                    </div>
                    <small className="threshold-preview">
                      When {threshold.percentage}% enrolled, price becomes {threshold.multiplier}x base price
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={dynamicPricing.enableSeasonalPricing}
                onChange={(e) => handleDynamicPricingChange('enableSeasonalPricing', e.target.checked)}
              />
              Enable seasonal pricing
            </label>
            <small className="help-text">
              Apply different pricing during specific months or seasons
            </small>
          </div>

          {dynamicPricing.enableSeasonalPricing && (
            <div className="dynamic-pricing-config">
              <h3>Seasonal Configurations</h3>
              <div className="seasons-list">
                {dynamicPricing.seasonalConfig.map((season, index) => (
                  <div key={index} className="season-item">
                    <div className="season-inputs">
                      <div className="form-group">
                        <label>Season Name</label>
                        <input
                          type="text"
                          value={season.name}
                          onChange={(e) => updateSeasonalConfig(index, 'name', e.target.value)}
                          placeholder="e.g., Holiday Sale"
                        />
                      </div>
                      <div className="form-group">
                        <label>Months (0-11)</label>
                        <input
                          type="text"
                          value={season.months.join(', ')}
                          onChange={(e) => updateSeasonalConfig(index, 'months', e.target.value.split(',').map(s => s.trim()))}
                          placeholder="e.g., 11, 0, 1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Price Multiplier</label>
                        <input
                          type="number"
                          value={season.multiplier}
                          onChange={(e) => updateSeasonalConfig(index, 'multiplier', e.target.value)}
                          step="0.1"
                          min="0.1"
                        />
                      </div>
                    </div>
                    <small className="season-preview">
                      During {season.name}: price becomes {season.multiplier}x base price
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pricing-note">
            <p><strong>Note:</strong> You can configure additional dynamic pricing strategies (flash sales, time-based discounts, A/B testing) after creating the bundle using the Dynamic Pricing Manager.</p>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || formData.classes.length < 2}
          >
            {loading ? 'Creating Bundle...' : 'Create Bundle'}
          </button>
        </div>
      </form>
    </div>
  );
}
