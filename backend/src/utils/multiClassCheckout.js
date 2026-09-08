import Class from '../models/Class.js';
import Subscription from '../models/Subscription.js';
import {
  calculatePriceCents,
  calculateContinuationPriceCents,
  fromCents,
  toCents,
} from './pricing.js';

export const MAX_CHECKOUT_ITEMS = 10;

export const normalizeCheckoutItems = (payload = {}) => {
  let payloadItems = payload.items || payload.lines;
  if (typeof payloadItems === 'string') {
    try {
      payloadItems = JSON.parse(payloadItems);
    } catch {
      payloadItems = null;
    }
  }
  if (Array.isArray(payloadItems) && payloadItems.length > 0) {
    return payloadItems.map((item) => ({
      classId: item.classId,
      numberOfDays: item.numberOfDays === undefined ? Number(item.days || 1) : Number(item.numberOfDays),
      discountCode: item.discountCode || null,
    }));
  }

  if (payload.classId) {
    return [{
      classId: payload.classId,
      numberOfDays: Number(payload.numberOfDays || payload.days || 1),
      discountCode: payload.discountCode || null,
    }];
  }

  return [];
};

export const validateCheckoutItems = (items) => {
  const normalizedItems = normalizeCheckoutItems({ items });
  const errors = [];
  const seenClassIds = new Set();

  if (!normalizedItems.length) errors.push('No classes selected for checkout');
  if (normalizedItems.length > MAX_CHECKOUT_ITEMS) {
    errors.push(`A checkout can contain at most ${MAX_CHECKOUT_ITEMS} classes`);
  }

  normalizedItems.forEach((item, index) => {
    const classId = String(item.classId || '');
    if (!classId) errors.push(`Item ${index + 1} is missing a class`);
    if (seenClassIds.has(classId)) errors.push(`Class ${classId} appears more than once`);
    seenClassIds.add(classId);
    if (!Number.isInteger(item.numberOfDays) || item.numberOfDays < 1 || item.numberOfDays > 30) {
      errors.push(`Item ${index + 1} days must be an integer between 1 and 30`);
    }
  });

  return { valid: errors.length === 0, errors, items: normalizedItems };
};

export const calculateCheckoutSummary = async ({
  userId,
  items,
  discountService,
}) => {
  const normalizedItems = normalizeCheckoutItems({ items });

  if (!normalizedItems.length) {
    return { items: [], totalAmount: 0, totalDays: 0 };
  }

  const classIds = normalizedItems.map((item) => item.classId);
  const classes = await Class.find({ _id: { $in: classIds } }).populate('hostId', 'planTier');
  const classMap = new Map(classes.map((cls) => [String(cls._id), cls]));

  const lineItems = [];
  let totalAmount = 0;
  let totalDays = 0;

  for (const item of normalizedItems) {
    const classDoc = classMap.get(String(item.classId));
    if (!classDoc) {
      throw new Error(`Class not found: ${item.classId}`);
    }

    let amountCents = calculatePriceCents(classDoc.monthlyPrice, item.numberOfDays);
    const existingSubscription = await Subscription.findOne({
      userId,
      classId: classDoc._id,
      status: 'active',
    });

    if (existingSubscription) {
      amountCents = calculateContinuationPriceCents(
        classDoc.monthlyPrice,
        existingSubscription.totalDaysPurchased || 0,
        existingSubscription.totalAmountPaid || 0,
        item.numberOfDays,
      );
    }
    const amount = fromCents(amountCents);

    let discountAmount = 0;
    let discountCodeToStore = item.discountCode || null;

    if (discountCodeToStore && discountService?.getDiscountByCode) {
      const discount = await discountService.getDiscountByCode(discountCodeToStore);
      if (discount) {
        const validation = await discountService.validateDiscountCode(
          discount,
          userId,
          classDoc._id,
          'Class',
          amount,
        );

        if (validation.valid) {
          const discountResult = await discountService.calculateDiscount(discount, amount);
          discountAmount = fromCents(toCents(discountResult.discountAmount));
        } else {
          discountCodeToStore = null;
        }
      } else {
        discountCodeToStore = null;
      }
    }

    const finalAmountCents = Math.max(0, amountCents - toCents(discountAmount));
    const finalAmount = fromCents(finalAmountCents);

    lineItems.push({
      classId: classDoc._id,
      hostId: classDoc.hostId?._id || classDoc.hostId,
      hostPlanTier: classDoc.hostId?.planTier || 'starter',
      numberOfDays: item.numberOfDays,
      baseAmount: amount,
      baseAmountCents: amountCents,
      discountAmount,
      discountAmountCents: toCents(discountAmount),
      finalAmount,
      finalAmountCents,
      discountCode: discountCodeToStore,
      paymentType: existingSubscription ? 'continuation' : (discountCodeToStore ? 'discounted' : 'new'),
      dailyRateDisplayCents: Math.round(finalAmountCents / item.numberOfDays),
      tierMultiplier: calculatePriceCents(classDoc.monthlyPrice, item.numberOfDays) / Math.max(1, Math.round(toCents(classDoc.monthlyPrice) * item.numberOfDays / 30)),
    });

    totalAmount += finalAmountCents;
    totalDays += item.numberOfDays;
  }

  return {
    items: lineItems,
    totalAmount: fromCents(totalAmount),
    totalAmountCents: totalAmount,
    totalDays,
  };
};
