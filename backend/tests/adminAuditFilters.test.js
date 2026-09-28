import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/models/AdminLog.js', () => ({
  default: {
    find: vi.fn(),
    countDocuments: vi.fn(),
  },
}));

import AdminLog from '../src/models/AdminLog.js';
import { getAuditLogs } from '../src/controllers/adminController.js';

describe('admin audit log filters', () => {
  it('filters by actor, action, and inclusive date range', async () => {
    const logs = [];
    const queryChain = {
      sort: vi.fn().mockReturnThis(),
      skip: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue(logs),
    };
    AdminLog.find.mockReturnValue(queryChain);
    AdminLog.countDocuments.mockResolvedValue(0);
    const res = { json: vi.fn(), status: vi.fn(() => res) };

    await getAuditLogs({
      query: {
        page: '2',
        limit: '50',
        actor: 'admin@example.com',
        action: 'room_',
        startDate: '2026-09-01',
        endDate: '2026-09-08',
      },
    }, res);

    expect(AdminLog.find).toHaveBeenCalledWith({
      action: { $regex: 'room_', $options: 'i' },
      adminEmail: { $regex: 'admin@example\\.com', $options: 'i' },
      createdAt: { $gte: new Date('2026-09-01'), $lte: new Date('2026-09-08T23:59:59.999Z') },
    });
    expect(queryChain.skip).toHaveBeenCalledWith(50);
    expect(queryChain.limit).toHaveBeenCalledWith(50);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ logs, total: 0, page: 2 }));
  });
});
