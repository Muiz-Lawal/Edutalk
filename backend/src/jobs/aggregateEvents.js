import mongoose from 'mongoose';
import Event from '../models/Event.js';
import Analytics from '../models/Analytics.js';

// Simple aggregation job: count events per class per day and store basic metrics
export default async function aggregateEvents({ beforeDate = new Date() } = {}) {
  // Aggregate events by date and targetId
  const start = new Date(beforeDate);
  start.setHours(0,0,0,0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  const pipeline = [
    { $match: { createdAt: { $gte: start, $lt: end }, targetType: 'class' } },
    { $group: { _id: { targetId: '$targetId' }, views: { $sum: 1 }, uniqueUsers: { $addToSet: '$userId' } } },
    { $project: { classId: '$_id.targetId', views: 1, uniqueUsersCount: { $size: '$uniqueUsers' } } }
  ];

  const results = await Event.aggregate(pipeline).allowDiskUse(true);

  for (const r of results) {
    try {
      await Analytics.findOneAndUpdate(
        { classId: r.classId, date: start, period: 'daily' },
        {
          $set: {
            newEnrollments: 0,
            totalEnrolled: 0,
            activeStudents: r.uniqueUsersCount,
            sessionsHeld: 0,
            studentEngagementScore: r.views,
            createdAt: start,
          }
        },
        { upsert: true }
      );
    } catch (err) {
      console.error('aggregateEvents error updating Analytics:', err);
    }
  }

  return results;
}
