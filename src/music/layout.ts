/**
 * Single source of truth for horizontal note geometry.
 *
 * The DOM keyboard and the Canvas trace both derive their x positions from this
 * module, which is what keeps the trace aligned with the keys (item_004 AC1, AC7)
 * regardless of viewport width. All geometry is normalised to 0..1 so the same
 * layout survives resizes without recomputation.
 */

import { RANGE_HIGH_MIDI, RANGE_LOW_MIDI, isBlackKey, noteLabel } from './notes';

/** Two octaves stay visible at once (item_004 AC7). */
export const VISIBLE_OCTAVES = 2;

/** A black key is narrower than a white one; ratio of the white key width. */
const BLACK_KEY_WIDTH_RATIO = 0.62;

export interface KeyGeometry {
  midi: number;
  label: string;
  black: boolean;
  /** Normalised centre of the key, matching where a perfectly tuned pitch lands. */
  centerX: number;
  /** Normalised left edge and width of the drawn key. */
  left: number;
  width: number;
}

export interface KeyboardLayout {
  bottomMidi: number;
  /** Highest key of the viewport, inclusive. */
  topMidi: number;
  whiteKeyCount: number;
  keys: KeyGeometry[];
}

/** Bottom notes the octave control can select while staying inside C2..C6. */
export function availableBottomNotes(): number[] {
  const notes: number[] = [];
  for (let midi = RANGE_LOW_MIDI; midi + VISIBLE_OCTAVES * 12 <= RANGE_HIGH_MIDI; midi += 12) {
    notes.push(midi);
  }
  return notes;
}

export function clampBottomMidi(bottomMidi: number): number {
  const options = availableBottomNotes();
  const lowest = options[0] as number;
  const highest = options[options.length - 1] as number;
  if (bottomMidi <= lowest) return lowest;
  if (bottomMidi >= highest) return highest;
  // Snap to the nearest selectable C.
  const steps = Math.round((bottomMidi - lowest) / 12);
  return lowest + steps * 12;
}

/**
 * Builds the geometry of a viewport spanning `VISIBLE_OCTAVES` octaves starting at
 * `bottomMidi`, inclusive of the closing C so both octave boundaries are visible.
 */
export function createKeyboardLayout(bottomMidi: number): KeyboardLayout {
  const bottom = clampBottomMidi(bottomMidi);
  const top = bottom + VISIBLE_OCTAVES * 12;
  const whiteKeyCount = VISIBLE_OCTAVES * 7 + 1;
  const whiteWidth = 1 / whiteKeyCount;

  const keys: KeyGeometry[] = [];
  let whiteIndex = 0;
  for (let midi = bottom; midi <= top; midi += 1) {
    if (isBlackKey(midi)) {
      // Centre the black key on the boundary between the two whites around it.
      const centerX = whiteIndex * whiteWidth;
      const width = whiteWidth * BLACK_KEY_WIDTH_RATIO;
      keys.push({ midi, label: noteLabel(midi), black: true, centerX, left: centerX - width / 2, width });
    } else {
      const left = whiteIndex * whiteWidth;
      keys.push({
        midi,
        label: noteLabel(midi),
        black: false,
        centerX: left + whiteWidth / 2,
        left,
        width: whiteWidth,
      });
      whiteIndex += 1;
    }
  }

  return { bottomMidi: bottom, topMidi: top, whiteKeyCount, keys };
}

/**
 * Normalised horizontal position of a fractional MIDI pitch.
 *
 * A pitch sitting exactly on a note lands on that key's centre; a pitch between
 * two semitones is interpolated between their centres so the trace stays
 * continuous through the cents deviation (item_004 AC1, AC2). Returns `null`
 * outside the visible viewport so callers can drop rather than clamp the sample.
 */
export function pitchPosition(layout: KeyboardLayout, exactMidi: number): number | null {
  if (!Number.isFinite(exactMidi)) return null;
  if (exactMidi < layout.bottomMidi || exactMidi > layout.topMidi) return null;

  const lower = Math.floor(exactMidi);
  const fraction = exactMidi - lower;
  const lowerCenter = centerOf(layout, lower);
  if (lowerCenter === null) return null;
  if (fraction === 0) return lowerCenter;
  const upperCenter = centerOf(layout, lower + 1);
  if (upperCenter === null) return lowerCenter;
  return lowerCenter + (upperCenter - lowerCenter) * fraction;
}

export function centerOf(layout: KeyboardLayout, midi: number): number | null {
  const key = layout.keys.find((candidate) => candidate.midi === midi);
  return key ? key.centerX : null;
}

export function keyAt(layout: KeyboardLayout, midi: number): KeyGeometry | undefined {
  return layout.keys.find((key) => key.midi === midi);
}
