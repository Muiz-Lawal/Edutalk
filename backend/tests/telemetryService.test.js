import { afterEach, describe, expect, it } from 'vitest';
import {
  getTelemetrySnapshot,
  ingestClientTelemetry,
  recordClientErrorReport,
  recordTelemetry,
  resetTelemetry,
} from '../src/services/telemetryService.js';

describe('telemetry ring buffer', () => {
  afterEach(() => resetTelemetry());

  it('retains only the last 100 entries and counts events', () => {
    for (let index = 0; index < 105; index += 1) recordTelemetry('reconnects', { attempt: index });
    const snapshot = getTelemetrySnapshot();

    expect(snapshot.recent).toHaveLength(100);
    expect(snapshot.recent[0].details.attempt).toBe(104);
    expect(snapshot.counters.reconnects).toBe(105);
  });

  it('ingests client events once and excludes unapproved details', () => {
    const entry = {
      id: 'event-1',
      name: 'session_joined',
      details: { routeSegment: 'room', email: 'private@example.com' },
      timestamp: new Date().toISOString(),
    };
    ingestClientTelemetry({ recent: [entry, entry] });
    const snapshot = getTelemetrySnapshot();

    expect(snapshot.counters.session_joined).toBe(1);
    expect(snapshot.recent[0].details).toEqual({ routeSegment: 'room' });
  });

  it('attaches only the most recent 20 entries to a sanitized error report', () => {
    for (let index = 0; index < 25; index += 1) recordTelemetry('reconnects', { attempt: index });
    recordClientErrorReport({
      errorName: 'TypeError: token secret',
      routeSegment: 'room',
      recent: getTelemetrySnapshot().recent,
    });
    const report = getTelemetrySnapshot().recent[0];

    expect(report.name).toBe('client_error_report');
    expect(report.details.errorName).toBe('TypeErrortokensecret');
    expect(report.details.recent).toHaveLength(20);
  });
});
