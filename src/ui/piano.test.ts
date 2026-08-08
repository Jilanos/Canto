// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createKeyboardLayout } from '../music/layout';
import { noteLabel } from '../music/notes';
import { PianoKeyboard, describeRange } from './piano';

const C3 = 48;

interface Recorder {
  on: number[];
  off: number[];
  handlers: { onNoteOn: (midi: number) => void; onNoteOff: (midi: number) => void };
}

function recorder(): Recorder {
  const on: number[] = [];
  const off: number[] = [];
  return { on, off, handlers: { onNoteOn: (midi) => on.push(midi), onNoteOff: (midi) => off.push(midi) } };
}

function pointerEvent(type: string, pointerId = 1): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'pointerId', { value: pointerId });
  return event;
}

function keyEvent(type: string, key: string, extra: Partial<KeyboardEventInit> = {}): KeyboardEvent {
  return new KeyboardEvent(type, { key, bubbles: true, cancelable: true, ...extra });
}

function mount(): { root: HTMLElement; piano: PianoKeyboard; log: Recorder } {
  const root = document.createElement('div');
  document.body.append(root);
  const log = recorder();
  const piano = new PianoKeyboard(root, createKeyboardLayout(C3), log.handlers);
  return { root, piano, log };
}

function keyButton(root: HTMLElement, midi: number): HTMLButtonElement {
  const button = root.querySelector<HTMLButtonElement>(`[data-midi="${midi}"]`);
  if (!button) throw new Error(`no key for midi ${midi}`);
  return button;
}

beforeEach(() => {
  document.body.replaceChildren();
});

describe('rendering', () => {
  it('renders all 25 keys of the viewport in pitch order with accessible labels', () => {
    const { root, piano } = mount();
    const buttons = [...root.querySelectorAll<HTMLButtonElement>('.piano__key')];
    expect(buttons).toHaveLength(25);
    expect(buttons.map((button) => Number(button.dataset.midi))).toEqual(
      Array.from({ length: 25 }, (_, index) => C3 + index),
    );
    expect(buttons[0]?.getAttribute('aria-label')).toBe(`Play ${noteLabel(C3)}`);
    expect(root.getAttribute('aria-label')).toBe('Piano keyboard');
    piano.destroy();
  });

  it('labels white keys visually and marks black keys with their own class', () => {
    const { root, piano } = mount();
    expect(keyButton(root, C3).querySelector('.piano__label')?.textContent).toBe('C3');
    expect(keyButton(root, C3 + 1).className).toContain('piano__key--black');
    expect(keyButton(root, C3 + 1).querySelector('.piano__label')).toBeNull();
    piano.destroy();
  });

  it('describes the visible range', () => {
    expect(describeRange(createKeyboardLayout(C3))).toBe('C3 to C5');
  });
});

describe('pointer input', () => {
  it('plays on pointerdown and releases on pointerup', () => {
    const { root, piano, log } = mount();
    keyButton(root, C3).dispatchEvent(pointerEvent('pointerdown'));
    expect(log.on).toEqual([C3]);
    window.dispatchEvent(pointerEvent('pointerup'));
    expect(log.off).toEqual([C3]);
    piano.destroy();
  });

  it('releases the note when the pointer is cancelled away from the key', () => {
    const { root, piano, log } = mount();
    keyButton(root, C3 + 4).dispatchEvent(pointerEvent('pointerdown'));
    window.dispatchEvent(pointerEvent('pointercancel'));
    expect(log.off).toEqual([C3 + 4]);
    piano.destroy();
  });

  it('keeps multi-touch notes independent', () => {
    const { root, piano, log } = mount();
    keyButton(root, C3).dispatchEvent(pointerEvent('pointerdown', 1));
    keyButton(root, C3 + 7).dispatchEvent(pointerEvent('pointerdown', 2));
    window.dispatchEvent(pointerEvent('pointerup', 1));
    expect(log.on).toEqual([C3, C3 + 7]);
    expect(log.off).toEqual([C3]);
    window.dispatchEvent(pointerEvent('pointerup', 2));
    expect(log.off).toEqual([C3, C3 + 7]);
    piano.destroy();
  });
});

describe('physical keyboard input', () => {
  it('maps the documented keys to the visible octave', () => {
    const { piano, log } = mount();
    window.dispatchEvent(keyEvent('keydown', 'a'));
    window.dispatchEvent(keyEvent('keydown', 'w'));
    window.dispatchEvent(keyEvent('keydown', 'k'));
    expect(log.on).toEqual([C3, C3 + 1, C3 + 12]);
    window.dispatchEvent(keyEvent('keyup', 'a'));
    window.dispatchEvent(keyEvent('keyup', 'w'));
    window.dispatchEvent(keyEvent('keyup', 'k'));
    expect(log.off).toEqual([C3, C3 + 1, C3 + 12]);
    piano.destroy();
  });

  it('ignores auto-repeat so a held key does not retrigger', () => {
    const { piano, log } = mount();
    window.dispatchEvent(keyEvent('keydown', 'a'));
    window.dispatchEvent(keyEvent('keydown', 'a', { repeat: true }));
    expect(log.on).toEqual([C3]);
    piano.destroy();
  });

  it('ignores shortcuts and unmapped keys', () => {
    const { piano, log } = mount();
    window.dispatchEvent(keyEvent('keydown', 'a', { ctrlKey: true }));
    window.dispatchEvent(keyEvent('keydown', 'q'));
    expect(log.on).toEqual([]);
    piano.destroy();
  });

  it('ignores keys typed into a form control', () => {
    const { piano, log } = mount();
    const input = document.createElement('input');
    document.body.append(input);
    input.dispatchEvent(keyEvent('keydown', 'a'));
    expect(log.on).toEqual([]);
    piano.destroy();
  });
});

describe('no stuck notes', () => {
  it('releases held notes when the window loses focus', () => {
    const { root, piano, log } = mount();
    keyButton(root, C3).dispatchEvent(pointerEvent('pointerdown'));
    window.dispatchEvent(keyEvent('keydown', 'd'));
    window.dispatchEvent(new Event('blur'));
    expect(log.off.sort()).toEqual([C3, C3 + 4].sort());
    piano.destroy();
  });

  it('releases held notes when the document becomes hidden', () => {
    const { piano, log } = mount();
    window.dispatchEvent(keyEvent('keydown', 'a'));
    const hidden = vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    document.dispatchEvent(new Event('visibilitychange'));
    expect(log.off).toEqual([C3]);
    hidden.mockRestore();
    piano.destroy();
  });

  it('releases held notes when the octave changes', () => {
    const { piano, log } = mount();
    window.dispatchEvent(keyEvent('keydown', 'a'));
    const layout = piano.setBottomMidi(C3 + 12);
    expect(log.off).toEqual([C3]);
    expect(layout.bottomMidi).toBe(C3 + 12);
    piano.destroy();
  });

  it('releases everything on destroy', () => {
    const { root, piano, log } = mount();
    keyButton(root, C3 + 2).dispatchEvent(pointerEvent('pointerdown'));
    piano.destroy();
    expect(log.off).toEqual([C3 + 2]);
    expect(root.children).toHaveLength(0);
  });

  it('stops responding to input after destroy', () => {
    const { piano, log } = mount();
    piano.destroy();
    window.dispatchEvent(keyEvent('keydown', 'a'));
    expect(log.on).toEqual([]);
  });
});

describe('active note feedback', () => {
  it('marks sounding keys as pressed and clears the rest', () => {
    const { root, piano } = mount();
    piano.setActiveNotes([C3, C3 + 4]);
    expect(keyButton(root, C3).getAttribute('aria-pressed')).toBe('true');
    expect(keyButton(root, C3).className).toContain('piano__key--active');
    expect(keyButton(root, C3 + 1).getAttribute('aria-pressed')).toBe('false');
    piano.setActiveNotes([]);
    expect(keyButton(root, C3).getAttribute('aria-pressed')).toBe('false');
    piano.destroy();
  });
});
