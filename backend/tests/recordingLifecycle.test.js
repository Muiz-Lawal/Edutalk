import { describe, expect, it } from 'vitest';
import { isReviewHoldDue, isRetentionDue } from '../src/services/recordingRetention.js';

describe('recording lifecycle decisions', () => {
  const now = new Date('2026-09-14T12:00:00.000Z');

  it('releases a review hold only at or after its deadline', () => {
    expect(isReviewHoldDue({
      status: 'review_hold',
      reviewHoldUntil: new Date('2026-09-14T11:59:59.000Z'),
    }, now)).toBe(true);
    expect(isReviewHoldDue({
      status: 'review_hold',
      reviewHoldUntil: new Date('2026-09-14T12:00:01.000Z'),
    }, now)).toBe(false);
    expect(isReviewHoldDue({
      status: 'ready',
      reviewHoldUntil: new Date('2026-09-14T11:00:00.000Z'),
    }, now)).toBe(false);
  });

  it('purges only recordings whose retention deadline has passed', () => {
    expect(isRetentionDue({
      status: 'ready',
      autoDeleteAt: new Date('2026-09-14T12:00:00.000Z'),
    }, now)).toBe(true);
    expect(isRetentionDue({
      status: 'ready',
      autoDeleteAt: new Date('2026-09-14T12:00:01.000Z'),
    }, now)).toBe(false);
    expect(isRetentionDue({
      status: 'expired',
      autoDeleteAt: new Date('2026-09-14T11:00:00.000Z'),
    }, now)).toBe(false);
  });
});
