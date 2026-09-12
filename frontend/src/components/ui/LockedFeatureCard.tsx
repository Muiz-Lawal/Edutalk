import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import Card from './Card';
import './LockedFeatureCard.css';

export type LockedFeature = 'builtinVideo' | 'recording' | 'recordingAutoShare';

const FEATURE_COPY: Record<LockedFeature, { title: string; body: (tier: string, subscribers: number, threshold: number) => string }> = {
  builtinVideo: { title: 'Built-in video is a Growth feature', body: (_tier, subscribers, threshold) => `Built-in video is a Growth feature. You have ${subscribers} active students — ${threshold} unlocks it.` },
  recording: { title: 'Recording is a Pro feature', body: (_tier, subscribers, threshold) => `Recording is a Pro feature. You have ${subscribers} active students — ${threshold} unlocks it.` },
  recordingAutoShare: { title: 'Auto-share is an Elite feature', body: (_tier, subscribers, threshold) => `Auto-share is an Elite feature. You have ${subscribers} active students — ${threshold} unlocks it.` },
};

export default function LockedFeatureCard({ feature, tier = 'Starter', subscribers = 0, threshold }: { feature: LockedFeature; tier?: string; subscribers?: number; threshold: number }) {
  const copy = FEATURE_COPY[feature];
  const progress = threshold > 0 ? Math.min(100, (subscribers / threshold) * 100) : 0;
  return (
    <Card className="locked-feature-card">
      <div className="locked-feature-card__icon"><Lock size={24} /></div>
      <h3>{copy.title}</h3>
      <p>{copy.body(tier, subscribers, threshold)}</p>
      <div className="locked-feature-card__progress" role="progressbar" aria-valuenow={subscribers} aria-valuemin={0} aria-valuemax={threshold}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <Link className="ui-button ui-button--primary ui-button--md" to="/host/plans">See your plan</Link>
    </Card>
  );
}
