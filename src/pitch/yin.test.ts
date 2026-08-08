import { describe, expect, it } from 'vitest';
import { centsBetween, midiToFrequency, rangeMidiNotes } from '../music/notes';
import { noiseOnly, silence, sine, voiced } from './signals';
import { DEFAULT_PITCH_OPTIONS, estimatePitch, rootMeanSquare } from './yin';

const SAMPLE_RATE = 48000;
const WINDOW = 2048;
const options = { ...DEFAULT_PITCH_OPTIONS, sampleRate: SAMPLE_RATE };

function detect(buffer: Float32Array) {
  return estimatePitch(buffer, options);
}

describe('estimatePitch on pure tones', () => {
  it('tracks every note of C2..C6 within 5 cents', () => {
    const errors: number[] = [];
    for (const midi of rangeMidiNotes()) {
      const frequency = midiToFrequency(midi);
      const estimate = detect(sine({ frequency, sampleRate: SAMPLE_RATE, length: WINDOW }));
      expect(estimate, `no estimate for MIDI ${midi}`).not.toBeNull();
      const error = Math.abs(centsBetween((estimate as { frequency: number }).frequency, frequency));
      errors.push(error);
      expect(error, `MIDI ${midi} off by ${error.toFixed(2)} cents`).toBeLessThan(5);
    }
    // Documented protocol figure: mean absolute error across the range.
    const mean = errors.reduce((sum, value) => sum + value, 0) / errors.length;
    expect(mean).toBeLessThan(1.5);
  });

  it('resolves detuned pitches rather than snapping to a note', () => {
    for (const cents of [-40, -15, 15, 40]) {
      const frequency = midiToFrequency(57) * 2 ** (cents / 1200); // around A3
      const estimate = detect(sine({ frequency, sampleRate: SAMPLE_RATE, length: WINDOW }));
      expect(Math.abs(centsBetween((estimate as { frequency: number }).frequency, frequency))).toBeLessThan(5);
    }
  });

  it('reports high clarity for a periodic window', () => {
    const estimate = detect(sine({ frequency: 220, sampleRate: SAMPLE_RATE, length: WINDOW }));
    expect(estimate?.clarity ?? 0).toBeGreaterThan(0.9);
  });
});

describe('estimatePitch on voiced signals', () => {
  it('stays on the fundamental of a harmonic-rich tone across the range', () => {
    for (const midi of [36, 43, 48, 55, 60, 67, 72, 79, 84]) {
      const frequency = midiToFrequency(midi);
      const estimate = detect(voiced({ frequency, sampleRate: SAMPLE_RATE, length: WINDOW }));
      expect(estimate, `no estimate for MIDI ${midi}`).not.toBeNull();
      const error = centsBetween((estimate as { frequency: number }).frequency, frequency);
      // An octave error would show up as roughly +/-1200 cents.
      expect(Math.abs(error), `MIDI ${midi} off by ${error.toFixed(1)} cents`).toBeLessThan(10);
    }
  });

  it('survives moderate additive noise', () => {
    const frequency = midiToFrequency(57);
    const estimate = detect(voiced({ frequency, sampleRate: SAMPLE_RATE, length: WINDOW, noise: 0.05, seed: 7 }));
    expect(estimate).not.toBeNull();
    expect(Math.abs(centsBetween((estimate as { frequency: number }).frequency, frequency))).toBeLessThan(20);
  });
});

describe('estimatePitch on unusable input', () => {
  it('reports no periodicity for silence', () => {
    const estimate = detect(silence(WINDOW));
    expect(estimate === null || estimate.clarity < 0.5).toBe(true);
    expect(rootMeanSquare(silence(WINDOW))).toBe(0);
  });

  it('reports low clarity for broadband noise', () => {
    const estimate = detect(noiseOnly(WINDOW, 0.3, 42));
    expect(estimate === null || estimate.clarity < 0.7).toBe(true);
  });

  it('rejects windows too short for the requested low bound', () => {
    expect(estimatePitch(sine({ frequency: 100, sampleRate: SAMPLE_RATE, length: 64 }), options)).toBeNull();
  });
});

describe('latency protocol', () => {
  it('analyses a frame far below the 150 ms feedback budget', () => {
    const buffer = voiced({ frequency: 196, sampleRate: SAMPLE_RATE, length: WINDOW });
    detect(buffer); // warm up the JIT before measuring
    const iterations = 50;
    const started = performance.now();
    for (let index = 0; index < iterations; index += 1) detect(buffer);
    const perFrameMs = (performance.now() - started) / iterations;
    // The audio window itself is ~43 ms at 48 kHz; analysis must stay a small
    // fraction of the remaining budget so the UI keeps up.
    expect(perFrameMs).toBeLessThan(20);
  });

  it('keeps the analysis window inside the feedback budget', () => {
    expect((WINDOW / SAMPLE_RATE) * 1000).toBeLessThan(60);
  });
});
