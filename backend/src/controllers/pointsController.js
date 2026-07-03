import PointsLedger from '../models/PointsLedger.js';
import User from '../models/User.js';

export const getPointsBalance = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const balance = await PointsLedger.getBalance(userId);
    res.json({ success: true, data: { userId, balance } });
  } catch (error) {
    console.error('Error getting points balance:', error);
    res.status(500).json({ message: 'Error getting points balance', error: error.message });
  }
};

export const getPointsHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { page = 1, limit = 20, classId } = req.query;

    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const query = { userId };
    if (classId) query.classId = classId;

    const history = await PointsLedger.find(query)
      .sort({ createdAt: -1 })
      .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
      .limit(parseInt(limit, 10));

    const total = await PointsLedger.countDocuments(query);
    res.json({
      success: true,
      data: {
        history,
        pagination: {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          total,
          pages: Math.ceil(total / parseInt(limit, 10)),
        },
      },
    });
  } catch (error) {
    console.error('Error getting points history:', error);
    res.status(500).json({ message: 'Error getting points history', error: error.message });
  }
};

export const awardPoints = async (req, res) => {
  try {
    const { userId, amount, type = 'achievement', classId, referenceId, description, metadata } = req.body;

    if (!userId || typeof amount !== 'number') {
      return res.status(400).json({ message: 'userId and amount are required' });
    }

    if (userId !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Unauthorized access' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const entry = await PointsLedger.record({
      userId,
      amount,
      type,
      classId,
      referenceId,
      description,
      metadata,
    });

    const balance = await PointsLedger.getBalance(userId);

    res.json({ success: true, data: { entry, balance } });
  } catch (error) {
    console.error('Error awarding points:', error);
    res.status(500).json({ message: 'Error awarding points', error: error.message });
  }
};
