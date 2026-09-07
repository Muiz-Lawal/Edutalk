export const DEFAULT_REFUND_TTL_DAYS = 7;

export const calculateRefundSummary = ({
  amount = 0,
  refundPercentage = 100,
  requestedAmount,
  platformCommission = 0,
  stripeProcessingFee = 0,
  holdbackAmount = 0,
  nonRefundableAmount = 0,
} = {}) => {
  const grossAmount = Number(amount) || 0;
  const commission = Number(platformCommission) || 0;
  const processingFee = Number(stripeProcessingFee) || 0;
  const existingHoldback = Number(holdbackAmount) || 0;
  const nonRefundable = Math.max(0, Number(nonRefundableAmount) || 0);
  const availableToRefund = Math.max(0, grossAmount - commission - processingFee - existingHoldback - nonRefundable);

  const refundRate = Math.min(Math.max(Number(refundPercentage) || 100, 0), 100) / 100;
  const requestedRefund = requestedAmount === undefined
    ? availableToRefund
    : Math.max(0, Number(requestedAmount) || 0);

  const refundAmount = Math.min(
    Math.max(0, requestedRefund),
    availableToRefund * refundRate + (requestedAmount === undefined ? 0 : 0)
  );

  const refundDecision = refundAmount <= 0
    ? 'none'
    : refundAmount >= availableToRefund
      ? 'full'
      : 'partial';

  return {
    grossAmount: Number(grossAmount.toFixed(2)),
    platformCommission: Number(commission.toFixed(2)),
    stripeProcessingFee: Number(processingFee.toFixed(2)),
    holdbackAmount: Number(existingHoldback.toFixed(2)),
    nonRefundableAmount: Number(nonRefundable.toFixed(2)),
    availableToRefund: Number(availableToRefund.toFixed(2)),
    requestedAmount: Number(requestedRefund.toFixed(2)),
    refundPercentage: Number((refundRate * 100).toFixed(2)),
    refundAmount: Number(refundAmount.toFixed(2)),
    refundDecision,
    status: refundAmount > 0 ? 'pending' : 'none',
    estimatedSettlementDays: DEFAULT_REFUND_TTL_DAYS,
  };
};
