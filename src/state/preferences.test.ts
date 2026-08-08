import { describe, expect, it } from 'vitest';
import { DEFAULT_PREFERENCES, loadPreferences, sanitise, savePreferences } from './preferences';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, value),
  } as Storage;
}

describe('sanitise', () => {
  it('keeps only allowed preferences', () => {
    const result = sanitise({
      instrument: 'warm-organ',
      volume: 0.5,
      muted: true,
      bottomMidi: 60,
      micLevel: 0.9,
      lastSession: [1, 2, 3],
    });
    expect(result).toEqual({ instrument: 'warm-organ', volume: 0.5, muted: true, bottomMidi: 60 });
    expect(Object.keys(result)).toHaveLength(4);
  });

  it('falls back to defaults for invalid values', () => {
    expect(sanitise({ instrument: 'kazoo', volume: 'loud', muted: 'yes', bottomMidi: Number.NaN })).toEqual({
      ...DEFAULT_PREFERENCES,
      muted: false,
    });
    expect(sanitise(null)).toEqual(DEFAULT_PREFERENCES);
    expect(sanitise('nonsense')).toEqual(DEFAULT_PREFERENCES);
  });

  it('clamps volume and snaps the viewport into C2..C6', () => {
    expect(sanitise({ volume: 5 }).volume).toBe(1);
    expect(sanitise({ volume: -3 }).volume).toBe(0);
    expect(sanitise({ bottomMidi: 200 }).bottomMidi).toBe(60);
    expect(sanitise({ bottomMidi: 0 }).bottomMidi).toBe(36);
  });
});

describe('load and save', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    savePreferences({ instrument: 'soft-piano', volume: 0.3, muted: true, bottomMidi: 36 }, storage);
    expect(loadPreferences(storage)).toEqual({ instrument: 'soft-piano', volume: 0.3, muted: true, bottomMidi: 36 });
  });

  it('never writes anything beyond the allow-list', () => {
    const storage = memoryStorage();
    savePreferences({ ...DEFAULT_PREFERENCES, voice: 'sample' } as never, storage);
    const raw = storage.getItem('canto.preferences.v1') as string;
    expect(JSON.parse(raw)).toEqual(DEFAULT_PREFERENCES);
    expect(raw).not.toContain('voice');
  });

  it('returns defaults with no storage or corrupt contents', () => {
    expect(loadPreferences(null)).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences(memoryStorage())).toEqual(DEFAULT_PREFERENCES);
    expect(loadPreferences(memoryStorage({ 'canto.preferences.v1': '{not json' }))).toEqual(DEFAULT_PREFERENCES);
  });
});
