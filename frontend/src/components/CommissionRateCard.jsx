import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const CommissionRateCard = ({ settings, onSuccess }) => {
  const { updateCommissionRatePhase5G, loading } = useAdmin();
  const [editingTier, setEditingTier] = useState(null);
  const [newRate, setNewRate] = useState('');
  const [error, setError] = useState(null);

  const tiers = ['starter', 'growth', 'pro', 'elite'];
  const tierDescriptions = {
    starter: 'Beginner hosts, 25% commission',
    growth: 'Growing hosts, 20% commission',
    pro: 'Professional hosts, 15% commission',
    elite: 'Elite hosts, 10% commission'
  };

  const handleEditClick = (tier, currentRate) => {
    setEditingTier(tier);
    setNewRate(currentRate.toString());
  };

  const handleSave = async (tier) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      setError('Please enter a valid rate between 0 and 100');
      setTimeout(() => setError(null), 4000);
      return;
    }

    const result = await updateCommissionRatePhase5G(tier, rate);
    if (result) {
      onSuccess(`${tier} commission rate updated to ${rate}%`);
      setEditingTier(null);
      setNewRate('');
    }
  };

  return (
    <div className="commission-rate-card">
      <h2>Commission Rates by Tier</h2>
      {error && <div className="alert alert-error" style={{marginTop: 12}}>{error}</div>}
      <p className="card-description">
        Adjust commission rates for each host tier. Higher rates for lower tiers incentivize growth.
      </p>

      <div className="tier-grid">
        {tiers.map((tier) => {
          const currentRate = settings.commissionRates?.[tier] || 0;
          const isEditing = editingTier === tier;

          return (
            <div key={tier} className="tier-card">
              <div className="tier-header">
                <h3>{tier.charAt(0).toUpperCase() + tier.slice(1)}</h3>
                <span className="tier-badge">{tier}</span>
              </div>

              <p className="tier-description">{tierDescriptions[tier]}</p>

              <div className="tier-rate">
                {isEditing ? (
                  <div className="edit-rate">
                    <input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      min="0"
                      max="100"
                      step="1"
                      disabled={loading}
                    />
                    <span className="percent">%</span>
                  </div>
                ) : (
                  <div className="display-rate">
                    <span className="rate-value">{currentRate}</span>
                    <span className="percent">%</span>
                  </div>
                )}
              </div>

              {isEditing ? (
                <div className="tier-actions">
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleSave(tier)}
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => setEditingTier(null)}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleEditClick(tier, currentRate)}
                  disabled={loading}
                >
                  Edit
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="commission-info">
        <h4>💡 Commission Information</h4>
        <ul>
          <li><strong>Starter:</strong> New hosts with {'<1'} class</li>
          <li><strong>Growth:</strong> Active hosts with 2-5 classes</li>
          <li><strong>Pro:</strong> Established hosts with 6-15 classes</li>
          <li><strong>Elite:</strong> Top hosts with 15+ classes and 4.5+ rating</li>
        </ul>
        <p className="info-note">
          Commission is deducted from every student payment. Tiers upgrade automatically based on activity.
        </p>
      </div>

      {settings.stripeSettings && (
        <div className="stripe-info">
          <h4>🔗 Stripe Integration</h4>
          <div className="stripe-details">
            <div className="detail-row">
              <span>Percentage Fee:</span>
              <strong>{settings.stripeSettings.rate}%</strong>
            </div>
            <div className="detail-row">
              <span>Fixed Fee:</span>
              <strong>${settings.stripeSettings.flatFee}</strong>
            </div>
            <p className="info-note">
              Stripe fees are charged in addition to platform commission and deducted from host earnings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommissionRateCard;