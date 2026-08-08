/**
 * Visual piano keyboard (item_002).
 *
 * Geometry comes from `music/layout`, so the keys sit exactly under the columns of
 * the trace. Pointer, touch and physical-keyboard input all funnel into the same
 * note-on / note-off pair, and every path that can lose an input event releases the
 * held notes, which is what prevents stuck notes (item_002 AC3).
 */

import { type KeyboardLayout, createKeyboardLayout } from '../music/layout';
import { noteLabel } from '../music/notes';
import { t } from '../i18n';

/**
 * Physical keyboard map, relative to the bottom note of the viewport. The lower row
 * covers the first octave chromatically; the upper row adds the white keys of the
 * second one. Documented for the user in `piano.keyboardHint`.
 */
const KEY_MAP: Record<string, number> = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12,
  z: 12, x: 14, c: 16, v: 17, b: 19, n: 21, m: 23,
};

/** How long a note sounds when a key is triggered by Enter or Space. */
const TAP_DURATION_MS = 400;

export interface PianoHandlers {
  onNoteOn(midi: number): void;
  onNoteOff(midi: number): void;
}

export class PianoKeyboard {
  private readonly root: HTMLElement;
  private readonly handlers: PianoHandlers;
  private layout: KeyboardLayout;
  private readonly buttons = new Map<number, HTMLButtonElement>();
  /** Notes held per input source, so releasing one source cannot cut another. */
  private readonly pointerNotes = new Map<number, number>();
  private readonly keyboardNotes = new Map<string, number>();
  private readonly tapTimers = new Map<number, number>();

  constructor(root: HTMLElement, layout: KeyboardLayout, handlers: PianoHandlers) {
    this.root = root;
    this.handlers = handlers;
    this.layout = layout;
    this.root.classList.add('piano');
    this.root.setAttribute('role', 'group');
    this.root.setAttribute('aria-label', t('piano.label'));
    this.render();

    window.addEventListener('pointerup', this.handleWindowPointerUp);
    window.addEventListener('pointercancel', this.handleWindowPointerUp);
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
    window.addEventListener('blur', this.releaseAll);
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  get visibleLayout(): KeyboardLayout {
    return this.layout;
  }

  setBottomMidi(bottomMidi: number): KeyboardLayout {
    this.releaseAll();
    this.layout = createKeyboardLayout(bottomMidi);
    this.render();
    return this.layout;
  }

  /** Highlights the notes currently sounding, whatever triggered them. */
  setActiveNotes(midiNotes: readonly number[]): void {
    const active = new Set(midiNotes);
    for (const [midi, button] of this.buttons) {
      const isActive = active.has(midi);
      button.classList.toggle('piano__key--active', isActive);
      button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    }
  }

  destroy(): void {
    this.releaseAll();
    window.removeEventListener('pointerup', this.handleWindowPointerUp);
    window.removeEventListener('pointercancel', this.handleWindowPointerUp);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
    window.removeEventListener('blur', this.releaseAll);
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    this.root.replaceChildren();
  }

  private render(): void {
    this.buttons.clear();
    const fragment = document.createDocumentFragment();

    // DOM order follows pitch so tab order matches the keyboard; black keys stack
    // above the whites through their z-index, not through paint order.
    for (const key of this.layout.keys) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `piano__key piano__key--${key.black ? 'black' : 'white'}`;
      button.style.left = `${key.left * 100}%`;
      button.style.width = `${key.width * 100}%`;
      button.dataset.midi = String(key.midi);
      button.setAttribute('aria-label', t('piano.keyLabel', { note: key.label }));
      button.setAttribute('aria-pressed', 'false');
      if (!key.black) {
        const label = document.createElement('span');
        label.className = 'piano__label';
        label.textContent = key.label;
        label.setAttribute('aria-hidden', 'true');
        button.append(label);
      }
      button.addEventListener('pointerdown', this.handlePointerDown);
      button.addEventListener('click', this.handleClick);
      button.addEventListener('contextmenu', (event) => event.preventDefault());
      fragment.append(button);
      this.buttons.set(key.midi, button);
    }

    this.root.replaceChildren(fragment);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    const button = event.currentTarget as HTMLButtonElement;
    const midi = Number(button.dataset.midi);
    if (!Number.isFinite(midi)) return;
    event.preventDefault(); // Stops touch scrolling and synthetic mouse events.
    button.setPointerCapture?.(event.pointerId);
    this.pointerNotes.set(event.pointerId, midi);
    this.handlers.onNoteOn(midi);
  };

  private readonly handleWindowPointerUp = (event: PointerEvent): void => {
    const midi = this.pointerNotes.get(event.pointerId);
    if (midi === undefined) return;
    this.pointerNotes.delete(event.pointerId);
    this.handlers.onNoteOff(midi);
  };

  /** Keyboard activation of a focused key: play a short note (item_002 AC4). */
  private readonly handleClick = (event: MouseEvent): void => {
    if (event.detail !== 0) return; // Pointer input is already handled.
    const midi = Number((event.currentTarget as HTMLButtonElement).dataset.midi);
    if (!Number.isFinite(midi)) return;
    const existing = this.tapTimers.get(midi);
    if (existing) window.clearTimeout(existing);
    else this.handlers.onNoteOn(midi);
    this.tapTimers.set(
      midi,
      window.setTimeout(() => {
        this.tapTimers.delete(midi);
        this.handlers.onNoteOff(midi);
      }, TAP_DURATION_MS),
    );
  };

  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (isTextEntry(event.target)) return;
    const offset = KEY_MAP[event.key.toLowerCase()];
    if (offset === undefined) return;
    const midi = this.layout.bottomMidi + offset;
    if (!this.buttons.has(midi)) return;
    event.preventDefault();
    if (this.keyboardNotes.has(event.key.toLowerCase())) return;
    this.keyboardNotes.set(event.key.toLowerCase(), midi);
    this.handlers.onNoteOn(midi);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const key = event.key.toLowerCase();
    const midi = this.keyboardNotes.get(key);
    if (midi === undefined) return;
    this.keyboardNotes.delete(key);
    this.handlers.onNoteOff(midi);
  };

  private readonly handleVisibilityChange = (): void => {
    if (document.hidden) this.releaseAll();
  };

  /** Releases every held note from every input source. */
  private readonly releaseAll = (): void => {
    for (const midi of this.pointerNotes.values()) this.handlers.onNoteOff(midi);
    this.pointerNotes.clear();
    for (const midi of this.keyboardNotes.values()) this.handlers.onNoteOff(midi);
    this.keyboardNotes.clear();
    for (const [midi, timer] of this.tapTimers) {
      window.clearTimeout(timer);
      this.handlers.onNoteOff(midi);
    }
    this.tapTimers.clear();
  };
}

function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase());
}

/** Human-readable description of the visible range, for the range readout. */
export function describeRange(layout: KeyboardLayout): string {
  return t('piano.rangeValue', { low: noteLabel(layout.bottomMidi), high: noteLabel(layout.topMidi) });
}
