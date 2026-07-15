import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import '../styles/DynamicPricingManager.css';

export default function DynamicPricingManager({ bundleId }) {
  const [bundle, setBundle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('analysis');
  const [analysis, setAnalysis] = useState(null);
  const [flashSaleForm, setFlashSaleForm] = useState({
    discountPercent: 20,
    durationHours: 24
  });
  const [seasonalForm, setSeasonalForm] = useState({
    seasons: [
      { name: 'Winter Sale', months: [11, 0, 1], multiplier: 0.9 },
      { name: 'Summer Promotion', months: [5, 6, 7], multiplier: 0.95 },
      { name: 'Back to School', months: [7, 8], multiplier: 0.85 }
    ]
  });
  const [abTestForm, setAbTestForm] = useState({
    durationDays: 7,
    variants: [
      { name: 'Control', discountType: 'percentage', discountValue: 0, trafficPercentage: 50 },
      { name: 'Discount 10%', discountType: 'percentage', discountValue: 10, trafficPercentage: 25 },
      { name: 'Discount 20%', discountType: 'percentage', discountValue: 20, trafficPercentage: 25 }
    ]
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    if (bundleId) {
      loadBundleData();
    }
  }, [bundleId]);

  const loadBundleData = async () => {
    try {
      setLoading(true);
      const [bundleResponse, analysisResponse] = await Promise.all([
        api.get(`/bundles/${bundleId}`),
        api.get(`/bundles/${bundleId}/analyze-pricing`)
      ]);

      setBundle(bundleResponse.data);
      setAnalysis(analysisResponse.data);
    } catch (err) {
      console.error('Load bundle data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptimizePricing = async () => {
    try {
      await api.post(`/bundles/${bundleId}/optimize-pricing`);
      setSuccess('Pricing optimized successfully!');
      setTimeout(() => setSuccess(null), 4000);
      loadBundleData();
    } catch (err) {
      setError('Failed to optimize pricing');
      setTimeout(() => setError(null), 4000);
      console.error('Optimize pricing error:', err);
    }
  };

  const handleCreateFlashSale = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/bundles/${bundleId}/flash-sale`, flashSaleForm);
      setSuccess('Flash sale created successfully!');
      setTimeout(() => setSuccess(null), 4000);
      setFlashSaleForm({ discountPercent: 20, durationHours: 24 });
      loadBundleData();
    } catch (err) {
      setError('Failed to create flash sale');
      setTimeout(() => setError(null), 4000);
      console.error('Create flash sale error:', err);
    }
  };

  const handleSetSeasonalPricing = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/bundles/${bundleId}/seasonal-pricing`, {
        seasonConfig: seasonalForm.seasons
      });
      setSuccess('Seasonal pricing set successfully!');
      setTimeout(() => setSuccess(null), 4000);
      loadBundleData();
    } catch (err) {
      setError('Failed to set seasonal pricing');
      setTimeout(() => setError(null), 4000);
      console.error('Set seasonal pricing error:', err);
    }
  };

  const handleCreateABTest = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/bundles/${bundleId}/ab-test`, abTestForm);
      setSuccess('A/B test created successfully!');
      setTimeout(() => setSuccess(null), 4000);
      loadBundleData();
    } catch (err) {
      setError('Failed to create A/B test');
      setTimeout(() => setError(null), 4000);
      console.error('Create A/B test error:', err);
    }
  };

  const addABTestVariant = () => {
    setAbTestForm(prev => ({
      ...prev,
      variants: [...prev.variants, {
        name: `Variant ${prev.variants.length + 1}`,
        discountType: 'percentage',
        discountValue: 0,
        trafficPercentage: 0
      }]
    }));
  };

  const updateABTestVariant = (index, field, value) => {
    setAbTestForm(prev => ({
      ...prev,
      variants: prev.variants.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    }));
  };

  const removeABTestVariant = (index) => {
    setAbTestForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return <div className="dynamic-pricing-manager"><div className="loading">Loading pricing data...</div></div>;
  }

  if (!bundle) {
    return <div className="dynamic-pricing-manager"><div className="error">Bundle not found</div></div>;
  }

  return (
    <div className="dynamic-pricing-manager">
      <div className="pricing-header">
        <h2>Dynamic Pricing Manager</h2>
        <p>Optimize your bundle pricing with AI-powered recommendations</p>
      </div>

        {error && <div className="alert alert-error" style={{marginTop:12}}>{error}</div>}
        {success && <div className="alert alert-success" style={{marginTop:12}}>{success}</div>}

      <div className="pricing-tabs">
        <button
          className={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
          onClick={() => setActiveTab('analysis')}
        >
          Performance Analysis
        </button>
        <button
          className={`tab-btn ${activeTab === 'flash' ? 'active' : ''}`}
          onClick={() => setActiveTab('flash')}
        >
          Flash Sales
        </button>
        <button
          className={`tab-btn ${activeTab === 'seasonal' ? 'active' : ''}`}
          onClick={() => setActiveTab('seasonal')}
        >
          Seasonal Pricing
        </button>
        <button
          className={`tab-btn ${activeTab === 'abtest' ? 'active' : ''}`}
          onClick={() => setActiveTab('abtest')}
        >
          A/B Testing
        </button>
      </div>

      <div className="pricing-content">
        {activeTab === 'analysis' && analysis && (
          <div className="analysis-tab">
            <div className="current-metrics">
              <h3>Current Performance</h3>
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-value">{analysis.enrollmentRate.toFixed(1)}%</div>
                  <div className="metric-label">Enrollment Rate</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">${analysis.currentPrice.toFixed(2)}</div>
                  <div className="metric-label">Current Price</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">${analysis.revenue.toFixed(2)}</div>
                  <div className="metric-label">Total Revenue</div>
                </div>
                <div className="metric-card">
                  <div className="metric-value">{analysis.currentEnrollment}</div>
                  <div className="metric-label">Enrollments</div>
                </div>
              </div>
            </div>

            <div className="recommendations">
              <h3>AI Recommendations</h3>
              {analysis.recommendations.length === 0 ? (
                <p className="no-recommendations">Your bundle is performing well! No changes needed.</p>
              ) : (
                <div className="recommendations-list">
                  {analysis.recommendations.map((rec, index) => (
                    <div key={index} className={`recommendation ${rec.expectedImpact}`}>
                      <div className="rec-header">
                        <span className="rec-type">{rec.type.replace('_', ' ').toUpperCase()}</span>
                        <span className={`rec-impact ${rec.expectedImpact}`}>
                          {rec.expectedImpact} impact
                        </span>
                      </div>
                      <p>{rec.suggestion}</p>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={handleOptimizePricing}
                className="btn btn-primary optimize-btn"
                disabled={analysis.recommendations.length === 0}
              >
                Auto-Optimize Pricing
              </button>
            </div>
          </div>
        )}

        {activeTab === 'flash' && (
          <div className="flash-tab">
            <h3>Create Flash Sale</h3>
            <form onSubmit={handleCreateFlashSale} className="flash-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Discount Percentage</label>
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={flashSaleForm.discountPercent}
                    onChange={(e) => setFlashSaleForm(prev => ({
                      ...prev,
                      discountPercent: parseInt(e.target.value)
                    }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Duration (hours)</label>
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={flashSaleForm.durationHours}
                    onChange={(e) => setFlashSaleForm(prev => ({
                      ...prev,
                      durationHours: parseInt(e.target.value)
                    }))}
                    required
                  />
                </div>
              </div>

              <div className="flash-preview">
                <h4>Preview</h4>
                <p>Original Price: ${bundle.pricing.totalBundlePrice.toFixed(2)}</p>
                <p>Sale Price: ${(bundle.pricing.totalBundlePrice * (1 - flashSaleForm.discountPercent / 100)).toFixed(2)}</p>
                <p>You Save: ${(bundle.pricing.totalBundlePrice * flashSaleForm.discountPercent / 100).toFixed(2)}</p>
              </div>

              <button type="submit" className="btn btn-primary">
                Launch Flash Sale
              </button>
            </form>
          </div>
        )}

        {activeTab === 'seasonal' && (
          <div className="seasonal-tab">
            <h3>Seasonal Pricing</h3>
            <form onSubmit={handleSetSeasonalPricing} className="seasonal-form">
              <div className="seasons-list">
                {seasonalForm.seasons.map((season, index) => (
                  <div key={index} className="season-item">
                    <div className="season-info">
                      <h4>{season.name}</h4>
                      <p>Months: {season.months.map(m => ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m]).join(', ')}</p>
                      <p>Multiplier: {season.multiplier}x (${(bundle.pricing.totalBundlePrice * season.multiplier).toFixed(2)})</p>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" className="btn btn-primary">
                Apply Seasonal Pricing
              </button>
            </form>
          </div>
        )}

        {activeTab === 'abtest' && (
          <div className="abtest-tab">
            <h3>A/B Testing</h3>
            <form onSubmit={handleCreateABTest} className="abtest-form">
              <div className="form-group">
                <label>Test Duration (days)</label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={abTestForm.durationDays}
                  onChange={(e) => setAbTestForm(prev => ({
                    ...prev,
                    durationDays: parseInt(e.target.value)
                  }))}
                  required
                />
              </div>

              <div className="variants-section">
                <h4>Test Variants</h4>
                {abTestForm.variants.map((variant, index) => (
                  <div key={index} className="variant-item">
                    <div className="variant-header">
                      <input aria-label="Variant name"
                        type="text"
                         placeholder="Variant name"
                        value={variant.name}
                        onChange={(e) => updateABTestVariant(index, 'name', e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeABTestVariant(index)}
                        className="remove-variant"
                        disabled={abTestForm.variants.length <= 2}
                      >
                        Ã—
                      </button>
                    </div>

                    <div className="variant-settings">
                      <select
                        value={variant.discountType}
                        onChange={(e) => updateABTestVariant(index, 'discountType', e.target.value)}
                      >
                        <option value="percentage">Percentage</option>
                        <option value="fixed">Fixed Amount</option>
                      </select>

                      <input
                        type="number"
                        min="0"
                        max={variant.discountType === 'percentage' ? 100 : bundle.pricing.totalBundlePrice}
                        value={variant.discountValue}
                        onChange={(e) => updateABTestVariant(index, 'discountValue', parseFloat(e.target.value))}
                        placeholder={variant.discountType === 'percentage' ? '%' : '$'}
                        required
                      />

                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={variant.trafficPercentage}
                        onChange={(e) => updateABTestVariant(index, 'trafficPercentage', parseInt(e.target.value))}
                        placeholder="% traffic"
                        required
                      />
                    </div>

                    <div className="variant-preview">
                      Price: ${(bundle.pricing.totalBundlePrice *
                        (variant.discountType === 'percentage'
                          ? (1 - variant.discountValue / 100)
                          : Math.max(0, bundle.pricing.totalBundlePrice - variant.discountValue)
                        )).toFixed(2)}
                    </div>
                  </div>
                ))}

                <button type="button" onClick={addABTestVariant} className="btn btn-secondary">
                  Add Variant
                </button>
              </div>

              <button type="submit" className="btn btn-primary">
                Start A/B Test
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
