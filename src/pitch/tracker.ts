/**
 * Turns raw YIN estimates into the normalised stream the renderer consumes
 * (ADR 001): timestamp, frequency, note, octave, cents, confidence and level.
 *
 * The tracker owns the "is this a real note?" decision, so an ambiguous or quiet
 * window is published as a non-note state rather than as a certain note
 * (item_003 AC3, item_004 AC4). Smoothing is deliberately shallow — a median over
 * three frames — because heavy smoothing would defeat the 150 ms feedback goal.
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
}

export interface TrackerOptions {
  /** Below this RMS the input counts as silence. */
  silenceRms: number;
  /** Below this RMS the input is audible but too quiet to trust. */
  weakRms: number;
  /** Minimum YIN clarity accepted as a reliable pitch. */
  minClarity: number;
  /** Frames of history used by the median filter. */
  smoothingFrames: number;
}

export const DEFAULT_TRACKER_OPTIONS: TrackerOptions = {
  silenceRms: 0.004,
  weakRms: 0.012,
  minClarity: 0.7,
  smoothingFrames: 3,
};

/** dB window used to map RMS onto a 0..1 meter. */
const LEVEL_FLOOR_DB = -60;
const LEVEL_CEILING_DB = -6;

export class PitchTracker {
  private readonly options: TrackerOptions;
  private readonly history: number[] = [];

  constructor(options: Partial<TrackerOptions> = {}) {
    this.options = { ...DEFAULT_TRACKER_OPTIONS, ...options };
  }

  reset(): void {
    this.history.length = 0;
  }

  /** Classifies one analysis frame. `estimate` is null when YIN found nothing. */
  push(estimate: PitchEstimate | null, timestamp: number): PitchSample {
    const rms = estimate?.rms ?? 0;
    const clarity = estimate?.clarity ?? 0;
    const level = rmsToLevel(rms);

    if (rms < this.options.silenceRms) {
      this.history.length = 0;
      return blank('silence', timestamp, clarity, level);
    }
    if (rms < this.options.weakRms) {
      this.history.length = 0;
      return blank('weak', timestamp, clarity, level);
    }
    if (!estimate || clarity < this.options.minClarity) {
      this.history.length = 0;
      return blank('unstable', timestamp, clarity, level);
    }

    const frequency = this.smooth(estimate.frequency);
    const reading = frequencyToNote(frequency);
    if (!reading || reading.midi < RANGE_LOW_MIDI || reading.midi > RANGE_HIGH_MIDI) {
      return blank('unstable', timestamp, clarity, level);
    }

    return {
      timestamp,
      state: 'tracking',
      frequency,
      exactMidi: reading.exactMidi,
      midi: reading.midi,
      note: `${reading.name}${reading.octave}`,
      cents: reading.cents,
      clarity,
      level,
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

function blank(state: PitchState, timestamp: number, clarity: number, level: number): PitchSample {
  return { timestamp, state, frequency: null, exactMidi: null, midi: null, note: null, cents: null, clarity, level };
}

export function rmsToLevel(rms: number): number {
  if (!(rms > 0)) return 0;
  const db = 20 * Math.log10(rms);
  const ratio = (db - LEVEL_FLOOR_DB) / (LEVEL_CEILING_DB - LEVEL_FLOOR_DB);
  return ratio < 0 ? 0 : ratio > 1 ? 1 : ratio;
}
