import { describe, expect, it } from 'vitest';
import { midiToFrequency } from '../music/notes';
import { DEFAULT_TRACKER_OPTIONS, PitchTracker, rmsToLevel } from './tracker';
import type { PitchEstimate } from './yin';

const FRAME_MS = 16;

function estimate(frequency: number, clarity = 0.95, rms = 0.05): PitchEstimate {
  return { frequency, clarity, rms };
}

/** Feeds `count` frames of the same estimate, returning the last sample. */
function feed(tracker: PitchTracker, count: number, build: (index: number) => PitchEstimate | null, start = 0) {
  let sample = tracker.push(build(0), start);
  for (let index = 1; index < count; index += 1) {
    sample = tracker.push(build(index), start + index * FRAME_MS);
  }
  return sample;
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
    expect(sample.held).toBe(false);
  });

  it('reports silence below the silence floor', () => {
    const tracker = new PitchTracker();
    const sample = tracker.push(estimate(440, 0.99, DEFAULT_TRACKER_OPTIONS.silenceRms / 2), 0);
    expect(sample.state).toBe('silence');
    expect(sample.note).toBeNull();
    expect(sample.frequency).toBeNull();
  });

  it('requires the attack thresholds to start tracking', () => {
    const quiet = new PitchTracker();
    const betweenFloors = (DEFAULT_TRACKER_OPTIONS.releaseRms + DEFAULT_TRACKER_OPTIONS.attackRms) / 2;
    expect(quiet.push(estimate(440, 0.99, betweenFloors), 0).state).toBe('weak');

    const murky = new PitchTracker();
    const betweenClarities = (DEFAULT_TRACKER_OPTIONS.releaseClarity + DEFAULT_TRACKER_OPTIONS.attackClarity) / 2;
    expect(murky.push(estimate(440, betweenClarities, 0.05), 0).state).toBe('unstable');
  });

  it('reports an unstable pitch when YIN found nothing on an audible frame', () => {
    const tracker = new PitchTracker({ silenceRms: 0, attackRms: 0 });
    expect(tracker.push(null, 0).state).toBe('unstable');
  });

  it('rejects pitches outside C2..C6', () => {
    const tracker = new PitchTracker();
    expect(tracker.push(estimate(midiToFrequency(30)), 0).state).toBe('unstable');
    expect(tracker.push(estimate(midiToFrequency(96)), FRAME_MS).state).toBe('unstable');
    expect(tracker.push(estimate(midiToFrequency(36)), FRAME_MS * 2).state).toBe('tracking');
    expect(tracker.push(estimate(midiToFrequency(84)), FRAME_MS * 3).state).toBe('tracking');
  });

  it('carries the raw RMS for diagnostics', () => {
    const tracker = new PitchTracker();
    expect(tracker.push(estimate(440, 0.95, 0.037), 0).rms).toBeCloseTo(0.037, 9);
  });
});

describe('sustained notes (item_007)', () => {
  const target = midiToFrequency(57); // A3

  it('keeps tracking a held note whose captured level slowly drops', () => {
    const tracker = new PitchTracker();
    // 20 s at 60 fps, level decaying well below the attack floor but above release:
    // the shape a browser gain control produces on a stationary tone.
    const frames = 1200;
    let dropouts = 0;
    for (let index = 0; index < frames; index += 1) {
      const rms = 0.05 * (1 - index / frames) + DEFAULT_TRACKER_OPTIONS.releaseRms * 1.2 * (index / frames);
      const sample = tracker.push(estimate(target, 0.9, rms), index * FRAME_MS);
      if (sample.state !== 'tracking') dropouts += 1;
    }
    expect(dropouts).toBe(0);
  });

  it('would have dropped out under a single fixed floor', () => {
    // Guards the intent: the decayed level is genuinely below the attack floor, so
    // this test fails if hysteresis is quietly removed.
    const decayed = DEFAULT_TRACKER_OPTIONS.releaseRms * 1.2;
    expect(decayed).toBeLessThan(DEFAULT_TRACKER_OPTIONS.attackRms);
    const fresh = new PitchTracker();
    expect(fresh.push(estimate(target, 0.9, decayed), 0).state).toBe('weak');
  });

  it('rides out isolated bad frames without breaking the note', () => {
    const tracker = new PitchTracker();
    feed(tracker, 5, () => estimate(target), 0);
    const glitch = tracker.push(estimate(target, 0.1, 0.05), 5 * FRAME_MS);
    expect(glitch.state).toBe('tracking');
    expect(glitch.held).toBe(true);
    expect(glitch.note).toBe('A3');
    const recovered = tracker.push(estimate(target), 6 * FRAME_MS);
    expect(recovered.held).toBe(false);
  });

  it('gives up once the grace period is exceeded', () => {
    const tracker = new PitchTracker();
    tracker.push(estimate(target), 0);
    const late = DEFAULT_TRACKER_OPTIONS.holdMs + FRAME_MS;
    expect(tracker.push(estimate(target, 0.1, 0.05), late).state).toBe('unstable');
  });

  it('drops immediately when the singer stops, with no lingering note', () => {
    const tracker = new PitchTracker();
    feed(tracker, 10, () => estimate(target), 0);
    const stopped = tracker.push(estimate(target, 0.99, 0), 10 * FRAME_MS);
    expect(stopped.state).toBe('silence');
    expect(stopped.note).toBeNull();
    expect(stopped.held).toBe(false);
  });

  it('does not resume a stale note after a silence', () => {
    const tracker = new PitchTracker();
    feed(tracker, 5, () => estimate(target), 0);
    tracker.push(estimate(target, 0.99, 0), 5 * FRAME_MS);
    const next = tracker.push(estimate(target, 0.1, 0.05), 6 * FRAME_MS);
    expect(next.state).toBe('unstable');
    expect(next.note).toBeNull();
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

  it('clears history and hysteresis on reset', () => {
    const tracker = new PitchTracker();
    tracker.push(estimate(midiToFrequency(60)), 0);
    tracker.push(estimate(midiToFrequency(60)), 20);
    tracker.reset();
    expect(tracker.push(estimate(midiToFrequency(72)), 40).midi).toBe(72);
    // Back to attack thresholds: a quiet frame must not track.
    tracker.reset();
    expect(tracker.push(estimate(midiToFrequency(72), 0.95, DEFAULT_TRACKER_OPTIONS.releaseRms * 1.1), 60).state).toBe(
      'weak',
    );
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
