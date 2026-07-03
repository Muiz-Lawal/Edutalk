import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

const FeatureFlagToggle = ({ flags, onSuccess }) => {
  const { toggleFeatureFlagPhase5G, loading } = useAdmin();
  const [localFlags, setLocalFlags] = useState(flags || []);
  const [rolloutPercentages, setRolloutPercentages] = useState(
    flags?.reduce((acc, flag) => {
      acc[flag.id] = flag.rolloutPercentage || 100;
      return acc;
    }, {}) || {}
  );

  const featureDescriptions = {
    'live-streaming': 'Enable real-time video conferencing for classes',
    'recording': 'Allow hosts to record and replay class sessions',
    'mobile-app': 'Enable mobile app access for students and hosts',
    'ai-summarization': 'Auto-generate class summaries using AI',
    'advanced-analytics': 'Show detailed performance analytics and insights',
    'affiliate-program': 'Allow hosts to earn commissions on referrals',
    'batch-exports': 'Enable bulk data export for compliance',
    'api-access': 'Allow third-party integrations via API',
  };

  const handleToggle = async (flagId, currentStatus) => {
    const newStatus = !currentStatus;
    const result = await toggleFeatureFlagPhase5G(
      flagId,
      newStatus,
      rolloutPercentages[flagId] || 100
    );

    if (result) {
      setLocalFlags(
        localFlags.map(flag =>
          flag.id === flagId ? { ...flag, enabled: newStatus } : flag
        )
      );
      onSuccess(`Feature "${flagId}" ${newStatus ? 'enabled' : 'disabled'}`);
    }
  };

  const handleRolloutChange = (flagId, percentage) => {
    setRolloutPercentages({
      ...rolloutPercentages,
      [flagId]: percentage
    });
  };

  return (
    <div className="feature-flag-toggle">
      <h2>Feature Flags</h2>
      <p className="card-description">
        Control which features are available to users. Use rollout percentages for gradual deployment.
      </p>

      <div className="flags-container">
        {localFlags.map((flag) => (
          <div key={flag.id} className="flag-card">
            <div className="flag-header">
              <div className="flag-info">
                <h3>{flag.name}</h3>
                <p className="flag-description">
                  {featureDescriptions[flag.id] || flag.description || 'Feature flag'}
                </p>
              </div>

              <div className="flag-status">
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={flag.enabled}
                    onChange={() => handleToggle(flag.id, flag.enabled)}
                    disabled={loading}
                  />
                  <span className="toggle-slider"></span>
                </label>
                <span className={`status-badge ${flag.enabled ? 'enabled' : 'disabled'}`}>
                  {flag.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            </div>

            {flag.enabled && (
              <div className="rollout-section">
                <label>Rollout Percentage</label>
                <div className="rollout-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={rolloutPercentages[flag.id] || 100}
                    onChange={(e) => handleRolloutChange(flag.id, parseInt(e.target.value))}
                    disabled={loading}
                    className="rollout-slider"
                  />
                  <span className="rollout-value">
                    {rolloutPercentages[flag.id] || 100}%
                  </span>
                </div>
                <p className="rollout-description">
                  Deploy to {rolloutPercentages[flag.id] || 100}% of users for gradual rollout
                </p>
              </div>
            )}

            {flag.createdAt && (
              <div className="flag-meta">
                <small>
                  Created: {new Date(flag.createdAt).toLocaleDateString()}
                  {flag.updatedAt && ` • Updated: ${new Date(flag.updatedAt).toLocaleDateString()}`}
                </small>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rollout-strategy">
        <h4>🚀 Rollout Strategy</h4>
        <ul>
          <li><strong>0%:</strong> Feature disabled for all users</li>
          <li><strong>1-50%:</strong> Beta testing with internal users and early adopters</li>
          <li><strong>51-99%:</strong> Monitored rollout, collect feedback from majority</li>
          <li><strong>100%:</strong> Feature available to all users globally</li>
        </ul>
      </div>

      <div className="flag-guidelines">
        <h4>📋 Best Practices</h4>
        <ul>
          <li>Always enable in staging environment first</li>
          <li>Start with 1-10% rollout for critical features</li>
          <li>Monitor error rates and user feedback during rollout</li>
          <li>Increase percentage gradually over 1-2 weeks</li>
          <li>Have a rollback plan if issues are discovered</li>
          <li>Document feature requirements in your issue tracker</li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureFlagToggle;
