import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import '../styles/DiscountAnalytics.css';

export default function DiscountAnalyticsDashboard({ discountId, overall = false }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily');
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [discountId, period, days, overall]);

  const fetchAnalytics = async () => {
    try {
      const endpoint = overall
        ? `/discounts/analytics/overall?period=${period}&days=${days}`
        : `/discounts/${discountId}/analytics?period=${period}&days=${days}`;

      const response = await api.get(endpoint);
      setAnalytics(response.data);
    } catch (error) {
      console.error('Failed to fetch discount analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading discount analytics...</div>;
  }

  if (!analytics) {
    return <div className="error">No analytics data available</div>;
  }

  const formatCurrency = (amount = 0) => `$${(amount || 0).toFixed(2)}`;
  const formatPercent = (value = 0) => `${(value || 0).toFixed(1)}%`;
  const isOverall = overall;
  const title = isOverall
    ? 'Overall Discount Analytics'
    : 'Discount Performance Analytics';
  const topList = isOverall
    ? analytics.topPerforming || []
    : analytics.topItems || [];

  return (
    <div className="discount-analytics-dashboard">
      <div className="analytics-header">
        <h2>{title}</h2>
        <div className="controls">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="period-select">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <select value={days} onChange={(e) => setDays(parseInt(e.target.value))} className="days-select">
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Discount Overview */}
      {isOverall ? (
        <div className="discount-overview">
          <div className="overview-card">
            <h3>All Discount Codes</h3>
            <p className="discount-code">
              Summary for all discounts created by your account
            </p>
            <div className="discount-status">
              <span className="status active">Overall Performance</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="discount-overview">
          <div className="overview-card">
            <h3>{analytics.discount.name}</h3>
            <p className="discount-code">Code: <strong>{analytics.discount.code}</strong></p>
            <p className="discount-type">
              {analytics.discount.type === 'percentage' ? `${analytics.discount.value}% off` : `$${analytics.discount.value} off`}
            </p>
            <div className="discount-status">
              <span className={`status ${analytics.discount.isActive ? 'active' : 'inactive'}`}>
                {analytics.discount.isActive ? 'Active' : 'Inactive'}
              </span>
              {analytics.discount.isExpired && <span className="status expired">Expired</span>}
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{analytics.summary.totalUses}</div>
          <div className="metric-label">Total Uses</div>
          <div className="metric-subtext">in last {days} days</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{analytics.summary.uniqueUsers}</div>
          <div className="metric-label">Unique Users</div>
          <div className="metric-subtext">different customers</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatCurrency(analytics.summary.totalRevenue)}</div>
          <div className="metric-label">Total Revenue</div>
          <div className="metric-subtext">from discounted sales</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatCurrency(analytics.summary.totalDiscountAmount)}</div>
          <div className="metric-label">Total Discount Given</div>
          <div className="metric-subtext">cost to business</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatCurrency(analytics.summary.averageOrderValue)}</div>
          <div className="metric-label">Avg Order Value</div>
          <div className="metric-subtext">per discounted purchase</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatPercent(analytics.summary.conversionRate)}</div>
          <div className="metric-label">Conversion Rate</div>
          <div className="metric-subtext">usage vs total payments</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{formatPercent(analytics.summary.roi)}</div>
          <div className="metric-label">ROI</div>
          <div className="metric-subtext">return on discount investment</div>
        </div>
        {isOverall ? (
          <div className="metric-card">
            <div className="metric-value">{analytics.summary.totalDiscounts}</div>
            <div className="metric-label">Total Discounts</div>
            <div className="metric-subtext">created by you</div>
          </div>
        ) : (
          <div className="metric-card">
            <div className="metric-value">
              {analytics.discount.conditions.maxUses
                ? `${analytics.discount.conditions.usageCount}/${analytics.discount.conditions.maxUses}`
                : analytics.discount.conditions.usageCount
              }
            </div>
            <div className="metric-label">Usage Count</div>
            <div className="metric-subtext">
              {analytics.discount.conditions.maxUses ? 'remaining uses' : 'unlimited'}
            </div>
          </div>
        )}
      </div>

      {/* Usage Trend Chart */}
      <div className="chart-section">
        <h3>Usage Trend</h3>
        <div className="chart-container">
          <div className="chart">
            {(analytics.usageTrend || []).map((point, idx) => (
              <div key={idx} className="chart-point">
                <div className="chart-bar uses" style={{
                  height: `${Math.max((point.uses / Math.max(...(analytics.usageTrend || []).map(p => p.uses || 0))) * 150, 2)}px`
                }} title={`${point.date}: ${point.uses} uses`} />
                <div className="chart-bar revenue" style={{
                  height: `${Math.max((point.revenue / Math.max(...(analytics.usageTrend || []).map(p => p.revenue || 0))) * 150, 2)}px`
                }} title={`${point.date}: ${formatCurrency(point.revenue)}`} />
              </div>
            ))}
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <div className="legend-color uses"></div>
              <span>Uses</span>
            </div>
            <div className="legend-item">
              <div className="legend-color revenue"></div>
              <span>Revenue</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing */}
      {topList.length > 0 && (
        <div className="top-items-section">
          <h3>{isOverall ? 'Top Performing Discounts' : 'Top Performing Items'}</h3>
          <div className="items-table">
            <div className="table-header">
              <span>{isOverall ? 'Discount Code' : 'Item'}</span>
              <span>Uses</span>
              <span>Revenue</span>
              <span>Discount Given</span>
            </div>
            {topList.map((item, idx) => (
              <div key={idx} className="table-row">
                <span className="item-name">
                  {isOverall ? item.code || item.name : item.item}
                </span>
                <span>{item.usageCount}</span>
                <span>{formatCurrency(item.revenue)}</span>
                <span>{formatCurrency(item.discountAmount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Usage */}
      {analytics.recentUsage.length > 0 && (
        <div className="recent-usage-section">
          <h3>Recent Usage</h3>
          <div className="usage-table">
            <div className="table-header">
              <span>User</span>
              <span>Discount Amount</span>
              <span>Order Value</span>
              <span>Item Type</span>
              <span>Date</span>
            </div>
            {analytics.recentUsage.map((usage, idx) => (
              <div key={idx} className="table-row">
                <span className="user-name">{usage.user}</span>
                <span>{formatCurrency(usage.amount)}</span>
                <span>{formatCurrency(usage.revenue)}</span>
                <span>{usage.itemType}</span>
                <span>{new Date(usage.createdAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Discount Conditions Summary */}
      {isOverall ? (
        <div className="conditions-summary">
          <h3>Overall Discount Summary</h3>
          <div className="conditions-grid">
            <div className="condition-item">
              <span className="label">Total Discounts</span>
              <span className="value">{analytics.summary.totalDiscounts}</span>
            </div>
            <div className="condition-item">
              <span className="label">Active Discounts</span>
              <span className="value">{analytics.summary.activeDiscounts}</span>
            </div>
            <div className="condition-item">
              <span className="label">Total Uses</span>
              <span className="value">{analytics.summary.totalUses}</span>
            </div>
            <div className="condition-item">
              <span className="label">Unique Users</span>
              <span className="value">{analytics.summary.uniqueUsers}</span>
            </div>
            <div className="condition-item">
              <span className="label">Average ROI</span>
              <span className="value">{formatPercent(analytics.summary.averageRoi)}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="conditions-summary">
          <h3>Discount Conditions</h3>
          <div className="conditions-grid">
            <div className="condition-item">
              <span className="label">Min Purchase:</span>
              <span className="value">
                {analytics.discount.conditions.minPurchase > 0
                  ? formatCurrency(analytics.discount.conditions.minPurchase)
                  : 'No minimum'
                }
              </span>
            </div>
            <div className="condition-item">
              <span className="label">Max Uses:</span>
              <span className="value">
                {analytics.discount.conditions.maxUses || 'Unlimited'}
              </span>
            </div>
            <div className="condition-item">
              <span className="label">Per User Limit:</span>
              <span className="value">
                {analytics.discount.conditions.userRestrictions?.maxUsesPerUser || 'Unlimited'}
              </span>
            </div>
            <div className="condition-item">
              <span className="label">First Time Only:</span>
              <span className="value">
                {analytics.discount.conditions.userRestrictions?.firstTimeOnly ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="condition-item">
              <span className="label">Valid From:</span>
              <span className="value">
                {analytics.discount.conditions.validFrom
                  ? new Date(analytics.discount.conditions.validFrom).toLocaleDateString()
                  : 'Always'
                }
              </span>
            </div>
            <div className="condition-item">
              <span className="label">Valid Until:</span>
              <span className="value">
                {analytics.discount.conditions.validUntil
                  ? new Date(analytics.discount.conditions.validUntil).toLocaleDateString()
                  : 'No expiration'
                }
              </span>
            </div>
            <div className="condition-item">
              <span className="label">Applicable To:</span>
              <span className="value">{analytics.discount.conditions.applicableTo}</span>
            </div>
            <div className="condition-item">
              <span className="label">Specific Items:</span>
              <span className="value">
                {analytics.discount.conditions.specificItems?.length > 0
                  ? `${analytics.discount.conditions.specificItems.length} items`
                  : 'All applicable items'
                }
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}