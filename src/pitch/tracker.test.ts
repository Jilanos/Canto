import { describe, expect, it } from 'vitest';
import { midiToFrequency } from '../music/notes';
import { DEFAULT_TRACKER_OPTIONS, PitchTracker, rmsToLevel } from './tracker';
import type { PitchEstimate } from './yin';

function estimate(frequency: number, clarity = 0.95, rms = 0.05): PitchEstimate {
  return { frequency, clarity, rms };
}

describe('PitchTracker states', () => {
  it('publishes a note only for a loud, clear, in-range frame', () => {
    const tracker = new PitchTracker();
    const sample = tracker.push(estimate(midiToFrequency(69)), 1000);
    expect(sample.state).toBe('tracking');
    expect(sample.note).toBe('A4');
    expect(sample.midi).toBe(69);
    expect(sample.cents).toBeCloseTo(0, 6);
    expect(sample.exactMidi).toBeCloseTo(69, 6);
    expect(sample.timestamp).toBe(1000);
  });

  it('reports silence below the silence floor', () => {
    const tracker = new PitchTracker();
    const sample = tracker.push(estimate(440, 0.99, DEFAULT_TRACKER_OPTIONS.silenceRms / 2), 0);
    expect(sample.state).toBe('silence');
    expect(sample.note).toBeNull();
    expect(sample.frequency).toBeNull();
  });

  it('reports a weak signal between the silence and weak floors', () => {
    const tracker = new PitchTracker();
    const rms = (DEFAULT_TRACKER_OPTIONS.silenceRms + DEFAULT_TRACKER_OPTIONS.weakRms) / 2;
    const sample = tracker.push(estimate(440, 0.99, rms), 0);
    expect(sample.state).toBe('weak');
    expect(sample.note).toBeNull();
  });

  it('reports an unstable pitch when clarity is too low', () => {
    const tracker = new PitchTracker();
    const sample = tracker.push(estimate(440, DEFAULT_TRACKER_OPTIONS.minClarity - 0.1, 0.05), 0);
    expect(sample.state).toBe('unstable');
    expect(sample.note).toBeNull();
  });

  it('reports an unstable pitch when YIN found nothing', () => {
    const tracker = new PitchTracker();
    expect(tracker.push(null, 0).state).toBe('silence');
    const loudButNull = new PitchTracker({ silenceRms: 0, weakRms: 0 });
    expect(loudButNull.push(null, 0).state).toBe('unstable');
  });

  it('rejects pitches outside C2..C6', () => {
    const tracker = new PitchTracker();
    expect(tracker.push(estimate(midiToFrequency(30)), 0).state).toBe('unstable');
    expect(tracker.push(estimate(midiToFrequency(96)), 0).state).toBe('unstable');
    expect(tracker.push(estimate(midiToFrequency(36)), 0).state).toBe('tracking');
    expect(tracker.push(estimate(midiToFrequency(84)), 0).state).toBe('tracking');
  });
});

describe('PitchTracker smoothing', () => {
  it('rejects a single-frame octave slip', () => {
    const tracker = new PitchTracker();
    const target = midiToFrequency(60);
    tracker.push(estimate(target), 0);
    tracker.push(estimate(target), 20);
    const slipped = tracker.push(estimate(target * 2), 40);
    expect(slipped.midi).toBe(60);
  });

  it('follows a sustained change instead of freezing', () => {
    const tracker = new PitchTracker();
    const from = midiToFrequency(60);
    const to = midiToFrequency(62);
    tracker.push(estimate(from), 0);
    tracker.push(estimate(to), 20);
    tracker.push(estimate(to), 40);
    expect(tracker.push(estimate(to), 60).midi).toBe(62);
  });

  it('drops stale history after a silence so a new phrase is not blended in', () => {
    const tracker = new PitchTracker();
    tracker.push(estimate(midiToFrequency(60)), 0);
    tracker.push(estimate(midiToFrequency(60)), 20);
    tracker.push(estimate(440, 0.99, 0), 40); // silence
    const fresh = tracker.push(estimate(midiToFrequency(72)), 60);
    expect(fresh.midi).toBe(72);
  });

  it('clears history on reset', () => {
    const tracker = new PitchTracker();
    tracker.push(estimate(midiToFrequency(60)), 0);
    tracker.push(estimate(midiToFrequency(60)), 20);
    tracker.reset();
    expect(tracker.push(estimate(midiToFrequency(72)), 40).midi).toBe(72);
  });
});

describe('rmsToLevel', () => {
  it('maps silence to zero and a hot signal to one', () => {
    expect(rmsToLevel(0)).toBe(0);
    expect(rmsToLevel(1)).toBe(1);
  });

  it('increases monotonically', () => {
    let previous = -1;
    for (const rms of [0.001, 0.005, 0.01, 0.05, 0.1, 0.3]) {
      const level = rmsToLevel(rms);
      expect(level).toBeGreaterThanOrEqual(previous);
      previous = level;
    }
    expect(previous).toBeLessThanOrEqual(1);
  });
});
