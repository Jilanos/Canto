/**
 * Fundamental frequency estimation (YIN, de Cheveigné & Kawahara 2002).
 *
 * Deliberately a pure function over a sample buffer: the renderer never depends on
 * the algorithm (ADR 001), and the accuracy / latency protocol of item_003 AC6 can
 * run this on synthetic signals with no browser involved.
 */

export interface PitchOptions {
  sampleRate: number;
  /** Lowest detectable frequency; sets the longest inspected lag. */
  minFrequency: number;
  /** Highest detectable frequency; sets the shortest inspected lag. */
  maxFrequency: number;
  /** YIN absolute threshold on the normalised difference. Lower is stricter. */
  threshold: number;
}

export interface PitchEstimate {
  frequency: number;
  /** 0..1 periodicity confidence; 1 means a perfectly periodic window. */
  clarity: number;
  /** Root-mean-square amplitude of the analysed window. */
  rms: number;
}

export const DEFAULT_PITCH_OPTIONS: Omit<PitchOptions, 'sampleRate'> = {
  // A little headroom below C2 (65.4 Hz) and above C6 (1046.5 Hz) so notes at the
  // edge of the range are not rejected by the lag bounds alone.
  minFrequency: 60,
  maxFrequency: 1200,
  threshold: 0.15,
};

export function rootMeanSquare(buffer: Float32Array): number {
  let sum = 0;
  for (let index = 0; index < buffer.length; index += 1) {
    const sample = buffer[index] as number;
    sum += sample * sample;
  }
  return Math.sqrt(sum / Math.max(1, buffer.length));
}

/**
 * Estimates the fundamental of `buffer`, or returns `null` when the window holds
 * no usable periodicity. A null result is never rendered as a note (item_003 AC3).
 */
export function estimatePitch(buffer: Float32Array, options: PitchOptions): PitchEstimate | null {
  const { sampleRate, minFrequency, maxFrequency, threshold } = options;
  const rms = rootMeanSquare(buffer);

  const minLag = Math.max(2, Math.floor(sampleRate / maxFrequency));
  const maxLag = Math.min(Math.floor(buffer.length / 2), Math.ceil(sampleRate / minFrequency));
  if (maxLag <= minLag) return null;

  const windowSize = buffer.length - maxLag;
  if (windowSize <= 0) return null;

  // Squared difference function over the inspected lag range.
  const difference = new Float64Array(maxLag + 1);
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    let sum = 0;
    for (let index = 0; index < windowSize; index += 1) {
      const delta = (buffer[index] as number) - (buffer[index + lag] as number);
      sum += delta * delta;
    }
    difference[lag] = sum;
  }

  // Cumulative mean normalisation: makes the threshold amplitude-independent.
  const normalised = new Float64Array(maxLag + 1);
  normalised[minLag] = 1;
  let runningSum = difference[minLag] as number;
  for (let lag = minLag + 1; lag <= maxLag; lag += 1) {
    runningSum += difference[lag] as number;
    normalised[lag] = runningSum > 0 ? ((difference[lag] as number) * (lag - minLag + 1)) / runningSum : 1;
  }

  // First dip below the threshold wins, which is what keeps YIN on the fundamental
  // instead of an octave-up harmonic; fall back to the global minimum otherwise.
  let bestLag = -1;
  for (let lag = minLag; lag <= maxLag; lag += 1) {
    if ((normalised[lag] as number) < threshold) {
      while (lag + 1 <= maxLag && (normalised[lag + 1] as number) < (normalised[lag] as number)) lag += 1;
      bestLag = lag;
      break;
    }
  }
  if (bestLag < 0) {
    let minimum = Number.POSITIVE_INFINITY;
    for (let lag = minLag; lag <= maxLag; lag += 1) {
      if ((normalised[lag] as number) < minimum) {
        minimum = normalised[lag] as number;
        bestLag = lag;
      }
    }
    if (bestLag < 0) return null;
  }

  const refinedLag = parabolicMinimum(normalised, bestLag, minLag, maxLag);
  const frequency = sampleRate / refinedLag;
  if (!Number.isFinite(frequency) || frequency < minFrequency || frequency > maxFrequency) return null;

  const clarity = clamp01(1 - (normalised[bestLag] as number));
  return { frequency, clarity, rms };
}

/** Sub-sample refinement of the chosen lag; without it, high notes quantise badly. */
function parabolicMinimum(values: Float64Array, lag: number, minLag: number, maxLag: number): number {
  if (lag <= minLag || lag >= maxLag) return lag;
  const previous = values[lag - 1] as number;
  const current = values[lag] as number;
  const next = values[lag + 1] as number;
  const denominator = 2 * (2 * current - next - previous);
  if (denominator === 0) return lag;
  const shift = (next - previous) / denominator;
  return Math.abs(shift) < 1 ? lag + shift : lag;
}

function clamp01(value: number): number {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
