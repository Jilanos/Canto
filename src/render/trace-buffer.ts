/**
 * Rolling eight-second history of the pitch stream (item_004 AC3).
 *
 * Pure and DOM-free: segmentation rules — where the trace must break for silence,
 * a dropped frame or an implausible jump (item_004 AC4) — are unit tested here
 * rather than eyeballed on a canvas. Samples live in memory only and are dropped
 * as they age out; nothing is persisted (item_005 AC5, AC8).
 */

import type { PitchSample } from '../pitch/tracker';

/** Visible history window, in milliseconds. */
export const HISTORY_MS = 8000;

/** A gap larger than this breaks the trace: frames were lost. */
const MAX_FRAME_GAP_MS = 120;

/** A jump larger than this is a detector slip, not a sung glide. */
const MAX_JUMP_SEMITONES = 2;

export type TraceSegment = PitchSample[];

export class TraceBuffer {
  private readonly samples: PitchSample[] = [];
  private readonly historyMs: number;

  constructor(historyMs = HISTORY_MS) {
    this.historyMs = historyMs;
  }

  get length(): number {
    return this.samples.length;
  }

  /** Newest timestamp in the buffer, or null when empty. */
  get latestTimestamp(): number | null {
    const last = this.samples[this.samples.length - 1];
    return last ? last.timestamp : null;
  }

  add(sample: PitchSample): void {
    this.samples.push(sample);
    this.prune(sample.timestamp);
  }

  clear(): void {
    this.samples.length = 0;
  }

  /** Drops samples older than the visible window relative to `now`. */
  prune(now: number): void {
    const oldest = now - this.historyMs;
    let index = 0;
    while (index < this.samples.length && (this.samples[index] as PitchSample).timestamp < oldest) index += 1;
    if (index > 0) this.samples.splice(0, index);
  }

  /** All samples still inside the window, oldest first. */
  all(): readonly PitchSample[] {
    return this.samples;
  }

  /**
   * Contiguous runs of tracked pitch. Non-tracking samples are not returned: they
   * become the visible interruptions between segments.
   */
  segments(): TraceSegment[] {
    const segments: TraceSegment[] = [];
    let current: TraceSegment = [];

    const flush = () => {
      if (current.length > 0) segments.push(current);
      current = [];
    };

    for (const sample of this.samples) {
      if (sample.state !== 'tracking' || sample.exactMidi === null) {
        flush();
        continue;
      }
      const previous = current[current.length - 1];
      if (previous) {
        const gap = sample.timestamp - previous.timestamp;
        const jump = Math.abs(sample.exactMidi - (previous.exactMidi as number));
        if (gap > MAX_FRAME_GAP_MS || jump > MAX_JUMP_SEMITONES) flush();
      }
      current.push(sample);
    }
    flush();
    return segments;
  }

  /** Most recent sample, whatever its state; drives the live note readout. */
  latest(): PitchSample | null {
    return this.samples[this.samples.length - 1] ?? null;
  }
}

/**
 * Vertical position of a sample: 0 at the present (next to the piano) and 1 at the
 * far edge of the window, so history rises away from the keyboard (item_004 AC3).
 */
export function ageFraction(sample: PitchSample, now: number, historyMs = HISTORY_MS): number {
  const age = (now - sample.timestamp) / historyMs;
  return age < 0 ? 0 : age > 1 ? 1 : age;
}
