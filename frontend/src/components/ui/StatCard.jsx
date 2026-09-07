import React from 'react';
import { TrendingDown, TrendingUp } from 'lucide-react';
import Card from './Card';
import './ui.css';

export default function StatCard({ label, value, trend, trendDirection = 'up', loading = false }) {
  return (
    <Card className="ui-stat-card">
      <span className="ui-stat-card__label">{label}</span>
      {loading ? <span className="ui-skeleton ui-stat-card__skeleton" /> : <strong>{value}</strong>}
      {trend && <span className={`ui-stat-card__trend ui-stat-card__trend--${trendDirection}`}>{trendDirection === 'down' ? <TrendingDown size={14} /> : <TrendingUp size={14} />}{trend}</span>}
    </Card>
  );
}
