import Event from '../models/Event.js';

export const registerEvent = async (req, res) => {
  try {
    const { userId, action, targetType, targetId, value, metadata } = req.body;

    if (!action) {
      return res.status(400).json({ message: 'Action is required' });
    }

    const event = new Event({
      userId: userId || req.userId || null,
      action,
      targetType,
      targetId,
      value,
      metadata,
      ip: req.ip,
      userAgent: req.headers['user-agent'] || '',
    });

    await event.save();

    res.status(201).json({ message: 'Event recorded' });
  } catch (error) {
    console.error('registerEvent error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Optional: batch events
export const registerEventsBatch = async (req, res) => {
  try {
    const events = req.body.events;
    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ message: 'Events array required' });
    }

    const docs = events.map(evt => ({
      userId: evt.userId || null,
      action: evt.action,
      targetType: evt.targetType,
      targetId: evt.targetId,
      value: evt.value,
      metadata: evt.metadata,
      ip: evt.ip || req.ip,
      userAgent: evt.userAgent || req.headers['user-agent'] || '',
      createdAt: evt.createdAt || new Date(),
    }));

    await Event.insertMany(docs);
    res.status(201).json({ message: 'Batch events recorded', count: docs.length });
  } catch (error) {
    console.error('registerEventsBatch error:', error);
    res.status(500).json({ message: error.message });
  }
};
