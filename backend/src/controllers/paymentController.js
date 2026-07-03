import Payment from '../models/Payment.js';
import Subscription from '../models/Subscription.js';
import User from '../models/User.js';
import Class from '../models/Class.js';
import DiscountService from '../services/discountService.js';
import Stripe from 'stripe';
import { calculatePrice, calculatePaymentSplit, calculateContinuationPrice } from '../utils/pricing.js';
import { generateAccessCode } from '../utils/accessCode.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_example');

export const createPaymentIntent = async (req, res) => {
  try {
    const { classId, numberOfDays, discountCode } = req.body;
    
    // Get class and user
    const classData = await Class.findById(classId);
    const user = await User.findById(req.user.userId);
    
    if (!classData || !user) {
      return res.status(404).json({ message: 'Class or user not found' });
    }
    
    // Calculate price
    let totalPrice = calculatePrice(classData.monthlyPrice, numberOfDays);
    
    // Check for existing subscription (continuation pricing)
    const existingSubscription = await Subscription.findOne({
      userId: req.user.userId,
      classId,
      status: 'active',
    });
    
    if (existingSubscription) {
      totalPrice = calculateContinuationPrice(
        classData.monthlyPrice,
        existingSubscription.totalDaysPurchased,
        existingSubscription.totalAmountPaid,
        numberOfDays
      );
    }
    
    // Apply discount if provided
    let discountAmount = 0;
    let discountCodeToStore = null;

    if (discountCode) {
      const discount = await DiscountService.getDiscountByCode(discountCode);
      if (!discount) {
        return res.status(400).json({ message: 'Invalid discount code' });
      }

      const validation = await DiscountService.validateDiscountCode(
        discount,
        req.user.userId,
        classId,
        'Class',
        totalPrice
      );

      if (!validation.valid) {
        return res.status(400).json({ message: validation.reason });
      }

      const discountResult = await DiscountService.calculateDiscount(discount, totalPrice);
      discountAmount = discountResult.discountAmount;
      discountCodeToStore = discount.code;
    }

    const finalAmount = Math.max(0, totalPrice - discountAmount);
    const amountCents = Math.round(finalAmount * 100);
    
    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountCents,
      currency: user.preferredCurrency?.toLowerCase() || 'usd',
      metadata: {
        classId: classId.toString(),
        userId: req.user.userId.toString(),
        numberOfDays,
        discountCode: discountCodeToStore || '',
      },
    });
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount,
      numberOfDays,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId, classId, numberOfDays } = req.body;
    
    const classData = await Class.findById(classId);
    const user = await User.findById(req.user.userId);
    
    if (!classData || !user) {
      return res.status(404).json({ message: 'Class or user not found' });
    }
    
    // Verify payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment not confirmed' });
    }
    
    // Calculate price and discount
    const totalPrice = calculatePrice(classData.monthlyPrice, numberOfDays);
    let discountAmount = 0;
    let discountCodeToStore = paymentIntent.metadata?.discountCode || null;
    let paymentType = 'new';

    if (discountCodeToStore) {
      const discount = await DiscountService.getDiscountByCode(discountCodeToStore);
      if (discount) {
        const validation = await DiscountService.validateDiscountCode(
          discount,
          req.user.userId,
          classId,
          'Class',
          totalPrice
        );

        if (validation.valid) {
          const discountResult = await DiscountService.calculateDiscount(discount, totalPrice);
          discountAmount = discountResult.discountAmount;
          paymentType = 'discounted';
        }
      }
    }

    const finalAmount = Math.max(0, totalPrice - discountAmount);
    const split = calculatePaymentSplit(finalAmount, classData.hostId.planTier);
    
    // Generate access code
    const accessCode = generateAccessCode();
    
    // Create subscription
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + numberOfDays * 24 * 60 * 60 * 1000);
    
    const subscription = new Subscription({
      userId: req.user.userId,
      classId,
      accessCode,
      numberOfDays,
      startDate,
      endDate,
      status: 'active',
      totalDaysPurchased: numberOfDays,
      totalAmountPaid: finalAmount,
    });
    
    await subscription.save();
    
    // Create payment record
    const payment = new Payment({
      userId: req.user.userId,
      classId,
      subscriptionId: subscription._id,
      amount: finalAmount,
      currency: user.preferredCurrency || 'USD',
      daysPurchased: numberOfDays,
      ...split,
      stripePaymentIntentId: paymentIntentId,
      status: 'completed',
      paymentType,
      discountCode: discountCodeToStore,
      discountAmount,
    });
    
    await payment.save();

    if (discountCodeToStore && discountAmount > 0) {
      await DiscountService.recordDiscountUsage(
        await DiscountService.getDiscountByCode(discountCodeToStore),
        req.user.userId,
        payment._id,
        classId,
        'Class',
        discountAmount
      );
    }
    
    // Update class total enrolled
    classData.totalEnrolled += 1;
    await classData.save();
    
    res.json({
      message: 'Payment confirmed successfully',
      subscription: {
        accessCode: subscription.accessCode,
        startDate: subscription.startDate,
        endDate: subscription.endDate,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user.userId })
      .populate('classId', 'title')
      .sort({ createdAt: -1 });
    
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
