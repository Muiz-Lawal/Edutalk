import mongoose from 'mongoose';

export default class BadgeEngine {
  constructor() {}

  static async run() {
    try {
      const PointsLedger = (await import('../models/PointsLedger.js')).default;
      const Achievement = (await import('../models/Achievement.js')).default;
      const Notification = (await import('../models/Notification.js')).default;
      const EmailJob = (await import('../models/EmailJob.js')).default;
      
      // Define badge tiers
      const tiers = [
        { key: 'badge_bronze', name: 'Bronze Supporter', threshold: 100, bonus: 25 },
        { key: 'badge_silver', name: 'Silver Supporter', threshold: 500, bonus: 75 },
        { key: 'badge_gold', name: 'Gold Supporter', threshold: 1000, bonus: 200 },
      ];

      // Get balances for all users
      const balances = await PointsLedger.aggregate([
        { $group: { _id: '$userId', balance: { $sum: '$amount' } } },
        { $sort: { balance: -1 } }
      ]);

      for (const b of balances) {
        const userId = b._id;
        const balance = b.balance || 0;

        for (const tier of tiers) {
          if (balance >= tier.threshold) {
            // Check if user already has this badge
            const existing = await Achievement.findOne({ studentId: userId, type: tier.key });
            if (existing) continue;

            // Award badge inside a transaction
            const session = await mongoose.startSession();
            try {
              session.startTransaction();

              const ach = new Achievement({
                name: tier.name,
                description: `Reached ${tier.threshold} points: ${tier.name}`,
                type: tier.key,
                studentId: userId,
                isRepeatable: false,
                awardedAt: new Date(),
              });

              await ach.save({ session });

              // Optionally award bonus points
              if (tier.bonus && tier.bonus > 0) {
                await (await import('../models/PointsLedger.js')).default.record({
                  userId,
                  amount: tier.bonus,
                  type: 'bonus',
                  description: `Badge bonus: ${tier.name}`,
                  session,
                });
              }

              // Create notification
              const notif = new Notification({
                userId,
                type: 'achievement_unlocked',
                title: `Badge Earned: ${tier.name}`,
                message: `Congratulations! You earned the ${tier.name} badge for reaching ${tier.threshold} points.`,
                metadata: { achievementId: ach._id, points: tier.bonus || 0 }
              });

              await notif.save({ session });

              // Create email job
              try {
                const user = (await import('../models/User.js')).default;
                const u = await user.findById(userId).select('email firstName emailPreferences');
                if (u && u.email) {
                  const job = new EmailJob({
                    to: u.email,
                    subject: notif.title,
                    body: notif.message,
                    template: 'achievement_unlocked',
                    data: { userName: u.firstName, achievementName: tier.name, points: tier.bonus },
                    status: 'pending',
                  });
                  await job.save({ session });
                }
              } catch (e) {
                // ignore enqueue failure for badge
                console.warn('Badge email enqueue failed', e.message || e);
                await session.abortTransaction();
                session.endSession();
                continue;
              }

              await session.commitTransaction();
              session.endSession();

              // Emit socket event
              try {
                const socketUtil = await import('../utils/socketInstance.js');
                const io = socketUtil.getIO && socketUtil.getIO();
                if (io) {
                  io.to(`user:${userId}`).emit('notification', notif);
                }
              } catch (e) {
                console.warn('Failed emitting badge notification', e.message || e);
              }

            } catch (txErr) {
              try { await session.abortTransaction(); } catch(e){}
              session.endSession();
              console.warn('Badge awarding transaction failed', txErr.message || txErr);
              continue;
            }
          }
        }
      }

    } catch (err) {
      console.error('BadgeEngine error:', err);
    }
  }
}

// run once when required
export async function runBadgeEngine() { await BadgeEngine.run(); }

export default BadgeEngine;
