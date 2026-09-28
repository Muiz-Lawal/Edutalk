import mongoose from 'mongoose';
import AdminLog from '../models/AdminLog.js';
import { recordTelemetry } from '../services/telemetryService.js';

const getAction = (req) => {
  const base = req.baseUrl || '';
  const path = req.path || '';
  if (req.method === 'GET') return null;
  if (base.endsWith('/admin')) {
    if (path.includes('commission-settings') || path.endsWith('/commission')) return 'payout_settings_changed';
    if (path.includes('processor')) return 'processor_changed';
    if (path.includes('feature-flags')) return 'plan_activated';
    if (path === '/admins/create') return 'admin_created';
    if (path.startsWith('/admins/') && path.endsWith('/change-password')) return 'admin_password_changed';
    if (path.startsWith('/admins/') && req.method === 'PUT') return 'admin_updated';
    if (path.startsWith('/hosts/') && path.endsWith('/suspend')) return 'host_suspended';
    if (path.startsWith('/hosts/') && path.endsWith('/unsuspend')) return 'host_unsuspended';
    if (path.startsWith('/hosts/') && path.endsWith('/approve')) return 'host_approved';
    if (path.startsWith('/hosts/') && path.endsWith('/reject')) return 'host_rejected';
    if (path.startsWith('/users/') && path.endsWith('/suspend')) return 'user_suspended';
    if (path.startsWith('/users/') && path.endsWith('/unsuspend')) return 'user_unsuspended';
    if (path.startsWith('/users/') && path.endsWith('/ban')) return 'user_banned';
    if (path.startsWith('/admins/') && req.method === 'DELETE') return 'admin_deleted';
    if (path.startsWith('/moderation/approve/')) return 'moderation_approved';
    if (path.startsWith('/moderation/reject/')) return 'moderation_rejected';
    if (path.startsWith('/moderation/remove-class/')) return 'class_removed';
    if (path.startsWith('/moderation/suspend-class/')) return 'class_suspended';
    if (path.includes('/delete') || req.method === 'DELETE') return 'user_deleted';
    if (path.endsWith('/approve')) return 'verification_approved';
    if (path.endsWith('/reject')) return 'verification_rejected';
    return 'privileged_action';
  }
  if (base.endsWith('/recordings') && req.method === 'DELETE') return 'recording_deleted';
  if (base.endsWith('/video')) {
    if (path.includes('/control')) {
      const command = req.body?.command || req.body?.action;
      return command === 'remove' ? 'room_participant_removed'
        : command === 'presenter' ? 'room_presenter_changed'
          : command === 'cohost' ? 'room_cohost_changed'
            : command === 'end' || command === 'end_for_all' ? 'room_ended_for_all'
              : ['admit', 'admit_all', 'mute', 'stop_camera', 'lock', 'waiting_room'].includes(command)
                ? 'room_control_changed' : 'privileged_action';
    }
    if (path.match(/^\/rooms\/[^/]+$/) && req.method === 'DELETE') return 'room_ended_for_all';
    if (path.includes('/breakouts')) return 'room_breakouts_changed';
  }
  return null;
};

const targetTypeFor = (action, baseUrl = '') => ['room_participant_removed', 'room_presenter_changed', 'room_cohost_changed'].includes(action) ? 'User'
  : action.startsWith('room_')
    || action === 'privileged_action' && baseUrl.endsWith('/video') ? 'Room'
  : action === 'recording_deleted' ? 'Recording'
    : action.startsWith('class_') || action.startsWith('moderation_') ? 'Class'
      : action.includes('payout') ? 'Payout'
        : action.includes('processor') ? 'Processor'
          : action.includes('plan') ? 'Plan'
            : action.includes('verification') ? 'Verification'
              : action.includes('host') ? 'Host'
                : action === 'admin_deleted' || action === 'admin_created' || action === 'admin_updated' || action === 'admin_password_changed' ? 'Admin'
                  : action.includes('user') ? 'User' : 'Settings';

const getSafeNewValue = (body = {}) => {
  const safeKeys = ['enabled', 'rolloutPercentage', 'commissionRate', 'platformCommission', 'processor', 'value'];
  const changes = Object.fromEntries(safeKeys
    .filter((key) => ['string', 'number', 'boolean'].includes(typeof body[key]))
    .map((key) => [key, typeof body[key] === 'string' ? body[key].slice(0, 80) : body[key]]));
  return Object.keys(changes).length ? changes : undefined;
};

export const auditPrivilegedAction = (req, res, next) => {
  const action = getAction(req);
  if (!action || !req.user) return next();
  const adminId = req.user._id || req.user.userId || req.user.id;
  const targetId = req.body?.targetUserId && ['room_participant_removed', 'room_presenter_changed', 'room_cohost_changed'].includes(action)
    ? req.body.targetUserId
    : req.params.userId || req.params.hostId || req.params.adminId || req.params.roomId
    || req.params.recordingId || req.params.featureId || req.params.transactionId || null;
  const targetObjectId = targetId && mongoose.isValidObjectId(targetId) ? targetId : undefined;
  const persistAudit = (statusCode) => {
    const status = statusCode < 400 ? 'success' : 'failed';
    const reason = typeof req.body?.reason === 'string' ? req.body.reason.slice(0, 200) : undefined;
    const previousValue = req.auditChange?.previousValue;
    const newValue = req.auditChange?.newValue ?? getSafeNewValue(req.body);
    return AdminLog.create({
      adminId,
      adminEmail: req.user.email || 'unknown',
      action,
      targetType: targetTypeFor(action, req.baseUrl),
      targetId: targetObjectId,
      details: {
        reason,
        previousValue,
        newValue,
        metadata: {
          method: req.method,
          path: `${req.baseUrl || ''}${req.path || ''}`,
          status: statusCode,
          sessionId: req.auditContext?.sessionId || req.params.roomId,
          targetUserId: req.body?.targetUserId,
        },
      },
      status,
      errorMessage: status === 'failed' ? `HTTP ${res.statusCode}` : undefined,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).then(() => {
      recordTelemetry('privileged_action', { status });
    });
  };

  let auditPromise;
  let bypassAudit = false;
  let responseStarted = false;
  const originalJson = typeof res.json === 'function' ? res.json.bind(res) : (payload) => {
    res.payload = payload;
    return res;
  };
  const originalSend = typeof res.send === 'function' ? res.send.bind(res) : (payload) => {
    res.payload = payload;
    return res;
  };
  const sendUnloggedFailure = () => {
    bypassAudit = true;
    res.statusCode = 500;
    return originalJson({ message: 'The action could not be completed. Please retry.' });
  };
  const ensureAudit = (statusCode) => {
    auditPromise ||= persistAudit(statusCode);
    return auditPromise;
  };

  res.json = function auditedJson(...args) {
    if (bypassAudit) return originalJson(...args);
    if (responseStarted) return res;
    responseStarted = true;
    ensureAudit(res.statusCode).then(() => {
      bypassAudit = true;
      originalJson(...args);
    }).catch(() => sendUnloggedFailure());
    return res;
  };
  res.send = function auditedSend(...args) {
    if (bypassAudit) return originalSend(...args);
    if (responseStarted) return res;
    responseStarted = true;
    ensureAudit(res.statusCode).then(() => {
      bypassAudit = true;
      originalSend(...args);
    }).catch(() => sendUnloggedFailure());
    return res;
  };
  res.on('finish', () => {
    if (!responseStarted) {
      ensureAudit(res.statusCode).catch(() => {});
    }
  });
  return next();
};
