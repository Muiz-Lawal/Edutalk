import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import DiscountService from '../services/discountService.js';
import Stripe from 'stripe';
import { calculatePrice, calculatePaymentSplit, calculateContinuationPrice, calculatePriceCents, calculateDailyRate, normalizePricingDays } from '../utils/pricing.js';
import { bindAccessCodeContext, generateAccessCode } from '../utils/accessCode.js';
import { calculatePayoutLedger } from '../utils/payouts.js';
import { createGatewayPaymentIntent, verifyGatewayPayment, verifyPaystackWebhookSignature } from '../utils/paymentGateway.js';
import {
  calculateCheckoutSummary,
  normalizeCheckoutItems,
  validateCheckoutItems,
} from '../utils/multiClassCheckout.js';
import { findActiveSubscription, recordContinuationPayment } from '../services/continuationService.js';
import { calculateRefundSummary } from '../utils/refunds.js';
import { getAccessWindow, validateEnrollmentDays } from '../utils/enrollmentDays.js';
import { randomUUID } from 'crypto';
import PaymentChain from '../models/PaymentChain.js';
import { toCents } from '../utils/pricing.js';
import Cart from '../models/Cart.js';
import { backfillStudentRecordingLibrary } from '../services/recordingLibrary.js';
import { activatePayment } from '../services/paymentActivation.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_example');

export const handleStripeWebhook = async (req, res) => {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).json({ message: 'Stripe webhook secret is not configured' });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    return res.status(400).json({ message: `Invalid Stripe webhook: ${error.message}` });
  }

  const intent = event.data.object;
  if (event.type === 'payment_intent.succeeded' || event.type === 'payment_intent.payment_failed') {
    const payment = await Payment.findOne({ stripePaymentIntentId: intent.id });
    if (payment && payment.status === 'pending') {
      payment.status = event.type === 'payment_intent.succeeded' ? 'completed' : 'failed';
      payment.gatewayEventId = event.id;
      payment.webhookProcessedAt = new Date();
      payment.gateway = 'stripe';
      payment.gatewayReference = intent.id;
      if (payment.status === 'completed') await activatePayment({ payment, source: 'webhook' });
      await payment.save();
    }
  }

  return res.json({ received: true });
};

export const handlePaystackWebhook = async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return res.status(503).json({ message: 'Paystack webhook secret is not configured' });

  const signature = req.headers['x-paystack-signature'];
  if (!verifyPaystackWebhookSignature({ payload: req.body, signature, secret })) {
    return res.status(400).json({ message: 'Invalid Paystack webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(req.body.toString('utf8'));
  } catch (error) {
    return res.status(400).json({ message: 'Invalid Paystack webhook payload' });
  }

  const reference = event?.data?.reference;
  if (!reference) return res.json({ received: true });

  const payment = await Payment.findOne({ gatewayReference: reference })
    || await Payment.findOne({ stripePaymentIntentId: reference });
  if (payment && payment.gatewayEventId !== event.id) {
    payment.gateway = 'paystack';
    payment.gatewayReference = reference;
    payment.gatewayEventId = event.id;
    payment.webhookProcessedAt = new Date();
    payment.status = event.event === 'charge.success' ? 'completed' : 'failed';
    if (payment.status === 'completed') await activatePayment({ payment, source: 'webhook' });
    await payment.save();
  }

  return res.json({ received: true });
};

const validateCheckoutRequest = async ({ userId, items, discountService = DiscountService }) => {
  const validation = validateCheckoutItems(items);
  if (!validation.valid) {
    const error = new Error(validation.errors.join('; '));
    error.statusCode = 400;
    throw error;
  }

  const summary = await calculateCheckoutSummary({
    userId,
    items: validation.items,
    discountService,
  });

  for (const item of summary.items) {
    const classData = await Class.findById(item.classId);
    if (!classData) {
      const error = new Error(`Class not found: ${item.classId}`);
      error.statusCode = 404;
      throw error;
    }
    validateEnrollmentDays(classData, item.numberOfDays);
    if (item.paymentType !== 'continuation'
      && classData.maxStudents
      && classData.totalEnrolled >= classData.maxStudents) {
      const error = new Error('This class is full');
      error.statusCode = 409;
      throw error;
    }
  }

  return summary;
};

export const createCheckoutQuote = async (req, res) => {
  try {
    if (!req.user) {
      const classData = await Class.findById(req.query.classId).populate('hostId', 'firstName lastName');
      if (!classData) return res.status(404).json({ message: 'Class not found' });
      const days = normalizePricingDays(req.query.days || req.query.numberOfDays);
      const maxDays = classData.durationType === 'ongoing'
        ? 30
        : Math.min(30, Math.max(0, classData.endDate
          ? Math.ceil((new Date(classData.endDate).getTime() - Date.now()) / 86400000)
          : Number(classData.daysRemaining || classData.remainingDays || 30)));
      if (days > maxDays || days < Number(classData.minPurchaseDays || 1)) {
        return res.status(400).json({ message: 'Selected days are outside this class availability' });
      }
      const totalCents = calculatePriceCents(classData.monthlyPrice, days);
      return res.json({
        totalCents,
        totalAmountCents: totalCents,
        dailyRateCents: toCents(calculateDailyRate(classData.monthlyPrice, days)),
        breakdown: { dailyRateCents: toCents(calculateDailyRate(classData.monthlyPrice, days)), dailyRateDisplayCents: toCents(calculateDailyRate(classData.monthlyPrice, days)) },
        currency: 'USD',
        expiresInSeconds: 300,
      });
    }
    const normalizedItems = normalizeCheckoutItems({ ...req.query, ...req.body });
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const quote = await validateCheckoutRequest({
      userId: req.user.userId,
      items: normalizedItems,
      discountService: DiscountService,
    });
    const singleLine = quote.items.length === 1 ? quote.items[0] : null;
    return res.json({
      ...quote,
      totalCents: quote.totalAmountCents,
      breakdown: singleLine ? {
        dailyRateDisplayCents: singleLine.dailyRateDisplayCents,
        dailyRateCents: singleLine.dailyRateDisplayCents,
        tier: { multiplier: singleLine.tierMultiplier },
      } : undefined,
      continuation: singleLine?.paymentType === 'continuation' ? {
        applied: 'continuation',
        savedVsFreshCents: Math.max(0, singleLine.baseAmountCents - singleLine.finalAmountCents),
      } : undefined,
      currency: user.preferredCurrency || 'USD',
      expiresInSeconds: 300,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const createPaymentIntent = async (req, res) => {
  try {
    const { classId, numberOfDays, discountCode, provider, items } = req.body;
    const normalizedItems = normalizeCheckoutItems({ classId, numberOfDays, discountCode, items });

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const checkoutSummary = await validateCheckoutRequest({
      userId: req.user.userId,
      items: normalizedItems,
      discountService: DiscountService,
    });
    const checkoutId = randomUUID();

    const gatewayPayload = await createGatewayPaymentIntent({
      provider,
      user,
      classId: normalizedItems[0].classId,
      amount: checkoutSummary.totalAmount,
      numberOfDays: checkoutSummary.totalDays,
      discountCode: normalizedItems.map((item) => item.discountCode).filter(Boolean).join(','),
      items: checkoutSummary.items,
      checkoutId,
    });

    await Payment.create({
      userId: req.user.userId,
      userEmail: user.email,
      classId: normalizedItems[0].classId,
      amount: checkoutSummary.totalAmount,
      currency: user.preferredCurrency || 'USD',
      daysPurchased: checkoutSummary.totalDays,
      checkoutId,
      checkoutItems: checkoutSummary.items.map((item) => ({
        classId: item.classId,
        days: item.numberOfDays,
        amount: item.finalAmount,
      })),
      gateway: gatewayPayload.provider,
      gatewayReference: gatewayPayload.paymentIntentId || gatewayPayload.reference,
      stripePaymentIntentId: gatewayPayload.paymentIntentId || gatewayPayload.reference,
      status: 'pending',
    });

    res.json({
      ...gatewayPayload,
      amount: checkoutSummary.totalAmount,
      numberOfDays: checkoutSummary.totalDays,
      items: checkoutSummary.items,
      multiClass: normalizedItems.length > 1,
      checkoutId,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const {
      paymentIntentId,
      paymentReference,
      classId,
      numberOfDays,
      provider,
      items,
      checkoutId,
    } = req.body;
    const normalizedItems = normalizeCheckoutItems({ classId, numberOfDays, items });

    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const paymentVerification = await verifyGatewayPayment({
      provider,
      paymentIntentId,
      paymentReference,
      user,
    });

    if (paymentVerification.status !== 'succeeded') {
      return res.status(400).json({ message: paymentVerification.message || 'Payment not confirmed' });
    }

    const verifiedReference = paymentVerification.paymentIntentId || paymentReference || paymentIntentId;
    const pendingPayment = await Payment.findOne({
      userId: req.user.userId,
      gatewayReference: verifiedReference,
      status: 'pending',
    });
    if (pendingPayment) {
      pendingPayment.status = 'completed';
      pendingPayment.gateway = paymentVerification.provider;
      pendingPayment.gatewayReference = verifiedReference;
      pendingPayment.stripePaymentIntentId = verifiedReference;
      await activatePayment({ payment: pendingPayment, source: 'confirm' });
      return res.json({
        message: 'Payment confirmed successfully',
        provider: paymentVerification.provider,
        subscriptions: pendingPayment.subscriptionId ? [{
          subscriptionId: pendingPayment.subscriptionId,
          classId: pendingPayment.classId,
        }] : [],
        totalAmount: pendingPayment.amount,
      });
    }

    const existingPayment = await Payment.findOne({
      stripePaymentIntentId: paymentVerification.paymentIntentId || paymentReference || paymentIntentId,
      gateway: paymentVerification.provider,
      gatewayReference: paymentVerification.paymentIntentId || paymentReference || paymentIntentId,
      activationSource: 'confirm',
      activatedAt: new Date(),
      status: 'completed',
      userId: req.user.userId,
    });
    if (existingPayment) {
      const existingSubscription = await Subscription.findById(existingPayment.subscriptionId);
      return res.json({
        message: 'Payment was already confirmed',
        provider: paymentVerification.provider,
        subscriptions: existingSubscription ? [{
          classId: existingSubscription.classId,
          accessCode: existingSubscription.accessCode,
          startDate: existingSubscription.startDate,
          endDate: existingSubscription.endDate,
        }] : [],
        totalAmount: existingPayment.amount,
      });
    }

    const checkoutSummary = await validateCheckoutRequest({
      userId: req.user.userId,
      items: normalizedItems,
      discountService: DiscountService,
    });

    const createdSubscriptions = [];

    for (const item of checkoutSummary.items) {
      const classData = await Class.findById(item.classId).populate('hostId', 'planTier');
      if (!classData) continue;
      const existingSubscription = await findActiveSubscription({
        userId: req.user.userId,
        classId: item.classId,
      });
      if (!existingSubscription && classData.maxStudents && classData.totalEnrolled >= classData.maxStudents) {
        const error = new Error('This class is full');
        error.statusCode = 409;
        throw error;
      }

      const finalAmount = item.finalAmount;
      const split = calculatePaymentSplit(finalAmount, item.hostPlanTier);
      const payoutSummary = calculatePayoutLedger({
        amount: finalAmount,
        platformCommission: split.platformCommission,
        stripeProcessingFee: split.stripeProcessingFee,
        hostEarnings: split.hostEarnings,
      });

      const accessWindow = getAccessWindow(classData, item.numberOfDays);
      const startDate = existingSubscription?.startDate || accessWindow.startDate;
      const endDate = existingSubscription
        ? new Date(Math.max(
          new Date(existingSubscription.endDate || accessWindow.startDate).getTime()
            + item.numberOfDays * 24 * 60 * 60 * 1000,
          accessWindow.endDate.getTime(),
        ))
        : accessWindow.endDate;
      const subscription = existingSubscription || new Subscription({
        userId: req.user.userId,
        classId: item.classId,
        ...(() => {
          const accessCodeContext = bindAccessCodeContext({
            email: user.email,
            classId: item.classId,
            validFrom: startDate,
            validUntil: endDate,
          });
          return {
            accessCode: accessCodeContext.accessCode,
            accessCodeEmail: accessCodeContext.email,
            accessCodeClassId: item.classId,
            accessCodeValidFrom: accessCodeContext.validFrom,
            accessCodeValidUntil: accessCodeContext.validUntil,
            trustedDeviceFingerprints: accessCodeContext.trustedDeviceFingerprints,
          };
        })(),
        numberOfDays: item.numberOfDays,
        startDate,
        endDate,
        accessTimezone: accessWindow.timezone,
        status: 'active',
        totalDaysPurchased: item.numberOfDays,
        totalAmountPaid: finalAmount,
      });

      const payment = new Payment({
        userId: req.user.userId,
        classId: item.classId,
        subscriptionId: subscription._id,
        amount: finalAmount,
        currency: user.preferredCurrency || 'USD',
        daysPurchased: item.numberOfDays,
        checkoutId,
        checkoutItems: checkoutSummary.items.map((lineItem) => ({
          classId: lineItem.classId,
          days: lineItem.numberOfDays,
          amount: lineItem.finalAmount,
        })),
        ...split,
        payoutStatus: payoutSummary.payoutStatus,
        holdbackAmount: payoutSummary.holdbackAmount,
        holdbackRate: payoutSummary.holdbackRate,
        holdbackDays: payoutSummary.holdbackDays,
        payoutAmount: payoutSummary.payoutAmount,
        stripePaymentIntentId: paymentVerification.paymentIntentId || paymentReference || paymentIntentId,
        status: 'completed',
        paymentType: item.paymentType,
        discountCode: item.discountCode,
        discountAmount: item.discountAmount,
      });

      await payment.save();

      if (existingSubscription) {
        existingSubscription.accessCodeValidUntil = endDate;
        await recordContinuationPayment({
          subscription,
          paymentId: payment._id,
          amount: finalAmount,
          days: item.numberOfDays,
          endDate,
        });
      } else {
        subscription.paymentChain = [{
          paymentId: payment._id,
          date: new Date(),
          amount: finalAmount,
          days: item.numberOfDays,
        }];
        await subscription.save();
        classData.totalEnrolled += 1;
        await classData.save();
      }
      // Elite recordings are copied into the student's library on activation.
      // The unique compound index makes this safe for retries and renewals.
      await backfillStudentRecordingLibrary({ userId: req.user.userId, classId: item.classId });

      await PaymentChain.findOneAndUpdate(
        { studentId: req.user.userId, classId: item.classId },
        {
          $setOnInsert: { lockedMonthlyPriceCents: toCents(classData.monthlyPrice) },
          $inc: { totalDaysPurchased: item.numberOfDays, totalAmountPaidCents: toCents(finalAmount) },
          $set: { currentSubId: subscription._id },
        },
        { upsert: true, new: true },
      );

      createdSubscriptions.push({
        classId: item.classId,
        accessCode: subscription.accessCode,
        startDate,
        endDate,
      });
    }

    res.json({
      message: 'Payment confirmed successfully',
      provider: paymentVerification.provider,
      subscriptions: createdSubscriptions,
      totalAmount: checkoutSummary.totalAmount,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const mergeCart = async (req, res) => {
  const incoming = Array.isArray(req.body?.lines) ? req.body.lines : [];
  const existing = await Cart.findOne({ userId: req.user.userId });
  const merged = new Map((existing?.lines || []).map((line) => [String(line.classId), { classId: line.classId, days: line.days }]));
  for (const line of incoming.slice(0, 10)) {
    if (line?.classId) merged.set(String(line.classId), { classId: line.classId, days: Math.min(30, Math.max(1, Number(line.days) || 1)) });
  }
  const lines = Array.from(merged.values()).slice(0, 10);
  const cart = await Cart.findOneAndUpdate({ userId: req.user.userId }, { userId: req.user.userId, lines }, { upsert: true, new: true });
  return res.json({ lines: cart.lines });
};

export const getCart = async (req, res) => {
  const cart = await Cart.findOne({ userId: req.user.userId }).lean();
  return res.json({ lines: cart?.lines || [] });
};

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .select('-stripePaymentIntentId -stripeChargeId')
      .populate('classId', 'title')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

export const processRefund = async (req, res) => {
  try {
    const { paymentId, reason, refundPercentage = 100, requestedAmount } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    const payment = await Payment.findById(paymentId);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    const refundSummary = calculateRefundSummary({
      amount: payment.amount,
      refundPercentage,
      requestedAmount,
      platformCommission: payment.platformCommission || 0,
      stripeProcessingFee: payment.stripeProcessingFee || 0,
      holdbackAmount: payment.holdbackAmount || 0,
      nonRefundableAmount: 0,
    });

    if (refundSummary.refundAmount <= 0) {
      return res.status(400).json({
        message: 'Refund not available for this payment',
        refund: refundSummary,
      });
    }

    payment.refundStatus = 'pending';
    payment.refundAmount = refundSummary.refundAmount;
    payment.refundReason = reason || 'Customer requested refund';
    payment.refundInitiatedAt = new Date();
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    res.json({
      message: 'Refund initiated successfully',
      refund: refundSummary,
      payment: {
        id: payment._id,
        status: payment.status,
        refundStatus: payment.refundStatus,
        refundAmount: payment.refundAmount,
        refundReason: payment.refundReason,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
