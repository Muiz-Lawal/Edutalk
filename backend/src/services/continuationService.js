import Subscription from '../models/Subscription.js';
import {
  calculateContinuationPrice,
  calculateContinuationPriceCents,
} from '../utils/pricing.js';

export const findActiveSubscription = ({ userId, classId }) => Subscription.findOne({
  userId,
  classId,
  status: 'active',
});

export const quoteContinuation = ({ monthlyPrice, subscription, additionalDays }) => {
  const previousDaysPurchased = Number(subscription?.totalDaysPurchased || 0);
  const previousAmountPaid = Number(subscription?.totalAmountPaid || 0);
  return {
    isContinuation: Boolean(subscription),
    previousDaysPurchased,
    previousAmountPaid,
    amount: calculateContinuationPrice(
      monthlyPrice,
      previousDaysPurchased,
      previousAmountPaid,
      additionalDays,
    ),
    amountCents: calculateContinuationPriceCents(
      monthlyPrice,
      previousDaysPurchased,
      previousAmountPaid,
      additionalDays,
    ),
  };
};

/**
 * Append a successful payment to a subscription's continuation ledger.
 * The payment id is deliberately written after the payment is saved so the
 * chain can be used to audit every charge without creating dangling entries.
 */
export const recordContinuationPayment = async ({
  subscription,
  paymentId,
  amount,
  days,
  endDate,
}) => {
  const alreadyRecorded = (subscription.paymentChain || [])
    .some((entry) => String(entry.paymentId) === String(paymentId));
  if (!alreadyRecorded) {
    subscription.paymentChain = subscription.paymentChain || [];
    subscription.paymentChain.push({
      paymentId,
      date: new Date(),
      amount,
      days,
    });
  }

  subscription.totalDaysPurchased = Number(subscription.totalDaysPurchased || 0) + Number(days || 0);
  subscription.totalAmountPaid = Number((Number(subscription.totalAmountPaid || 0) + Number(amount || 0)).toFixed(2));
  subscription.numberOfDays = subscription.totalDaysPurchased;
  if (endDate && (!subscription.endDate || new Date(endDate) > new Date(subscription.endDate))) {
    subscription.endDate = endDate;
  }
  subscription.status = 'active';
  await subscription.save();
  return subscription;
};
