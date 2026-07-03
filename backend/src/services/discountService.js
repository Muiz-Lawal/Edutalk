import Discount from '../models/Discount.js';
import Payment from '../models/Payment.js';
import DiscountUsage from '../models/DiscountUsage.js';

const normalizeCode = (code) => (code || '').toUpperCase().trim();

export default class DiscountService {
  static async getDiscountByCode(code) {
    if (!code) return null;
    return Discount.findOne({ code: normalizeCode(code), isActive: true });
  }

  static async countUserPayments(userId) {
    return Payment.countDocuments({ userId, status: 'completed' });
  }

  static async countUserDiscountUses(userId, code) {
    return DiscountUsage.countDocuments({
      userId,
      discountCode: normalizeCode(code)
    });
  }

  static async recordDiscountUsage(discount, userId, paymentId, itemId, itemType, amount = 0) {
    if (!discount) return null;

    const usage = new DiscountUsage({
      discountId: discount._id,
      discountCode: discount.code,
      userId,
      paymentId,
      itemId,
      itemType,
      amount
    });

    await usage.save();
    discount.recordUsage(amount);
    return discount.save();
  }

  static async validateDiscountCode(discount, userId, itemId, itemType, purchaseAmount) {
    if (!discount) {
      return { valid: false, reason: 'Invalid discount code' };
    }

    if (!discount.isActive) {
      return { valid: false, reason: 'Discount code is inactive' };
    }

    if (discount.isExpired) {
      return { valid: false, reason: 'Discount code has expired' };
    }

    if (discount.conditions.validFrom && new Date() < discount.conditions.validFrom) {
      return { valid: false, reason: 'Discount code is not yet active' };
    }

    if (discount.conditions.maxUses && discount.conditions.usageCount >= discount.conditions.maxUses) {
      return { valid: false, reason: 'Discount usage limit has been reached' };
    }

    if (discount.conditions.applicableTo === 'classes' && itemType && itemType !== 'Class') {
      return { valid: false, reason: 'Discount code is only valid for classes' };
    }

    if (discount.conditions.applicableTo === 'bundles' && itemType && itemType !== 'Bundle') {
      return { valid: false, reason: 'Discount code is only valid for bundles' };
    }

    if (discount.conditions.applicableTo === 'specific') {
      if (!itemId) {
        return { valid: false, reason: 'Discount code requires a specific item to be provided' };
      }
      const isApplicable = discount.conditions.specificItems.some(id => id.toString() === itemId.toString());
      if (!isApplicable) {
        return { valid: false, reason: 'Discount code is not valid for this item' };
      }
    }

    if (discount.conditions.minPurchase > 0 && purchaseAmount < discount.conditions.minPurchase) {
      return {
        valid: false,
        reason: `Minimum purchase of $${discount.conditions.minPurchase} is required to use this code`
      };
    }

    if (discount.conditions.userRestrictions.firstTimeOnly) {
      const totalPayments = await this.countUserPayments(userId);
      if (totalPayments > 0) {
        return { valid: false, reason: 'Discount code is only valid for first-time customers' };
      }
    }

    if (discount.conditions.userRestrictions.maxUsesPerUser) {
      const userUses = await this.countUserDiscountUses(userId, discount.code);
      if (userUses >= discount.conditions.userRestrictions.maxUsesPerUser) {
        return {
          valid: false,
          reason: `You have already used this discount ${userUses} time(s)`
        };
      }
    }

    const remainingTotalUses = discount.conditions.maxUses
      ? Math.max(0, discount.conditions.maxUses - discount.conditions.usageCount)
      : null;

    const userUses = await this.countUserDiscountUses(userId, discount.code);
    const remainingUserUses = discount.conditions.userRestrictions.maxUsesPerUser
      ? Math.max(0, discount.conditions.userRestrictions.maxUsesPerUser - userUses)
      : null;

    return {
      valid: true,
      remainingTotalUses,
      userUses,
      remainingUserUses
    };
  }

  static async calculateDiscount(discount, purchaseAmount) {
    if (!discount) {
      return null;
    }
    return discount.applyDiscount(purchaseAmount);
  }
}
