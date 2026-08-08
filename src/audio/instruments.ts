/**
 * Offline instrument engine (item_002).
 *
 * All three voices are synthesised locally with Web Audio nodes: no sample bank is
 * downloaded at runtime, so the piano keeps working offline after the first PWA
 * load (item_002 AC5, AC8) and the bundle stays inside the offline weight budget
 * of ADR 001.
 */

import { midiToFrequency } from '../music/notes';

export const INSTRUMENT_IDS = ['studio-grand', 'soft-piano', 'warm-organ'] as const;

export type InstrumentId = (typeof INSTRUMENT_IDS)[number];

export const DEFAULT_INSTRUMENT: InstrumentId = 'studio-grand';

export function isInstrumentId(value: unknown): value is InstrumentId {
  return typeof value === 'string' && (INSTRUMENT_IDS as readonly string[]).includes(value);
}

interface Partial_ {
  /** Harmonic ratio relative to the fundamental. */
  ratio: number;
  gain: number;
  type: OscillatorType;
  /** Seconds until this partial decays to its sustain level. */
  decay: number;
  /** Fraction of the initial gain kept while the key is held. */
  sustain: number;
  /** Cents of detune, used sparingly to widen the piano voices. */
  detune?: number;
}

interface InstrumentSpec {
  gain: number;
  attack: number;
  release: number;
  partials: Partial_[];
  /** Low-pass applied to the whole voice; keeps the synthesis from sounding harsh. */
  filter?: { frequencyRatio: number; minFrequency: number; q: number };
  vibrato?: { frequency: number; cents: number };
}

const SPECS: Record<InstrumentId, InstrumentSpec> = {
  'studio-grand': {
    gain: 0.5,
    attack: 0.006,
    release: 0.18,
    partials: [
      { ratio: 1, gain: 1, type: 'triangle', decay: 2.4, sustain: 0.55 },
      { ratio: 1, gain: 0.35, type: 'sine', decay: 2.0, sustain: 0.5, detune: 6 },
      { ratio: 2, gain: 0.3, type: 'sine', decay: 1.2, sustain: 0.22 },
      { ratio: 3, gain: 0.14, type: 'sine', decay: 0.8, sustain: 0.12 },
      { ratio: 4, gain: 0.07, type: 'sine', decay: 0.5, sustain: 0.05 },
    ],
    filter: { frequencyRatio: 9, minFrequency: 1800, q: 0.7 },
  },
  'soft-piano': {
    gain: 0.46,
    attack: 0.02,
    release: 0.26,
    partials: [
      { ratio: 1, gain: 1, type: 'sine', decay: 3.0, sustain: 0.6 },
      { ratio: 2, gain: 0.16, type: 'sine', decay: 1.6, sustain: 0.16 },
      { ratio: 3, gain: 0.05, type: 'sine', decay: 1.0, sustain: 0.05 },
    ],
    filter: { frequencyRatio: 5, minFrequency: 900, q: 0.6 },
  },
  'warm-organ': {
    gain: 0.34,
    attack: 0.03,
    release: 0.12,
    // Drawbar-style additive registration: no decay, so the tone holds flat.
    partials: [
      { ratio: 0.5, gain: 0.35, type: 'sine', decay: 0, sustain: 1 },
      { ratio: 1, gain: 1, type: 'sine', decay: 0, sustain: 1 },
      { ratio: 2, gain: 0.5, type: 'sine', decay: 0, sustain: 1 },
      { ratio: 3, gain: 0.28, type: 'sine', decay: 0, sustain: 1 },
      { ratio: 4, gain: 0.18, type: 'sine', decay: 0, sustain: 1 },
      { ratio: 6, gain: 0.1, type: 'sine', decay: 0, sustain: 1 },
    ],
    filter: { frequencyRatio: 7, minFrequency: 1200, q: 0.5 },
  },
};

interface Voice {
  midi: number;
  gain: GainNode;
  oscillators: OscillatorNode[];
  extras: AudioNode[];
  release: number;
}

/**
 * Polyphonic player for the piano keyboard. One instance owns the shared
 * AudioContext so the microphone pipeline can join the same clock.
 */
export class InstrumentEngine {
  private readonly context: AudioContext;
  private readonly master: GainNode;
  private readonly voices = new Map<number, Voice>();
  private instrument: InstrumentId = DEFAULT_INSTRUMENT;
  private volume = 0.8;
  private muted = false;

  constructor(context: AudioContext) {
    this.context = context;
    this.master = context.createGain();
    this.master.gain.value = this.volume;
    this.master.connect(context.destination);
  }

  get audioContext(): AudioContext {
    return this.context;
  }

  get currentInstrument(): InstrumentId {
    return this.instrument;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  /** Held notes keep sounding; only new notes use the new voice (item_002 AC6). */
  setInstrument(instrument: InstrumentId): void {
    this.instrument = instrument;
  }

  setVolume(volume: number): void {
    this.volume = clamp(volume, 0, 1);
    this.applyMasterGain();
  }

  getVolume(): number {
    return this.volume;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (muted) this.releaseAll();
    this.applyMasterGain();
  }

  /** Browsers start the context suspended until a user gesture. */
  async resume(): Promise<void> {
    if (this.context.state !== 'running') await this.context.resume();
  }

  noteOn(midi: number): void {
    if (this.muted) return;
    if (this.voices.has(midi)) return; // Re-triggering a held key would double the gain.

    const spec = SPECS[this.instrument];
    const now = this.context.currentTime;
    const frequency = midiToFrequency(midi);

    const voiceGain = this.context.createGain();
    voiceGain.gain.value = 0;
    const extras: AudioNode[] = [];

    if (spec.filter) {
      const filter = this.context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = Math.max(spec.filter.minFrequency, frequency * spec.filter.frequencyRatio);
      filter.Q.value = spec.filter.q;
      voiceGain.connect(filter);
      filter.connect(this.master);
      extras.push(filter);
    } else {
      voiceGain.connect(this.master);
    }

    const oscillators: OscillatorNode[] = [];
    for (const partial of spec.partials) {
      const oscillator = this.context.createOscillator();
      oscillator.type = partial.type;
      oscillator.frequency.value = frequency * partial.ratio;
      if (partial.detune) oscillator.detune.value = partial.detune;

      const partialGain = this.context.createGain();
      const peak = partial.gain * spec.gain;
      partialGain.gain.setValueAtTime(0, now);
      partialGain.gain.linearRampToValueAtTime(peak, now + spec.attack);
      if (partial.decay > 0 && partial.sustain < 1) {
        partialGain.gain.setTargetAtTime(peak * partial.sustain, now + spec.attack, partial.decay / 3);
      }

      oscillator.connect(partialGain);
      partialGain.connect(voiceGain);
      oscillator.start(now);
      oscillators.push(oscillator);
      extras.push(partialGain);
    }

    if (spec.vibrato) {
      const lfo = this.context.createOscillator();
      const depth = this.context.createGain();
      lfo.frequency.value = spec.vibrato.frequency;
      depth.gain.value = spec.vibrato.cents;
      lfo.connect(depth);
      for (const oscillator of oscillators) depth.connect(oscillator.detune);
      lfo.start(now);
      oscillators.push(lfo);
      extras.push(depth);
    }

    voiceGain.gain.setValueAtTime(0, now);
    voiceGain.gain.linearRampToValueAtTime(1, now + spec.attack);

    this.voices.set(midi, { midi, gain: voiceGain, oscillators, extras, release: spec.release });
  }

  /** Short fade out, then teardown of the voice's nodes (item_002 AC7). */
  noteOff(midi: number): void {
    const voice = this.voices.get(midi);
    if (!voice) return;
    this.voices.delete(midi);
    this.stopVoice(voice, voice.release);
  }

  /** Immediate silence for the panic control (item_002 AC4, item_005 AC2). */
  releaseAll(fade = 0.04): void {
    for (const voice of this.voices.values()) this.stopVoice(voice, fade);
    this.voices.clear();
  }

  activeNotes(): number[] {
    return [...this.voices.keys()];
  }

  dispose(): void {
    this.releaseAll(0.01);
    this.master.disconnect();
  }

  private stopVoice(voice: Voice, fade: number): void {
    const now = this.context.currentTime;
    const gain = voice.gain.gain;
    gain.cancelScheduledValues(now);
    gain.setValueAtTime(gain.value, now);
    gain.linearRampToValueAtTime(0, now + fade);
    const stopAt = now + fade + 0.02;
    for (const oscillator of voice.oscillators) {
      try {
        oscillator.stop(stopAt);
      } catch {
        // A node already stopped by a previous panic; nothing to do.
      }
    }
    const lastOscillator = voice.oscillators[voice.oscillators.length - 1];
    const teardown = () => {
      voice.gain.disconnect();
      for (const node of voice.extras) node.disconnect();
    };
    if (lastOscillator) lastOscillator.addEventListener('ended', teardown, { once: true });
    else teardown();
  }

  private applyMasterGain(): void {
    const now = this.context.currentTime;
    const target = this.muted ? 0 : this.volume;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(target, now + 0.03);
  }
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
