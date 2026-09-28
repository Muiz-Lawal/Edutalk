import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../src/models/AdminLog.js', () => ({
  default: { create: vi.fn().mockResolvedValue({}) },
}));

import AdminLog from '../src/models/AdminLog.js';
import { auditPrivilegedAction } from '../src/middleware/privilegedAudit.js';

describe('privileged action auditing', () => {
  beforeEach(() => vi.clearAllMocks());

  it('writes an audit row when an admin suspends a user', async () => {
    const listeners = {};
    const req = {
      baseUrl: '/api/admin',
      path: '/users/507f1f77bcf86cd799439011/suspend',
      method: 'POST',
      params: { userId: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439012', email: 'admin@example.com' },
      originalUrl: '/api/admin/users/507f1f77bcf86cd799439011/suspend',
      ip: '127.0.0.1',
      get: () => 'test',
      body: {},
    };
    const res = { statusCode: 200, on: (event, callback) => { listeners[event] = callback; } };
    const next = vi.fn();

    auditPrivilegedAction(req, res, next);
    expect(next).toHaveBeenCalled();
    listeners.finish();
    await new Promise(resolve => setImmediate(resolve));

    expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
      action: 'user_suspended',
      targetType: 'User',
      status: 'success',
    }));
  });

  it.each([
    ['/api/video', '/rooms/507f1f77bcf86cd799439011/control', 'room_participant_removed', { action: 'remove', targetUserId: '507f1f77bcf86cd799439013', reason: 'disruption' }],
    ['/api/video', '/rooms/507f1f77bcf86cd799439011/control', 'room_presenter_changed', { action: 'presenter' }],
    ['/api/video', '/rooms/507f1f77bcf86cd799439011/control', 'room_cohost_changed', { action: 'cohost' }],
    ['/api/video', '/rooms/507f1f77bcf86cd799439011/control', 'room_ended_for_all', { action: 'end' }],
    ['/api/video', '/rooms/507f1f77bcf86cd799439011/breakouts', 'room_breakouts_changed', { action: 'open' }],
    ['/api/recordings', '/507f1f77bcf86cd799439011', 'recording_deleted', {}],
    ['/api/admin', '/payments/commission-settings', 'payout_settings_changed', { commissionRate: 10 }],
    ['/api/admin', '/payments/processor', 'processor_changed', { processor: 'stripe' }],
    ['/api/admin', '/settings/feature-flags/recording', 'plan_activated', { enabled: true }],
  ])('audits %s %s as %s before sending a response', async (baseUrl, path, action, body) => {
    const sent = vi.fn();
    const res = {
      statusCode: 200,
      on: vi.fn(),
      json(payload) { this.send(payload); return this; },
      send: sent,
    };
    const req = {
      baseUrl,
      path,
      method: action === 'recording_deleted' ? 'DELETE' : path.includes('settings/feature-flags') ? 'PUT' : 'PATCH',
      params: {
        roomId: '507f1f77bcf86cd799439011',
        recordingId: '507f1f77bcf86cd799439011',
        featureId: 'recording',
      },
      user: { _id: '507f1f77bcf86cd799439012', email: 'admin@example.com' },
      ip: '127.0.0.1',
      get: () => 'test',
      body,
      auditContext: { sessionId: 'session-qa' },
      auditChange: action === 'payout_settings_changed'
        ? { previousValue: { starter: 0.25 }, newValue: { starter: 0.2 } }
        : undefined,
    };

    auditPrivilegedAction(req, res, vi.fn());
    res.json({ success: true });
    await new Promise(resolve => setImmediate(resolve));

    expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({ action, status: 'success' }));
    if (action === 'room_participant_removed') {
      expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
        targetType: 'User',
        targetId: '507f1f77bcf86cd799439013',
        details: expect.objectContaining({
          reason: 'disruption',
          metadata: expect.objectContaining({ sessionId: 'session-qa' }),
        }),
      }));
    }
    if (action === 'payout_settings_changed') {
      expect(AdminLog.create).toHaveBeenCalledWith(expect.objectContaining({
        details: expect.objectContaining({
          previousValue: { starter: 0.25 },
          newValue: { starter: 0.2 },
        }),
      }));
    }
    expect(sent).toHaveBeenCalledOnce();
  });

  it('does not return success if the audit row cannot be persisted', async () => {
    AdminLog.create.mockRejectedValueOnce(new Error('database unavailable'));
    const sent = vi.fn();
    const res = {
      statusCode: 200,
      on: vi.fn(),
      json(payload) { this.payload = payload; this.send(payload); return this; },
      send: sent,
    };
    const req = {
      baseUrl: '/api/admin',
      path: '/users/507f1f77bcf86cd799439011/suspend',
      method: 'POST',
      params: { userId: '507f1f77bcf86cd799439011' },
      user: { _id: '507f1f77bcf86cd799439012', email: 'admin@example.com' },
      ip: '127.0.0.1',
      get: () => 'test',
      body: {},
    };

    auditPrivilegedAction(req, res, vi.fn());
    res.json({ success: true });
    await new Promise(resolve => setImmediate(resolve));

    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ message: 'The action could not be completed. Please retry.' });
    expect(sent).toHaveBeenCalledOnce();
  });
});
