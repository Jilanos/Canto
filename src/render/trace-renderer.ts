/**
 * Canvas 2D note-time renderer (item_004, ADR 001).
 *
 * Horizontal axis: pitch, on exactly the same columns as the piano keys, with no
 * hertz axis. Vertical axis: time, present at the bottom next to the keyboard,
 * history rising. The renderer only consumes the normalised pitch stream, so the
 * detector can be swapped without touching this file.
 */

import { IN_TUNE_CENTS, isBlackKey, noteLabel, pitchClass } from '../music/notes';
import { type KeyboardLayout, pitchPosition } from '../music/layout';
import type { PitchSample } from '../pitch/tracker';
import { HISTORY_MS, TraceBuffer, ageFraction } from './trace-buffer';
import { THEME } from './theme';

/** Clarity below this is drawn as an uncertain trace (item_004 AC4). */
const UNCERTAIN_CLARITY = 0.85;

export class TraceRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private readonly buffer: TraceBuffer;
  private layout: KeyboardLayout;
  private width = 0;
  private height = 0;
  private frame = 0;
  private running = false;
  /** Wall clock of the newest sample, so the trace keeps scrolling while idle. */
  private clockOffset: number | null = null;

  constructor(canvas: HTMLCanvasElement, layout: KeyboardLayout, buffer: TraceBuffer) {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable');
    this.canvas = canvas;
    this.context = context;
    this.layout = layout;
    this.buffer = buffer;
    this.resize();
  }

  setLayout(layout: KeyboardLayout): void {
    this.layout = layout;
  }

  /** Matches the backing store to the CSS box; call on resize and orientation change. */
  resize(): void {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = this.canvas.getBoundingClientRect();
    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));
    this.canvas.width = Math.round(this.width * ratio);
    this.canvas.height = Math.round(this.height * ratio);
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.draw();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    const loop = () => {
      if (!this.running) return;
      this.draw();
      this.frame = requestAnimationFrame(loop);
    };
    this.frame = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.clockOffset = null;
    this.draw();
  }

  draw(): void {
    const { context, width, height } = this;
    context.fillStyle = THEME.surface;
    context.fillRect(0, 0, width, height);

    this.drawColumns();
    const now = this.currentTime();
    if (now !== null) {
      this.buffer.prune(now);
      this.drawTrace(now);
    }
    this.drawPresentLine();
  }

  /**
   * Audio-clock "now". The pitch stream is stamped on the AudioContext clock, so the
   * renderer derives its own now from the newest sample plus elapsed wall time; that
   * keeps the trace scrolling smoothly between analysis frames.
   */
  private currentTime(): number | null {
    const latest = this.buffer.latestTimestamp;
    if (latest === null) {
      this.clockOffset = null;
      return null;
    }
    const wall = performance.now();
    if (this.clockOffset === null) this.clockOffset = latest - wall;
    else this.clockOffset = Math.max(this.clockOffset, latest - wall);
    return wall + this.clockOffset;
  }

  private drawColumns(): void {
    const { context, width, height, layout } = this;

    for (const key of layout.keys) {
      const left = key.left * width;
      const keyWidth = key.width * width;
      context.fillStyle = key.black ? THEME.columnBlack : THEME.columnWhite;
      context.fillRect(left, 0, keyWidth, height);
    }

    // Boundaries between white keys, with a stronger line at each octave C.
    context.lineWidth = 1;
    for (const key of layout.keys) {
      if (key.black) continue;
      const isOctave = pitchClass(key.midi) === 0;
      context.strokeStyle = isOctave ? THEME.octaveLine : THEME.gridLine;
      const x = Math.round(key.left * width) + 0.5;
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();

      if (isOctave) {
        context.fillStyle = THEME.label;
        context.font = '600 11px ui-sans-serif, system-ui, sans-serif';
        context.textAlign = 'left';
        context.textBaseline = 'top';
        context.fillText(noteLabel(key.midi), x + 4, 6);
      }
    }

    // The +/-15 cents in-tune band around every note centre (item_004 AC2).
    const semitoneWidth = width / this.layout.whiteKeyCount / 2;
    const bandHalfWidth = (semitoneWidth * IN_TUNE_CENTS) / 100;
    for (const key of layout.keys) {
      const center = key.centerX * width;
      context.fillStyle = THEME.inTuneBand;
      context.fillRect(center - bandHalfWidth, 0, bandHalfWidth * 2, height);
      context.strokeStyle = isBlackKey(key.midi) ? THEME.inTuneBand : THEME.inTuneBandEdge;
      context.beginPath();
      context.moveTo(Math.round(center) + 0.5, 0);
      context.lineTo(Math.round(center) + 0.5, height);
      context.stroke();
    }
  }

  private drawPresentLine(): void {
    const { context, width, height } = this;
    const y = height - 0.5;
    context.strokeStyle = THEME.presentLine;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(width, y);
    context.stroke();
  }

  private drawTrace(now: number): void {
    const { context, height } = this;
    context.lineJoin = 'round';
    context.lineCap = 'round';

    for (const segment of this.buffer.segments()) {
      const points = segment
        .map((sample) => this.toPoint(sample, now))
        .filter((point): point is TracePoint => point !== null);
      if (points.length === 0) continue;

      // Stroke sub-runs so tuning and certainty can change mid-phrase without
      // breaking the visual continuity of the line.
      for (let index = 1; index < points.length; index += 1) {
        const from = points[index - 1] as TracePoint;
        const to = points[index] as TracePoint;
        context.strokeStyle = to.uncertain ? THEME.traceUncertain : to.inTune ? THEME.traceInTune : THEME.traceOff;
        // Thickness doubles as a non-colour cue for the in-tune band (item_004 AC6).
        context.lineWidth = to.uncertain ? 1.5 : to.inTune ? 4 : 2.5;
        context.setLineDash(to.uncertain ? [3, 4] : []);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
      context.setLineDash([]);

      if (points.length === 1) {
        const only = points[0] as TracePoint;
        context.fillStyle = only.uncertain ? THEME.traceUncertain : only.inTune ? THEME.traceInTune : THEME.traceOff;
        context.beginPath();
        context.arc(only.x, only.y, 2, 0, Math.PI * 2);
        context.fill();
      }
    }

    // Head marker: the live pitch, drawn on the present line.
    const latest = this.buffer.latest();
    if (latest && latest.state === 'tracking') {
      const head = this.toPoint(latest, now);
      if (head) {
        context.fillStyle = head.inTune ? THEME.traceInTune : THEME.headNote;
        context.beginPath();
        context.arc(head.x, Math.min(head.y, height - 3), head.inTune ? 6 : 4, 0, Math.PI * 2);
        context.fill();
        if (!head.inTune) {
          // Hollow ring when off the in-tune band: shape, not only colour.
          context.strokeStyle = THEME.surface;
          context.lineWidth = 2;
          context.beginPath();
          context.arc(head.x, Math.min(head.y, height - 3), 2, 0, Math.PI * 2);
          context.stroke();
        }
      }
    }
  }

  private toPoint(sample: PitchSample, now: number): TracePoint | null {
    if (sample.exactMidi === null) return null;
    const normalisedX = pitchPosition(this.layout, sample.exactMidi);
    if (normalisedX === null) return null;
    const age = ageFraction(sample, now, HISTORY_MS);
    return {
      x: normalisedX * this.width,
      y: this.height - age * this.height,
      inTune: Math.abs(sample.cents ?? 100) <= IN_TUNE_CENTS,
      uncertain: sample.clarity < UNCERTAIN_CLARITY,
    };
  }
}

interface TracePoint {
  x: number;
  y: number;
  inTune: boolean;
  uncertain: boolean;
}
