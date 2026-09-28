import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import Class from '../models/Class.js';
import PaymentChain from '../models/PaymentChain.js';
import User from '../models/User.js';
import { bindAccessCodeContext } from '../utils/accessCode.js';
import { getAccessWindow } from '../utils/enrollmentDays.js';
import { calculatePaymentSplit, toCents } from '../utils/pricing.js';
import { HOST_PLAN_THRESHOLDS, getHostPlanDetails } from '../utils/hostPlans.js';
import { backfillStudentRecordingLibrary } from './recordingLibrary.js';
import { dispatch } from '../lib/notifications.js';
import { getActiveHostSubscriberCount } from './hostSubscriberCount.js';

export async function activatePayment({ payment, source = 'webhook' }) {
  if (!payment || payment.status !== 'completed') return { activated: false, subscriptions: [] };
  if (payment.subscriptionId) {
    return { activated: false, alreadyActivated: true, subscriptions: [payment.subscriptionId] };
  }

  const items = payment.checkoutItems?.length
    ? payment.checkoutItems
    : [{ classId: payment.classId, days: payment.daysPurchased, amount: payment.amount }];
  const subscriptions = [];
  const newlyEnrolledClasses = [];

  for (const item of items) {
    const classData = await Class.findById(item.classId);
    if (!classData) continue;
    const existing = await Subscription.findOne({ userId: payment.userId, classId: item.classId, status: 'active' });
    const days = Number(item.days || payment.daysPurchased || 0);
    const accessWindow = getAccessWindow(classData, days);
    const startDate = existing?.startDate || accessWindow.startDate;
    const endDate = existing
      ? new Date(Math.max(
        new Date(existing.endDate || startDate).getTime() + days * 86400000,
        accessWindow.endDate.getTime(),
      ))
      : accessWindow.endDate;
    const amount = Number(item.amount || payment.amount || 0);
    const subscription = existing || new Subscription({
      userId: payment.userId,
      classId: item.classId,
      ...(() => {
        const context = bindAccessCodeContext({
          email: payment.userEmail,
          classId: item.classId,
          validFrom: startDate,
          validUntil: endDate,
        });
        return {
          accessCode: context.accessCode,
          accessCodeEmail: context.email,
          accessCodeClassId: item.classId,
          accessCodeValidFrom: context.validFrom,
          accessCodeValidUntil: context.validUntil,
          trustedDeviceFingerprints: context.trustedDeviceFingerprints,
        };
      })(),
      numberOfDays: days,
      startDate,
      endDate,
      accessTimezone: accessWindow.timezone,
      status: 'active',
      totalDaysPurchased: days,
      totalAmountPaid: amount,
    });

    if (existing) {
      existing.totalDaysPurchased = Number(existing.totalDaysPurchased || 0) + days;
      existing.totalAmountPaid = Number((Number(existing.totalAmountPaid || 0) + amount).toFixed(2));
      existing.numberOfDays = existing.totalDaysPurchased;
      existing.endDate = endDate;
      existing.status = 'active';
    }

    await subscription.save();
    const paymentChainEntry = (subscription.paymentChain || [])
      .some((entry) => String(entry.paymentId) === String(payment._id));
    if (!paymentChainEntry) {
      subscription.paymentChain = subscription.paymentChain || [];
      subscription.paymentChain.push({
        paymentId: payment._id,
        date: new Date(),
        amount,
        days,
      });
      await subscription.save();
    }
    if (!existing) {
      classData.totalEnrolled = Number(classData.totalEnrolled || 0) + 1;
      await classData.save();
      newlyEnrolledClasses.push({ classData, subscription, item });
    }
    if (!payment.subscriptionId) {
      payment.subscriptionId = subscription._id;
      payment.classId = item.classId;
      payment.daysPurchased = days;
    }
    await PaymentChain.findOneAndUpdate(
      { studentId: payment.userId, classId: item.classId },
      {
        $setOnInsert: { lockedMonthlyPriceCents: toCents(classData.monthlyPrice) },
        $inc: { totalDaysPurchased: days, totalAmountPaidCents: toCents(amount) },
        $set: { currentSubId: subscription._id },
      },
      { upsert: true, new: true },
    );
    await backfillStudentRecordingLibrary({ userId: payment.userId, classId: item.classId });
    subscriptions.push(subscription);
  }

  if (subscriptions.length) {
    const student = await User.findById(payment.userId).select('firstName email timezone');
    const receiptItems = await Promise.all(subscriptions.map(async (subscription) => {
      const item = items.find((entry) => String(entry.classId) === String(subscription.classId));
      const classData = await Class.findById(subscription.classId).populate('hostId', 'firstName lastName hostDisplayName');
      return {
        classId: String(subscription.classId),
        classTitle: classData?.title || 'EduTalk class',
        hostName: classData?.hostId?.hostDisplayName
          || `${classData?.hostId?.firstName || ''} ${classData?.hostId?.lastName || ''}`.trim(),
        dates: `${new Date(subscription.startDate).toLocaleDateString('en')} – ${new Date(subscription.endDate).toLocaleDateString('en')}`,
        amount: Number(item?.amount ?? payment.amount),
        currency: payment.currency || 'USD',
      };
    }));
    await dispatch(student, 'enrollment_receipt', {
      entityId: String(payment._id),
      orderId: payment.checkoutId || String(payment._id),
      items: receiptItems,
      classId: receiptItems[0]?.classId,
    });

    for (const { classData, subscription, item } of newlyEnrolledClasses) {
      const host = await User.findById(classData.hostId).select('firstName email timezone totalActiveStudents planTier activatedPlanTier emailPreferences');
      if (!host) continue;
      const subscriberCount = await getActiveHostSubscriberCount(host._id);
      const hostTier = host.activatedPlanTier || host.planTier || 'starter';
      const nextTier = getHostPlanDetails(hostTier).nextTier;
      const threshold = nextTier ? HOST_PLAN_THRESHOLDS[nextTier].minStudents : null;
      const netAmount = Number(payment.hostEarnings ?? calculatePaymentSplit(
        Number(item.amount || payment.amount),
        hostTier,
      ).hostEarnings);
      await dispatch(host, 'new_enrollment', {
        entityId: `${payment._id}:${classData._id}`,
        classId: String(classData._id),
        classTitle: classData.title,
        studentFirstName: student?.firstName || 'A student',
        amount: netAmount,
        currency: payment.currency || 'USD',
        subscriberCount,
        nextTierThreshold: threshold,
      });
    }
  }

  payment.activationSource = source;
  payment.activatedAt = new Date();
  await payment.save();
  return { activated: subscriptions.length > 0, subscriptions };
}
