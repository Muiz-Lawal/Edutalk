import User from '../models/User.js';

export const TIERS = ['starter', 'growth', 'pro', 'elite'];
export const TIER_THRESHOLDS = { starter: 0, growth: 23, pro: 73, elite: 198 };
export const FEATURES = {
  builtinVideo: ['off', 'on', 'on', 'on'],
  recording: ['off', 'off', 'on', 'on'],
  recordingAutoShare: ['off', 'off', 'off', 'on'],
};

export class FeatureGateError extends Error {
  constructor(feature, currentTier) {
    const index = FEATURES[feature].findIndex((value) => value === 'on');
    const requiredTier = TIERS[index];
    super(`${feature} requires ${requiredTier}`);
    this.name = 'FeatureGateError';
    this.code = 'plan_gate';
    this.feature = feature;
    this.currentTier = currentTier;
    this.requiredTier = requiredTier;
    this.upgradeThreshold = TIER_THRESHOLDS[requiredTier];
  }
}

export async function getHostTier(hostId) {
  const host = await User.findById(hostId).select('activatedPlanTier planTier');
  return TIERS.includes(host?.activatedPlanTier) ? host.activatedPlanTier : 'starter';
}

export async function assertFeature(hostId, feature) {
  if (!FEATURES[feature]) throw new Error(`Unknown plan feature: ${feature}`);
  const currentTier = await getHostTier(hostId);
  const enabled = FEATURES[feature][TIERS.indexOf(currentTier)] === 'on';
  if (!enabled) throw new FeatureGateError(feature, currentTier);
  return 'on';
}

export function planGateResponse(error, res) {
  if (error?.code === 'plan_gate') {
    return res.status(403).json({
      code: error.code,
      feature: error.feature,
      currentTier: error.currentTier,
      requiredTier: error.requiredTier,
      upgradeThreshold: error.upgradeThreshold,
    });
  }
  return null;
}
