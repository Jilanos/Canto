/**
 * Canvas palette. Kept in TypeScript because Canvas 2D needs literal colours, and
 * mirrored by the CSS custom properties in `src/styles/app.css` so the DOM chrome
 * and the trace read as one surface (item_005 visual direction).
 */
export const THEME = {
  surface: '#0d1117',
  columnWhite: 'rgba(255, 255, 255, 0.045)',
  columnBlack: 'rgba(0, 0, 0, 0.28)',
  gridLine: 'rgba(255, 255, 255, 0.10)',
  octaveLine: 'rgba(255, 255, 255, 0.22)',
  label: 'rgba(232, 240, 255, 0.55)',
  inTuneBand: 'rgba(90, 214, 168, 0.10)',
  inTuneBandEdge: 'rgba(90, 214, 168, 0.22)',
  traceInTune: '#5ad6a8',
  traceOff: '#8fb4ff',
  traceUncertain: 'rgba(143, 180, 255, 0.35)',
  presentLine: 'rgba(232, 240, 255, 0.35)',
  headNote: '#f2f6ff',
} as const;
