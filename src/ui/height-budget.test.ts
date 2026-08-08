import { describe, expect, it } from 'vitest';
import {
  COMPACT_CHROME_BUDGET,
  MAX_PIANO_HEIGHT,
  MIN_PIANO_HEIGHT,
  MIN_TRACE_HEIGHT,
  allocateHeights,
  type HeightBudgetInput,
} from './height-budget';

/** Shortest viewport the layout promises to serve without scrolling. */
const SHORTEST_SUPPORTED_VIEWPORT = 320;

/**
 * Viewports the MVP targets, as CSS pixels. `compactChromeHeight` is the budget the
 * stylesheet must hold itself to once secondary blocks collapse; the tightest case
 * — a 320 px landscape phone — is what sets `COMPACT_CHROME_BUDGET`.
 */
const VIEWPORTS = [
  { name: 'phone landscape', viewportHeight: 360, chromeHeight: 300, compactChromeHeight: 120 },
  { name: 'small phone landscape', viewportHeight: 320, chromeHeight: 290, compactChromeHeight: 110 },
  { name: 'phone portrait', viewportHeight: 640, chromeHeight: 360, compactChromeHeight: 220 },
  { name: 'tablet portrait', viewportHeight: 1024, chromeHeight: 340, compactChromeHeight: 220 },
  { name: 'laptop', viewportHeight: 800, chromeHeight: 320, compactChromeHeight: 220 },
  { name: 'desktop', viewportHeight: 1080, chromeHeight: 320, compactChromeHeight: 220 },
] satisfies (HeightBudgetInput & { name: string })[];

describe('allocateHeights on target viewports', () => {
  it('keeps the keyboard and the trace playable everywhere', () => {
    for (const viewport of VIEWPORTS) {
      const budget = allocateHeights(viewport);
      expect(budget.piano, viewport.name).toBeGreaterThanOrEqual(MIN_PIANO_HEIGHT);
      expect(budget.trace, viewport.name).toBeGreaterThanOrEqual(MIN_TRACE_HEIGHT);
      expect(budget.overflowing, viewport.name).toBe(false);
    }
  });

  it('never allocates more than the viewport holds', () => {
    for (const viewport of VIEWPORTS) {
      const budget = allocateHeights(viewport);
      const chrome = budget.compact ? (viewport.compactChromeHeight ?? viewport.chromeHeight) : viewport.chromeHeight;
      expect(chrome + budget.piano + budget.trace, viewport.name).toBeLessThanOrEqual(viewport.viewportHeight + 0.5);
    }
  });

  it('holds the compact chrome budget the stylesheet must respect', () => {
    // If this fails, either the stylesheet grew or the promise of a scroll-free
    // 320 px landscape phone has to be dropped deliberately.
    expect(COMPACT_CHROME_BUDGET + MIN_PIANO_HEIGHT + MIN_TRACE_HEIGHT).toBeLessThanOrEqual(
      SHORTEST_SUPPORTED_VIEWPORT,
    );
  });

  it('collapses secondary chrome only when the essentials do not otherwise fit', () => {
    const roomy = allocateHeights({ viewportHeight: 1080, chromeHeight: 320, compactChromeHeight: 220 });
    expect(roomy.compact).toBe(false);

    const cramped = allocateHeights({ viewportHeight: 360, chromeHeight: 300, compactChromeHeight: 150 });
    expect(cramped.compact).toBe(true);
  });
});

describe('allocateHeights sharing rules', () => {
  it('caps the keyboard so a tall screen grows the trace, not the keys', () => {
    const budget = allocateHeights({ viewportHeight: 2000, chromeHeight: 300 });
    expect(budget.piano).toBe(MAX_PIANO_HEIGHT);
    expect(budget.trace).toBe(2000 - 300 - MAX_PIANO_HEIGHT);
  });

  it('gives the trace its minimum before shrinking the keyboard below its preference', () => {
    const budget = allocateHeights({ viewportHeight: 400, chromeHeight: 180 });
    expect(budget.trace).toBeGreaterThanOrEqual(MIN_TRACE_HEIGHT);
    expect(budget.piano).toBeGreaterThanOrEqual(MIN_PIANO_HEIGHT);
    expect(budget.piano + budget.trace).toBeCloseTo(220, 6);
  });

  it('grows the trace monotonically with the viewport', () => {
    let previous = -1;
    for (let height = 400; height <= 1200; height += 20) {
      const budget = allocateHeights({ viewportHeight: height, chromeHeight: 260 });
      expect(budget.trace).toBeGreaterThanOrEqual(previous);
      previous = budget.trace;
    }
  });

  it('keeps the minimums and reports overflow when nothing fits', () => {
    const budget = allocateHeights({ viewportHeight: 200, chromeHeight: 180, compactChromeHeight: 170 });
    expect(budget.overflowing).toBe(true);
    expect(budget.piano).toBe(MIN_PIANO_HEIGHT);
    expect(budget.trace).toBe(MIN_TRACE_HEIGHT);
  });

  it('tolerates degenerate input without producing negative heights', () => {
    for (const input of [
      { viewportHeight: 0, chromeHeight: 0 },
      { viewportHeight: -100, chromeHeight: -50 },
      { viewportHeight: 500, chromeHeight: 900 },
    ]) {
      const budget = allocateHeights(input);
      expect(budget.piano).toBeGreaterThanOrEqual(MIN_PIANO_HEIGHT);
      expect(budget.trace).toBeGreaterThanOrEqual(MIN_TRACE_HEIGHT);
    }
  });

  it('ignores a compact chrome height larger than the measured one', () => {
    const budget = allocateHeights({ viewportHeight: 360, chromeHeight: 200, compactChromeHeight: 900 });
    expect(budget.piano).toBeGreaterThanOrEqual(MIN_PIANO_HEIGHT);
    expect(budget.trace).toBeGreaterThanOrEqual(MIN_TRACE_HEIGHT);
  });
});
