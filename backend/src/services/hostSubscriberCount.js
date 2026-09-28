import Class from '../models/Class.js';
import Subscription from '../models/Subscription.js';

export async function getActiveHostSubscriberCount(hostId) {
  const classIds = await Class.distinct('_id', { hostId });
  if (!classIds.length) return 0;
  const userIds = await Subscription.distinct('userId', {
    classId: { $in: classIds },
    status: 'active',
  });
  return userIds.length;
}
