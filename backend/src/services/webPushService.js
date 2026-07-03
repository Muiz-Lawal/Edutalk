import webpush from 'web-push';

// Initialize with VAPID keys (set in .env)
webpush.setVapidDetails(
  process.env.WEB_PUSH_CONTACT || 'mailto:admin@edutalk.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

export const webPushService = {
  /**
   * Send notification to a specific subscription
   */
  async sendNotification(subscription, payload) {
    try {
      await webpush.sendNotification(
        subscription,
        JSON.stringify({
          title: payload.title || 'EduTalk',
          body: payload.body || 'New notification',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          data: {
            url: payload.url || '/',
            ...payload.data,
          },
          ...payload,
        })
      );
      return { success: true };
    } catch (error) {
      console.error('Push notification failed:', error.message);
      
      // Handle invalid subscription errors
      if (error.statusCode === 410 || error.statusCode === 404) {
        return { success: false, invalid: true };
      }
      
      throw error;
    }
  },

  /**
   * Send notification to all subscribers (with optional filter)
   */
  async broadcastNotification(notification, filter = {}) {
    try {
      // Get all push subscriptions from database
      const PushSubscription = await import('../models/PushSubscription.js').then(m => m.default);
      const subscribers = await PushSubscription.find(filter).lean();

      if (subscribers.length === 0) {
        console.log('No subscribers to notify');
        return { sent: 0, failed: 0, total: 0 };
      }

      const results = await Promise.allSettled(
        subscribers.map((sub) =>
          this.sendNotification(JSON.parse(sub.subscription), notification)
        )
      );

      let sent = 0;
      let failed = 0;
      let invalid = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          sent++;
        } else if (result.status === 'fulfilled' && result.value.invalid) {
          failed++;
          invalid.push(subscribers[index]._id);
        } else {
          failed++;
        }
      });

      // Remove invalid subscriptions
      if (invalid.length > 0) {
        await PushSubscription.deleteMany({ _id: { $in: invalid } });
      }

      return { sent, failed, total: subscribers.length };
    } catch (error) {
      console.error('Broadcast notification failed:', error);
      throw error;
    }
  },

  /**
   * Send notification to specific user(s)
   */
  async notifyUsers(userIds, notification) {
    try {
      const PushSubscription = await import('../models/PushSubscription.js').then(m => m.default);
      const subscriptions = await PushSubscription.find({
        userId: { $in: userIds },
      }).lean();

      const results = await Promise.allSettled(
        subscriptions.map((sub) =>
          this.sendNotification(JSON.parse(sub.subscription), notification)
        )
      );

      return {
        sent: results.filter((r) => r.status === 'fulfilled' && r.value.success).length,
        failed: results.filter((r) => r.status === 'rejected' || !r.value.success).length,
      };
    } catch (error) {
      console.error('Notify users failed:', error);
      throw error;
    }
  },

  /**
   * Test notification delivery
   */
  async sendTestNotification(subscription) {
    return this.sendNotification(subscription, {
      title: '✅ EduTalk Push Test',
      body: 'Push notifications are working! This is a test message.',
      tag: 'test-notification',
      requireInteraction: false,
    });
  },
};
