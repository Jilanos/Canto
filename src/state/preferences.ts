/**
 * Local persistence of non-sensitive preferences only (item_005 AC8).
 *
 * Allowed: instrument, volume, mute, visible octave. Never persisted: microphone
 * audio, pitch samples, session history or progress. Reads are defensive because
 * storage can be disabled or hold values from an older build.
 */

import { DEFAULT_INSTRUMENT, type InstrumentId, isInstrumentId } from '../audio/instruments';
import { clampBottomMidi } from '../music/layout';

const STORAGE_KEY = 'canto.preferences.v1';

export interface Preferences {
  instrument: InstrumentId;
  /** 0..1 instrument volume. */
  volume: number;
  muted: boolean;
  /** Bottom MIDI note of the visible two-octave viewport. */
  bottomMidi: number;
}

export const DEFAULT_PREFERENCES: Preferences = {
  instrument: DEFAULT_INSTRUMENT,
  volume: 0.8,
  muted: false,
  bottomMidi: 48, // C3: the middle of C2..C6.
};

export function loadPreferences(storage: Storage | null = safeStorage()): Preferences {
  if (!storage) return { ...DEFAULT_PREFERENCES };
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_PREFERENCES };
    return sanitise(JSON.parse(raw) as unknown);
  } catch {
    return { ...DEFAULT_PREFERENCES };
  }
}

export function savePreferences(preferences: Preferences, storage: Storage | null = safeStorage()): void {
  if (!storage) return;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(sanitise(preferences)));
  } catch {
    // Storage full or blocked: preferences are a convenience, not a requirement.
  }
}

/** Drops unknown fields, so nothing outside the allow-list can round-trip. */
export function sanitise(value: unknown): Preferences {
  const source = (typeof value === 'object' && value !== null ? value : {}) as Partial<Record<keyof Preferences, unknown>>;
  const volume = typeof source.volume === 'number' && Number.isFinite(source.volume) ? source.volume : DEFAULT_PREFERENCES.volume;
  const bottomMidi = typeof source.bottomMidi === 'number' && Number.isFinite(source.bottomMidi)
    ? source.bottomMidi
    : DEFAULT_PREFERENCES.bottomMidi;
  return {
    instrument: isInstrumentId(source.instrument) ? source.instrument : DEFAULT_PREFERENCES.instrument,
    volume: Math.min(1, Math.max(0, volume)),
    muted: source.muted === true,
    bottomMidi: clampBottomMidi(bottomMidi),
  };
}

function safeStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null; // Storage access can throw when cookies are blocked.
  }
}
