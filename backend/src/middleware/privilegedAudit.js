import mongoose from 'mongoose';
import AdminLog from '../models/AdminLog.js';
import { recordTelemetry } from '../services/telemetryService.js';

const ACTIONS = [
  ['admin', '/users/', 'user_suspended'],
  ['admin', '/users/', 'user_deleted'],
  ['admin', '/hosts/', 'verification_approved'],
  ['admin', '/payments/commission-settings', 'processor_changed'],
  ['admin', '/settings/commission', 'payout_settings_changed'],
  ['admin', '/settings/feature-flags/', 'plan_activated'],
  ['video', '/rooms/', 'privileged_action'],
  ['recording', '/', 'recording_deleted'],
];

const getAction = (req) => {
  const base = req.baseUrl || '';
  const path = req.path || '';
  if (req.method === 'GET') return null;
  if (base.endsWith('/admin')) {
    if (path.startsWith('/hosts/') && path.endsWith('/suspend')) return 'host_suspended';
    if (path.startsWith('/hosts/') && path.endsWith('/unsuspend')) return 'host_unsuspended';
    if (path.startsWith('/users/') && path.endsWith('/suspend')) return 'user_suspended';
    if (path.startsWith('/users/') && path.endsWith('/unsuspend')) return 'user_unsuspended';
    if (path.startsWith('/admins/') && req.method === 'DELETE') return 'admin_deleted';
    if (path.includes('/delete') || req.method === 'DELETE') return 'user_deleted';
    if (path.endsWith('/approve')) return 'verification_approved';
    if (path.endsWith('/reject')) return 'verification_rejected';
    if (path.includes('commission')) return 'payout_settings_changed';
    if (path.includes('feature-flags')) return 'plan_activated';
    return 'privileged_action';
  }
  if (base.endsWith('/recordings') && req.method === 'DELETE') return 'recording_deleted';
  if (base.endsWith('/video')) {
    if (path.includes('/control')) {
      const command = req.body?.command || req.body?.action;
      return command === 'remove' ? 'room_participant_removed'
        : command === 'presenter' ? 'room_presenter_changed'
          : command === 'cohost' ? 'room_cohost_changed'
            : command === 'end' || command === 'end_for_all' ? 'room_ended_for_all' : 'privileged_action';
    }
    if (path.match(/^\/rooms\/[^/]+$/) && req.method === 'DELETE') return 'room_ended_for_all';
  }
  return null;
};

const targetTypeFor = (action) => action.startsWith('room_') || action === 'privileged_action' ? 'Room'
  : action === 'recording_deleted' ? 'Recording'
    : action.includes('payout') ? 'Payout'
      : action.includes('processor') ? 'Processor'
        : action.includes('plan') ? 'Plan'
          : action.includes('verification') ? 'Verification'
            : action.includes('host') ? 'Host'
              : action.includes('user') || action === 'admin_deleted' ? 'User' : 'Settings';

export const auditPrivilegedAction = (req, res, next) => {
  const action = getAction(req);
  if (!action || !req.user) return next();
  const adminId = req.user._id || req.user.userId || req.user.id;
  const targetId = req.params.userId || req.params.hostId || req.params.adminId || req.params.roomId || req.params.recordingId || null;
  const targetObjectId = targetId && mongoose.isValidObjectId(targetId) ? targetId : undefined;
  res.on('finish', () => {
    const status = res.statusCode < 400 ? 'success' : 'failed';
    AdminLog.create({
      adminId,
      adminEmail: req.user.email || 'unknown',
      action,
      targetType: targetTypeFor(action),
      targetId: targetObjectId,
      details: { method: req.method, path: req.originalUrl },
      status,
      errorMessage: status === 'failed' ? `HTTP ${res.statusCode}` : undefined,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    }).catch((error) => console.error('[audit] failed to persist privileged action:', error.message));
    recordTelemetry('privileged_action', { action, status, path: req.originalUrl });
  });
  return next();
};
