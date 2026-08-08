/**
 * Vertical height budget (item_006).
 *
 * The whole practice screen must fit the viewport: the trace, the keyboard and the
 * detected-note readout are useless apart, so none of them may be pushed below the
 * fold. CSS alone cannot guarantee that — the surrounding chrome grows with the
 * copy it contains — so the allocation is computed here from measured heights and
 * applied as CSS custom properties.
 *
 * Pure and DOM-free, so the invariants are unit tested instead of eyeballed.
 */

export interface HeightBudgetInput {
  /** Usable viewport height in CSS pixels. */
  viewportHeight: number;
  /** Measured height of everything that is not the trace or the keyboard. */
  chromeHeight: number;
  /** Height the chrome falls back to once secondary blocks are collapsed. */
  compactChromeHeight?: number;
}

export interface HeightBudget {
  piano: number;
  trace: number;
  /** True when secondary blocks must collapse for the essentials to fit. */
  compact: boolean;
  /**
   * True when even the minimums do not fit. The layout then keeps the minimums —
   * the page may scroll — because a keyboard too small to play is worse than a
   * scrollbar.
   */
  overflowing: boolean;
}

/** A keyboard below this is not playable with a finger. */
export const MIN_PIANO_HEIGHT = 76;

/** Below this the eight-second window is too squashed to read. */
export const MIN_TRACE_HEIGHT = 120;

/** Comfortable keyboard height when there is room for it. */
export const MAX_PIANO_HEIGHT = 168;

/**
 * Height the collapsed chrome must stay within. Derived from the shortest supported
 * viewport, 320 px in landscape, minus the two minimums above; the stylesheet is
 * held to it by `height-budget.test.ts`.
 */
export const COMPACT_CHROME_BUDGET = 320 - MIN_PIANO_HEIGHT - MIN_TRACE_HEIGHT;

/** Share of the viewport the keyboard aims for before clamping. */
const PIANO_VIEWPORT_SHARE = 0.24;

/**
 * Splits the viewport between the keyboard and the trace.
 *
 * The keyboard is served first up to its preferred height, the trace takes the
 * rest, and both are squeezed towards their minimums before anything is allowed to
 * overflow. When the essentials still do not fit, `compact` asks the caller to
 * collapse secondary chrome and re-measure.
 */
export function allocateHeights(input: HeightBudgetInput): HeightBudget {
  const viewport = Math.max(0, input.viewportHeight);
  const chrome = Math.max(0, input.chromeHeight);
  const compactChrome = Math.max(0, Math.min(input.compactChromeHeight ?? chrome, chrome));

  const full = split(viewport - chrome);
  if (!full.overflowing) return { ...full, compact: false };

  // Not enough room as laid out: retry against the collapsed chrome height.
  const compacted = split(viewport - compactChrome);
  return { ...compacted, compact: true };
}

function split(available: number): Omit<HeightBudget, 'compact'> {
  const preferredPiano = clamp(available * PIANO_VIEWPORT_SHARE, MIN_PIANO_HEIGHT, MAX_PIANO_HEIGHT);

  if (available >= preferredPiano + MIN_TRACE_HEIGHT) {
    const piano = preferredPiano;
    return { piano, trace: available - piano, overflowing: false };
  }

  if (available >= MIN_PIANO_HEIGHT + MIN_TRACE_HEIGHT) {
    // Give the trace its minimum and hand the remainder to the keyboard.
    const trace = MIN_TRACE_HEIGHT;
    return { piano: available - trace, trace, overflowing: false };
  }

  return { piano: MIN_PIANO_HEIGHT, trace: MIN_TRACE_HEIGHT, overflowing: true };
}

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}
