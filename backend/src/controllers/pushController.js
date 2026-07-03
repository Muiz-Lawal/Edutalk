import PushSubscription from '../models/PushSubscription.js';
import { webPushService } from '../services/webPushService.js';

export const pushController = {
  /**
   * Subscribe to push notifications
   */
  async subscribe(req, res) {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      // Check if subscription already exists
      const existing = await PushSubscription.findOne({
        userId,
        endpoint: subscription.endpoint,
      });

      if (existing) {
        existing.isActive = true;
        existing.lastDelivered = new Date();
        existing.failureCount = 0;
        await existing.save();
        return res.json({ success: true, message: 'Subscription already exists' });
      }

      // Create new subscription
      const pushSub = new PushSubscription({
        userId,
        subscription: JSON.stringify(subscription),
        endpoint: subscription.endpoint,
        userAgent: req.headers['user-agent'],
      });

      await pushSub.save();

      res.json({
        success: true,
        message: 'Successfully subscribed to push notifications',
      });
    } catch (error) {
      console.error('Subscribe error:', error);
      res.status(500).json({ error: 'Failed to subscribe to notifications' });
    }
  },

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(req, res) {
    try {
      const { subscription } = req.body;
      const userId = req.user.id;

      if (!subscription || !subscription.endpoint) {
        return res.status(400).json({ error: 'Invalid subscription' });
      }

      const result = await PushSubscription.deleteOne({
        userId,
        endpoint: subscription.endpoint,
      });

      res.json({
        success: true,
        message: 'Successfully unsubscribed from notifications',
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('Unsubscribe error:', error);
      res.status(500).json({ error: 'Failed to unsubscribe from notifications' });
    }
  },

  /**
   * Send test notification
   */
  async sendTest(req, res) {
    try {
      const userId = req.user.id;

      const subscription = await PushSubscription.findOne({
        userId,
        isActive: true,
      });

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      const result = await webPushService.sendTestNotification(
        JSON.parse(subscription.subscription)
      );

      res.json({ success: true, message: 'Test notification sent', result });
    } catch (error) {
      console.error('Send test error:', error);
      res.status(500).json({ error: 'Failed to send test notification' });
    }
  },

  /**
   * List user's subscriptions
   */
  async listSubscriptions(req, res) {
    try {
      const userId = req.user.id;

      const subscriptions = await PushSubscription.find({
        userId,
      })
        .select('-subscription') // Don't return raw subscription data
        .lean();

      res.json({
        success: true,
        count: subscriptions.length,
        subscriptions,
      });
    } catch (error) {
      console.error('List subscriptions error:', error);
      res.status(500).json({ error: 'Failed to list subscriptions' });
    }
  },

  /**
   * Admin: Broadcast notification to all users
   */
  async broadcast(req, res) {
    try {
      const { title, body, url, isAdmin } = req.body;

      // Only admins can broadcast
      if (!isAdmin && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
      }

      const result = await webPushService.broadcastNotification({
        title,
        body,
        url,
      });

      res.json({
        success: true,
        message: 'Broadcast sent',
        result,
      });
    } catch (error) {
      console.error('Broadcast error:', error);
      res.status(500).json({ error: 'Failed to broadcast notification' });
    }
  },

  /**
   * Notify specific user
   */
  async notifyUser(req, res) {
    try {
      const { userId, title, body, url } = req.body;

      // Can only notify own user unless admin
      if (req.user.id !== userId && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }

      const result = await webPushService.notifyUsers([userId], {
        title,
        body,
        url,
      });

      res.json({
        success: true,
        message: 'Notification sent',
        result,
      });
    } catch (error) {
      console.error('Notify user error:', error);
      res.status(500).json({ error: 'Failed to send notification' });
    }
  },
};
