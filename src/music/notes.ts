/**
 * Musical primitives shared by the instrument engine, the pitch pipeline and the
 * renderer (ADR 001). Everything here is pure and tuned to A4 = 440 Hz, which the
 * MVP fixes; the reference is a parameter so a future tuning setting stays cheap.
 */

export const A4_MIDI = 69;
export const A4_FREQUENCY = 440;

/** Lowest and highest analysed / playable notes: C2 to C6 (request AC5). */
export const RANGE_LOW_MIDI = 36; // C2
export const RANGE_HIGH_MIDI = 84; // C6

/** Half a semitone, in cents: the widest possible distance to a note centre. */
export const MAX_CENTS_OFFSET = 50;

/** Tolerance of the "in tune" band around a note centre (item_004 AC2). */
export const IN_TUNE_CENTS = 15;

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

export type NoteName = (typeof NOTE_NAMES)[number];

/** Pitch classes that are drawn as black keys. */
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

export interface NoteReading {
  /** Nearest tempered note as a MIDI number. */
  midi: number;
  name: NoteName;
  /** Scientific pitch notation octave, so MIDI 60 is C4. */
  octave: number;
  /** Signed distance to that note centre, in cents, within [-50, 50). */
  cents: number;
  /** Fractional MIDI position of the incoming frequency. */
  exactMidi: number;
}

export function midiToFrequency(midi: number, reference = A4_FREQUENCY): number {
  return reference * 2 ** ((midi - A4_MIDI) / 12);
}

export function frequencyToMidi(frequency: number, reference = A4_FREQUENCY): number {
  return A4_MIDI + 12 * Math.log2(frequency / reference);
}

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(pitchClass(midi));
}

export function pitchClass(midi: number): number {
  return ((midi % 12) + 12) % 12;
}

export function noteName(midi: number): NoteName {
  return NOTE_NAMES[pitchClass(midi)] as NoteName;
}

export function noteOctave(midi: number): number {
  return Math.floor(midi / 12) - 1;
}

/** Human-readable label such as `C#4`, used for key labels and screen readers. */
export function noteLabel(midi: number): string {
  return `${noteName(midi)}${noteOctave(midi)}`;
}

/**
 * Converts a frequency to the nearest tempered note plus its cents deviation.
 * Returns `null` for non-finite or non-positive input so callers never publish a
 * note for a frequency the detector could not establish.
 */
export function frequencyToNote(frequency: number, reference = A4_FREQUENCY): NoteReading | null {
  if (!Number.isFinite(frequency) || frequency <= 0) return null;
  const exactMidi = frequencyToMidi(frequency, reference);
  const midi = Math.round(exactMidi);
  return {
    midi,
    name: noteName(midi),
    octave: noteOctave(midi),
    cents: (exactMidi - midi) * 100,
    exactMidi,
  };
}

/** Signed cents between two frequencies; positive means `frequency` is higher. */
export function centsBetween(frequency: number, referenceFrequency: number): number {
  return 1200 * Math.log2(frequency / referenceFrequency);
}

export function isInRange(midi: number): boolean {
  return midi >= RANGE_LOW_MIDI && midi <= RANGE_HIGH_MIDI;
}

/** Every MIDI note of the analysed range, low to high. */
export function rangeMidiNotes(): number[] {
  const notes: number[] = [];
  for (let midi = RANGE_LOW_MIDI; midi <= RANGE_HIGH_MIDI; midi += 1) notes.push(midi);
  return notes;
}
