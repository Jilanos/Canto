/**
 * Reproducible synthetic signals for the pitch accuracy and latency protocol
 * (item_003 AC6). Shared by the unit tests and the documented measurement run so
 * both exercise exactly the same inputs.
 */

export interface SignalOptions {
  frequency: number;
  sampleRate: number;
  length: number;
  amplitude?: number;
  /** Relative amplitudes of harmonics 2..n, mimicking a voiced timbre. */
  harmonics?: number[];
  /** Uniform noise amplitude added on top of the tone. */
  noise?: number;
  /** Deterministic seed for the noise generator. */
  seed?: number;
}

export function sine(options: SignalOptions): Float32Array {
  return synth({ ...options, harmonics: [] });
}

/** Tone with harmonic partials: the case that makes naive detectors jump an octave. */
export function voiced(options: SignalOptions): Float32Array {
  return synth({ harmonics: [0.6, 0.45, 0.3, 0.2, 0.12], ...options });
}

export function silence(length: number): Float32Array {
  return new Float32Array(length);
}

export function noiseOnly(length: number, amplitude = 0.2, seed = 1): Float32Array {
  const random = mulberry32(seed);
  const buffer = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    buffer[index] = (random() * 2 - 1) * amplitude;
  }
  return buffer;
}

function synth(options: SignalOptions): Float32Array {
  const { frequency, sampleRate, length } = options;
  const amplitude = options.amplitude ?? 0.5;
  const harmonics = options.harmonics ?? [];
  const noise = options.noise ?? 0;
  const random = mulberry32(options.seed ?? 1);

  const buffer = new Float32Array(length);
  for (let index = 0; index < length; index += 1) {
    const phase = (2 * Math.PI * frequency * index) / sampleRate;
    let value = Math.sin(phase);
    harmonics.forEach((gain, harmonicIndex) => {
      value += gain * Math.sin(phase * (harmonicIndex + 2));
    });
    const normalised = value / (1 + harmonics.reduce((sum, gain) => sum + gain, 0));
    buffer[index] = amplitude * normalised + (noise > 0 ? (random() * 2 - 1) * noise : 0);
  }
  return buffer;
}

/** Small deterministic PRNG so noisy cases stay reproducible across runs. */
function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
