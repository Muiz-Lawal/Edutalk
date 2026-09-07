export const HOLD_BACK_RATE = 0.125;
export const HOLD_BACK_DAYS = 30;

export const calculatePayoutLedger = ({
  amount,
  platformCommission = 0,
  stripeProcessingFee = 0,
  hostEarnings = 0,
  holdbackRate = HOLD_BACK_RATE,
  holdbackDays = HOLD_BACK_DAYS,
}) => {
  const grossAmount = Number(amount) || 0;
  const netHostEarnings = Number(hostEarnings) || Math.max(0, grossAmount - Number(platformCommission) - Number(stripeProcessingFee));
  const holdbackAmount = Math.max(0, netHostEarnings * holdbackRate);
  const payoutAmount = Math.max(0, netHostEarnings - holdbackAmount);

  return {
    grossAmount: Number(grossAmount.toFixed(2)),
    platformCommission: Number(Number(platformCommission).toFixed(2)),
    stripeProcessingFee: Number(Number(stripeProcessingFee).toFixed(2)),
    hostEarnings: Number(netHostEarnings.toFixed(2)),
    holdbackAmount: Number(holdbackAmount.toFixed(2)),
    payoutAmount: Number(payoutAmount.toFixed(2)),
    holdbackRate,
    holdbackDays,
    payoutStatus: holdbackAmount > 0 ? 'hold' : 'available',
  };
};
