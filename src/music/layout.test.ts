import { describe, expect, it } from 'vitest';
import {
  VISIBLE_OCTAVES,
  availableBottomNotes,
  clampBottomMidi,
  createKeyboardLayout,
  keyAt,
  pitchPosition,
} from './layout';
import { RANGE_HIGH_MIDI, RANGE_LOW_MIDI, frequencyToMidi, isBlackKey, midiToFrequency, noteLabel } from './notes';

const C4 = 60;

describe('viewport selection', () => {
  it('offers whole-octave viewports inside C2..C6', () => {
    const bottoms = availableBottomNotes();
    expect(bottoms.map(noteLabel)).toEqual(['C2', 'C3', 'C4']);
    for (const bottom of bottoms) {
      expect(bottom).toBeGreaterThanOrEqual(RANGE_LOW_MIDI);
      expect(bottom + VISIBLE_OCTAVES * 12).toBeLessThanOrEqual(RANGE_HIGH_MIDI);
    }
  });

  it('clamps and snaps requested bottom notes', () => {
    expect(clampBottomMidi(0)).toBe(RANGE_LOW_MIDI);
    expect(clampBottomMidi(200)).toBe(RANGE_HIGH_MIDI - VISIBLE_OCTAVES * 12);
    expect(clampBottomMidi(C4)).toBe(C4);
    expect(clampBottomMidi(C4 + 3)).toBe(C4);
  });
});

describe('keyboard geometry', () => {
  const layout = createKeyboardLayout(C4);

  it('spans two octaves inclusive of the closing C', () => {
    expect(layout.bottomMidi).toBe(C4);
    expect(layout.topMidi).toBe(C4 + 24);
    expect(layout.keys).toHaveLength(25);
    expect(layout.whiteKeyCount).toBe(15);
  });

  it('lays white keys edge to edge across the full width', () => {
    const whites = layout.keys.filter((key) => !key.black);
    expect(whites).toHaveLength(15);
    expect(whites[0]?.left).toBeCloseTo(0, 10);
    const last = whites[whites.length - 1];
    expect((last?.left ?? 0) + (last?.width ?? 0)).toBeCloseTo(1, 10);
    for (let index = 1; index < whites.length; index += 1) {
      const previous = whites[index - 1];
      expect(whites[index]?.left).toBeCloseTo((previous?.left ?? 0) + (previous?.width ?? 0), 10);
    }
  });

  it('centres black keys on the boundary between their neighbours and keeps them narrower', () => {
    const whiteWidth = 1 / layout.whiteKeyCount;
    for (const key of layout.keys.filter((candidate) => candidate.black)) {
      expect(key.width).toBeLessThan(whiteWidth);
      const below = keyAt(layout, key.midi - 1);
      const above = keyAt(layout, key.midi + 1);
      expect((below?.left ?? 0) + (below?.width ?? 0)).toBeCloseTo(key.centerX, 10);
      expect(above?.left).toBeCloseTo(key.centerX, 10);
    }
  });

  it('keeps every key inside the drawing area and strictly ordered', () => {
    for (const key of layout.keys) {
      expect(key.left).toBeGreaterThanOrEqual(-1e-9);
      expect(key.left + key.width).toBeLessThanOrEqual(1 + 1e-9);
    }
    const centers = layout.keys.map((key) => key.centerX);
    expect([...centers].sort((a, b) => a - b)).toEqual(centers);
  });

  it('marks accidentals as black keys', () => {
    for (const key of layout.keys) {
      expect(key.black).toBe(isBlackKey(key.midi));
    }
  });
});

describe('pitchPosition', () => {
  const layout = createKeyboardLayout(C4);

  it('places a perfectly tuned pitch on its key centre', () => {
    for (const key of layout.keys) {
      const x = pitchPosition(layout, frequencyToMidi(midiToFrequency(key.midi)));
      expect(x).not.toBeNull();
      expect(x as number).toBeCloseTo(key.centerX, 9);
    }
  });

  it('places a pitch between two semitones between their centres', () => {
    const lower = keyAt(layout, C4);
    const upper = keyAt(layout, C4 + 1);
    const midpoint = pitchPosition(layout, C4 + 0.5) as number;
    expect(midpoint).toBeGreaterThan(lower?.centerX ?? 0);
    expect(midpoint).toBeLessThan(upper?.centerX ?? 1);
    expect(midpoint).toBeCloseTo(((lower?.centerX ?? 0) + (upper?.centerX ?? 0)) / 2, 9);
  });

  it('moves monotonically and continuously with pitch', () => {
    let previous = -1;
    for (let exact = layout.bottomMidi; exact <= layout.topMidi; exact += 0.05) {
      const x = pitchPosition(layout, exact) as number;
      expect(x).toBeGreaterThan(previous);
      previous = x;
    }
    expect(previous).toBeCloseTo(1 - 1 / layout.whiteKeyCount / 2, 6);
  });

  it('keeps a +15 cents reading nearer the key centre than the neighbouring boundary', () => {
    const key = keyAt(layout, 64); // E4
    const sharp = pitchPosition(layout, 64 + 15 / 100) as number;
    const halfStep = pitchPosition(layout, 64 + 0.5) as number;
    expect(Math.abs(sharp - (key?.centerX ?? 0))).toBeLessThan(Math.abs(halfStep - (key?.centerX ?? 0)));
  });

  it('drops pitches outside the visible viewport instead of clamping them', () => {
    expect(pitchPosition(layout, C4 - 0.01)).toBeNull();
    expect(pitchPosition(layout, layout.topMidi + 0.01)).toBeNull();
    expect(pitchPosition(layout, Number.NaN)).toBeNull();
  });
});
