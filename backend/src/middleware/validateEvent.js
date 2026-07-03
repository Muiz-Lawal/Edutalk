// Lightweight validation for incoming event payloads
export default function validateEvent(req, res, next) {
  try {
    const { action, targetType, targetId, value, metadata } = req.body;
    if (!action || typeof action !== 'string' || action.length > 100) {
      return res.status(400).json({ message: 'Invalid or missing action' });
    }

    if (targetType && typeof targetType !== 'string') {
      return res.status(400).json({ message: 'Invalid targetType' });
    }

    if (targetId && typeof targetId !== 'string') {
      return res.status(400).json({ message: 'Invalid targetId' });
    }

    if (value && typeof value !== 'number') {
      return res.status(400).json({ message: 'Invalid value' });
    }

    // Sanitize minimal metadata
    req.validatedEvent = {
      action: action.trim().toLowerCase(),
      targetType: targetType ? String(targetType).trim().toLowerCase() : undefined,
      targetId: targetId ? String(targetId).trim() : undefined,
      value: value ?? undefined,
      metadata: metadata ?? undefined,
    };

    next();
  } catch (err) {
    console.error('validateEvent error:', err);
    next();
  }
}
