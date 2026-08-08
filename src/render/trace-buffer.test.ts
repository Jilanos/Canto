import { describe, expect, it } from 'vitest';
import type { PitchSample } from '../pitch/tracker';
import { HISTORY_MS, TraceBuffer, ageFraction } from './trace-buffer';

function tracking(timestamp: number, exactMidi: number): PitchSample {
  return {
    timestamp,
    state: 'tracking',
    frequency: 440,
    exactMidi,
    midi: Math.round(exactMidi),
    note: 'A4',
    cents: 0,
    clarity: 0.9,
    level: 0.5,
  };
}

function quiet(timestamp: number, state: PitchSample['state'] = 'silence'): PitchSample {
  return {
    timestamp,
    state,
    frequency: null,
    exactMidi: null,
    midi: null,
    note: null,
    cents: null,
    clarity: 0,
    level: 0,
  };
}

describe('TraceBuffer window', () => {
  it('keeps exactly the last eight seconds', () => {
    const buffer = new TraceBuffer();
    for (let timestamp = 0; timestamp <= 20000; timestamp += 20) buffer.add(tracking(timestamp, 60));
    const all = buffer.all();
    expect(all.length).toBeGreaterThan(0);
    expect((all[0] as PitchSample).timestamp).toBeGreaterThanOrEqual(20000 - HISTORY_MS);
    expect(buffer.latestTimestamp).toBe(20000);
  });

  it('reports the newest sample whatever its state', () => {
    const buffer = new TraceBuffer();
    buffer.add(tracking(0, 60));
    buffer.add(quiet(20));
    expect(buffer.latest()?.state).toBe('silence');
  });

  it('clears on demand', () => {
    const buffer = new TraceBuffer();
    buffer.add(tracking(0, 60));
    buffer.clear();
    expect(buffer.length).toBe(0);
    expect(buffer.latest()).toBeNull();
    expect(buffer.latestTimestamp).toBeNull();
  });
});

describe('TraceBuffer segmentation', () => {
  it('returns one segment for a continuous phrase', () => {
    const buffer = new TraceBuffer();
    for (let index = 0; index < 10; index += 1) buffer.add(tracking(index * 20, 60 + index * 0.05));
    expect(buffer.segments()).toHaveLength(1);
    expect(buffer.segments()[0]).toHaveLength(10);
  });

  it('breaks the trace on silence', () => {
    const buffer = new TraceBuffer();
    buffer.add(tracking(0, 60));
    buffer.add(tracking(20, 60));
    buffer.add(quiet(40));
    buffer.add(tracking(60, 60));
    buffer.add(tracking(80, 60));
    const segments = buffer.segments();
    expect(segments).toHaveLength(2);
    expect(segments[0]).toHaveLength(2);
    expect(segments[1]).toHaveLength(2);
  });

  it('breaks the trace on an unstable or weak frame', () => {
    const buffer = new TraceBuffer();
    buffer.add(tracking(0, 60));
    buffer.add(quiet(20, 'unstable'));
    buffer.add(tracking(40, 60));
    buffer.add(quiet(60, 'weak'));
    buffer.add(tracking(80, 60));
    expect(buffer.segments()).toHaveLength(3);
  });

  it('breaks the trace when frames were dropped', () => {
    const buffer = new TraceBuffer();
    buffer.add(tracking(0, 60));
    buffer.add(tracking(500, 60));
    expect(buffer.segments()).toHaveLength(2);
  });

  it('breaks on an implausible pitch jump but follows a glide', () => {
    const glide = new TraceBuffer();
    glide.add(tracking(0, 60));
    glide.add(tracking(20, 61.5));
    expect(glide.segments()).toHaveLength(1);

    const slip = new TraceBuffer();
    slip.add(tracking(0, 60));
    slip.add(tracking(20, 72));
    expect(slip.segments()).toHaveLength(2);
  });

  it('ignores a buffer holding no tracked pitch', () => {
    const buffer = new TraceBuffer();
    buffer.add(quiet(0));
    buffer.add(quiet(20));
    expect(buffer.segments()).toEqual([]);
  });
});

describe('ageFraction', () => {
  it('puts the present at the piano and history away from it', () => {
    expect(ageFraction(tracking(1000, 60), 1000)).toBe(0);
    expect(ageFraction(tracking(0, 60), HISTORY_MS)).toBe(1);
    expect(ageFraction(tracking(0, 60), HISTORY_MS / 2)).toBeCloseTo(0.5, 10);
  });

  it('clamps samples outside the window', () => {
    expect(ageFraction(tracking(2000, 60), 1000)).toBe(0);
    expect(ageFraction(tracking(0, 60), HISTORY_MS * 3)).toBe(1);
  });
});
