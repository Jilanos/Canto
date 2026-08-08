import { describe, expect, it } from 'vitest';
import {
  A4_FREQUENCY,
  RANGE_HIGH_MIDI,
  RANGE_LOW_MIDI,
  centsBetween,
  frequencyToMidi,
  frequencyToNote,
  isBlackKey,
  isInRange,
  midiToFrequency,
  noteLabel,
  rangeMidiNotes,
} from './notes';

describe('midi and frequency conversions', () => {
  it('anchors A4 to 440 Hz', () => {
    expect(midiToFrequency(69)).toBeCloseTo(A4_FREQUENCY, 10);
    expect(frequencyToMidi(A4_FREQUENCY)).toBeCloseTo(69, 10);
  });

  it('places the range bounds at C2 and C6', () => {
    expect(midiToFrequency(RANGE_LOW_MIDI)).toBeCloseTo(65.406, 3);
    expect(midiToFrequency(RANGE_HIGH_MIDI)).toBeCloseTo(1046.502, 3);
    expect(noteLabel(RANGE_LOW_MIDI)).toBe('C2');
    expect(noteLabel(RANGE_HIGH_MIDI)).toBe('C6');
  });

  it('round-trips every note of the analysed range', () => {
    for (const midi of rangeMidiNotes()) {
      expect(frequencyToMidi(midiToFrequency(midi))).toBeCloseTo(midi, 9);
    }
  });

  it('doubles frequency per octave', () => {
    expect(midiToFrequency(72) / midiToFrequency(60)).toBeCloseTo(2, 10);
  });
});

describe('frequencyToNote', () => {
  it('reports an exact note with no deviation', () => {
    const reading = frequencyToNote(A4_FREQUENCY);
    expect(reading).not.toBeNull();
    expect(reading?.name).toBe('A');
    expect(reading?.octave).toBe(4);
    expect(reading?.midi).toBe(69);
    expect(reading?.cents).toBeCloseTo(0, 9);
  });

  it('reports a sharp reading as positive cents on the lower note', () => {
    const reading = frequencyToNote(midiToFrequency(60) * 2 ** (20 / 1200));
    expect(reading?.midi).toBe(60);
    expect(reading?.cents).toBeCloseTo(20, 6);
  });

  it('reports a flat reading as negative cents on the upper note', () => {
    const reading = frequencyToNote(midiToFrequency(60) * 2 ** (-20 / 1200));
    expect(reading?.midi).toBe(60);
    expect(reading?.cents).toBeCloseTo(-20, 6);
  });

  it('snaps to the closer neighbour past the midpoint', () => {
    const reading = frequencyToNote(midiToFrequency(60) * 2 ** (60 / 1200));
    expect(reading?.midi).toBe(61);
    expect(reading?.cents).toBeCloseTo(-40, 6);
  });

  it('keeps cents within half a semitone across the range', () => {
    for (const midi of rangeMidiNotes()) {
      for (const offset of [-49, -15, 0, 15, 49]) {
        const reading = frequencyToNote(midiToFrequency(midi) * 2 ** (offset / 1200));
        expect(reading?.midi).toBe(midi);
        expect(Math.abs(reading?.cents ?? 100)).toBeLessThanOrEqual(50);
      }
    }
  });

  it('refuses silence and invalid frequencies rather than inventing a note', () => {
    expect(frequencyToNote(0)).toBeNull();
    expect(frequencyToNote(-100)).toBeNull();
    expect(frequencyToNote(Number.NaN)).toBeNull();
    expect(frequencyToNote(Number.POSITIVE_INFINITY)).toBeNull();
  });
});

describe('helpers', () => {
  it('identifies black keys by pitch class', () => {
    const blackLabels = rangeMidiNotes().filter(isBlackKey).map(noteLabel);
    expect(blackLabels.slice(0, 5)).toEqual(['C#2', 'D#2', 'F#2', 'G#2', 'A#2']);
    expect(blackLabels.every((label) => label.includes('#'))).toBe(true);
    expect(rangeMidiNotes().filter((midi) => !isBlackKey(midi)).map(noteLabel).every((label) => !label.includes('#'))).toBe(true);
  });

  it('measures cents between two frequencies', () => {
    expect(centsBetween(A4_FREQUENCY * 2, A4_FREQUENCY)).toBeCloseTo(1200, 9);
    expect(centsBetween(A4_FREQUENCY, A4_FREQUENCY * 2)).toBeCloseTo(-1200, 9);
    expect(centsBetween(A4_FREQUENCY, A4_FREQUENCY)).toBeCloseTo(0, 9);
  });

  it('bounds the analysed range', () => {
    expect(isInRange(RANGE_LOW_MIDI)).toBe(true);
    expect(isInRange(RANGE_HIGH_MIDI)).toBe(true);
    expect(isInRange(RANGE_LOW_MIDI - 1)).toBe(false);
    expect(isInRange(RANGE_HIGH_MIDI + 1)).toBe(false);
    expect(rangeMidiNotes()).toHaveLength(RANGE_HIGH_MIDI - RANGE_LOW_MIDI + 1);
  });
});
