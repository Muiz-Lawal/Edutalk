export const HOST_PLAN_THRESHOLDS = {
  starter: {
    label: 'Starter',
    minStudents: 0,
    minRating: 0,
    freeAdmissionSlots: 0,
    nextTier: 'growth',
  },
  growth: {
    label: 'Growth',
    minStudents: 23,
    minRating: 0,
    freeAdmissionSlots: 0,
    nextTier: 'pro',
  },
  pro: {
    label: 'Pro',
    minStudents: 73,
    minRating: 0,
    freeAdmissionSlots: 0,
    nextTier: 'elite',
  },
  elite: {
    label: 'Elite',
    minStudents: 198,
    minRating: 4.5,
    freeAdmissionSlots: 0,
    nextTier: null,
  },
};

export const resolveHostPlanTier = ({ totalActiveStudents = 0, averageRating = 0, currentTier = 'starter' }) => {
  const normalizedCurrentTier = HOST_PLAN_THRESHOLDS[currentTier] ? currentTier : 'starter';
  const metrics = {
    totalActiveStudents: Number(totalActiveStudents) || 0,
    averageRating: Number(averageRating) || 0,
  };

  let nextTier = normalizedCurrentTier;

  if (metrics.totalActiveStudents >= HOST_PLAN_THRESHOLDS.elite.minStudents && metrics.averageRating >= HOST_PLAN_THRESHOLDS.elite.minRating) {
    nextTier = 'elite';
  } else if (metrics.totalActiveStudents >= HOST_PLAN_THRESHOLDS.pro.minStudents) {
    nextTier = 'pro';
  } else if (metrics.totalActiveStudents >= HOST_PLAN_THRESHOLDS.growth.minStudents) {
    nextTier = 'growth';
  } else {
    nextTier = 'starter';
  }

  if (currentTier === 'elite' && nextTier !== 'elite') {
    return 'elite';
  }

  return nextTier;
};

export const getHostPlanDetails = (planTier = 'starter') => {
  return HOST_PLAN_THRESHOLDS[planTier] || HOST_PLAN_THRESHOLDS.starter;
};
