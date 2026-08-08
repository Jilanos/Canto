/**
 * Turns raw YIN estimates into the normalised stream the renderer consumes
 * (ADR 001): timestamp, frequency, note, octave, cents, confidence and level.
 *
 * The tracker owns the "is this a real note?" decision, so an ambiguous or quiet
 * window is published as a non-note state rather than as a certain note
 * (item_003 AC3, item_004 AC4).
 *
 * Thresholds are asymmetric on purpose (item_007). Starting to track demands a
 * clearly audible, clearly periodic window; staying tracked demands much less. A
 * held note whose captured level slowly drops — because the browser's gain control
 * rides it down, or because the singer relaxes — used to fall under a single fixed
 * floor and the trace died mid-note. Hysteresis plus a short grace period keeps the
 * note alive without inventing one: true silence still drops out immediately.
 */

import { RANGE_HIGH_MIDI, RANGE_LOW_MIDI, frequencyToNote } from '../music/notes';
import type { PitchEstimate } from './yin';

export type PitchState = 'silence' | 'weak' | 'unstable' | 'tracking';

export interface PitchSample {
  /** Milliseconds on the audio clock, monotonic within a session. */
  timestamp: number;
  state: PitchState;
  frequency: number | null;
  exactMidi: number | null;
  midi: number | null;
  note: string | null;
  /** Signed cents from the nearest note centre; internal, never shown as a number. */
  cents: number | null;
  /** 0..1 periodicity confidence of the analysed window. */
  clarity: number;
  /** 0..1 input level, mapped from RMS over a practical dB window. */
  level: number;
  /** Raw RMS of the analysed window; diagnostics only. */
  rms: number;
  /** True when this frame reuses the previous reading through the grace period. */
  held: boolean;
}

export interface TrackerOptions {
  /** Below this RMS the input counts as silence, tracking or not. */
  silenceRms: number;
  /** RMS required to *start* tracking. */
  attackRms: number;
  /** RMS required to *keep* tracking; below `attackRms` by design. */
  releaseRms: number;
  /** YIN clarity required to start tracking. */
  attackClarity: number;
  /** YIN clarity required to keep tracking. */
  releaseClarity: number;
  /**
   * How long a tracked note survives frames that fail the release thresholds while
   * the input is still audible. Short enough that releasing a note reads as
   * immediate, long enough to ride out a few bad windows.
   */
  holdMs: number;
  /** Frames of history used by the median filter. */
  smoothingFrames: number;
}

export const DEFAULT_TRACKER_OPTIONS: TrackerOptions = {
  silenceRms: 0.004,
  attackRms: 0.012,
  releaseRms: 0.005,
  attackClarity: 0.7,
  releaseClarity: 0.55,
  holdMs: 120,
  smoothingFrames: 3,
};

/** dB window used to map RMS onto a 0..1 meter. */
const LEVEL_FLOOR_DB = -60;
const LEVEL_CEILING_DB = -6;

export class PitchTracker {
  private readonly options: TrackerOptions;
  private readonly history: number[] = [];
  private tracking = false;
  private lastGood: PitchSample | null = null;

  constructor(options: Partial<TrackerOptions> = {}) {
    this.options = { ...DEFAULT_TRACKER_OPTIONS, ...options };
  }

  get thresholds(): Readonly<TrackerOptions> {
    return this.options;
  }

  reset(): void {
    this.history.length = 0;
    this.tracking = false;
    this.lastGood = null;
  }

  /** Classifies one analysis frame. `estimate` is null when YIN found nothing. */
  push(estimate: PitchEstimate | null, timestamp: number): PitchSample {
    const rms = estimate?.rms ?? 0;
    const clarity = estimate?.clarity ?? 0;
    const level = rmsToLevel(rms);

    // True silence always wins: releasing a note must read as immediate.
    if (rms < this.options.silenceRms) return this.drop('silence', timestamp, clarity, level, rms);

    const minRms = this.tracking ? this.options.releaseRms : this.options.attackRms;
    const minClarity = this.tracking ? this.options.releaseClarity : this.options.attackClarity;

    if (rms < minRms) return this.holdOrDrop('weak', timestamp, clarity, level, rms);
    if (!estimate || clarity < minClarity) return this.holdOrDrop('unstable', timestamp, clarity, level, rms);

    const frequency = this.smooth(estimate.frequency);
    const reading = frequencyToNote(frequency);
    if (!reading || reading.midi < RANGE_LOW_MIDI || reading.midi > RANGE_HIGH_MIDI) {
      return this.holdOrDrop('unstable', timestamp, clarity, level, rms);
    }

    this.tracking = true;
    const sample: PitchSample = {
      timestamp,
      state: 'tracking',
      frequency,
      exactMidi: reading.exactMidi,
      midi: reading.midi,
      note: `${reading.name}${reading.octave}`,
      cents: reading.cents,
      clarity,
      level,
      rms,
      held: false,
    };
    this.lastGood = sample;
    return sample;
  }

  /**
   * Rides out a bad frame by repeating the last good reading, but only while the
   * input stays audible and only for `holdMs`. Held frames are flagged so the
   * renderer can show them as uncertain rather than as a confirmed note.
   */
  private holdOrDrop(state: PitchState, timestamp: number, clarity: number, level: number, rms: number): PitchSample {
    const last = this.lastGood;
    if (this.tracking && last && timestamp - last.timestamp <= this.options.holdMs) {
      return { ...last, timestamp, clarity, level, rms, held: true };
    }
    return this.drop(state, timestamp, clarity, level, rms);
  }

  private drop(state: PitchState, timestamp: number, clarity: number, level: number, rms: number): PitchSample {
    this.history.length = 0;
    this.tracking = false;
    this.lastGood = null;
    return {
      timestamp,
      state,
      frequency: null,
      exactMidi: null,
      midi: null,
      note: null,
      cents: null,
      clarity,
      level,
      rms,
      held: false,
    };
  }

  /** Median of the last frames: rejects single-frame octave slips without lag. */
  private smooth(frequency: number): number {
    this.history.push(frequency);
    while (this.history.length > this.options.smoothingFrames) this.history.shift();
    const sorted = [...this.history].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)] as number;
  }
}

export function rmsToLevel(rms: number): number {
  if (!(rms > 0)) return 0;
  const db = 20 * Math.log10(rms);
  const ratio = (db - LEVEL_FLOOR_DB) / (LEVEL_CEILING_DB - LEVEL_FLOOR_DB);
  return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}
