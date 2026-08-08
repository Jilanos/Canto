# Canto

Local-first practice tool for singing in tune. Play a reference note on a visual
piano, sing, and watch your pitch land on the same note columns as the keys.

Everything — instruments, microphone analysis, rendering — runs in the browser.
No account, no backend, no audio leaves the device.

Workflow docs live under `logics/`; start with `logics/INDEX.md`.

## Requirements

- Node 20 or newer (developed on Node 24)
- A browser from the MVP matrix: Chrome on Android, Firefox desktop, Firefox Android

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install the toolchain (Vite, TypeScript, Vitest, jsdom) |
| `npm run icons` | Generate the placeholder PWA icons into `public/icons/` |
| `npm run dev` | Dev server on `http://localhost:5173` (localhost is a secure context, so the microphone works) |
| `npm test` | Unit tests: music conversions, pitch engine, trace buffer, preferences, UI states |
| `npm run build` | Icons, typecheck, then the static bundle in `dist/` |
| `npm run preview` | Serve `dist/` locally to exercise the installed/offline behaviour |

The service worker is only registered in a production build, so `npm run dev`
never serves stale modules. To test offline behaviour use `npm run build && npm run preview`.

## Deployment

`npm run build` produces a purely static `dist/` intended for the **root** of
`https://canto.paulmondou.fr` (`base: '/'` in `vite.config.ts`). Publish the
contents of `dist/` at the domain root and make sure the host:

- serves over HTTPS (required for microphone capture and installation);
- serves `manifest.webmanifest` as `application/manifest+json` and `sw.js` as
  `text/javascript` from the root scope;
- falls back to `/index.html` for unknown paths;
- does **not** cache `sw.js` long-term, so cache updates can roll out.

No server-side runtime, environment variable or API key is involved.

## How it works

```
microphone ─▶ AnalyserNode ─▶ YIN estimator ─▶ pitch tracker ─▶ trace renderer
piano keys ─▶ instrument engine ─▶ audio output
```

| Module | Responsibility |
| --- | --- |
| `src/music/notes.ts` | Note ↔ frequency ↔ cents primitives, A4 = 440 Hz, range C2–C6 |
| `src/music/layout.ts` | Shared horizontal geometry: the one place that decides where a pitch sits |
| `src/pitch/yin.ts` | Pure fundamental-frequency estimation with a clarity score |
| `src/pitch/tracker.ts` | Silence / weak / unstable / tracking decision and the normalised sample stream |
| `src/audio/instruments.ts` | Polyphonic synthesis of Studio Grand, Soft Piano and Warm Organ |
| `src/audio/microphone.ts` | Consent, capture, per-frame analysis, teardown of media tracks |
| `src/render/trace-renderer.ts` | Canvas 2D note-time trace, eight-second window |
| `src/ui/`, `src/app.ts` | Single-screen layout, controls, state machine |
| `src/state/preferences.ts` | The only persistence: instrument, volume, mute, visible octave |

The renderer consumes the normalised pitch stream, never the detector, so the
estimator can be swapped or compared without touching the UI (ADR 001).

### Controls

- **Mouse / touch**: press a key; multi-touch plays chords.
- **Computer keyboard**: `A W S E D F T G Y H U J K` for the lower visible octave,
  `Z X C V B N M` for the white keys of the upper one. `←` / `→` change octave.
- **Stop all sound** releases every voice immediately; **Mute piano** silences the
  instrument without stopping the microphone.

### Privacy

The microphone stream is analysed frame by frame in memory. Nothing is recorded,
buffered to disk or uploaded, and the eight-second trace is dropped as it ages out.
`localStorage` holds only instrument, volume, mute and visible octave.

## Known gaps

- The two piano voices are **synthesised**, not sampled. `item_002` asks for
  lightweight embedded piano resources; no sample bank ships in this MVP, so the
  timbres are close cousins rather than recorded pianos. Nothing is downloaded at
  runtime either way.
- Device validation (installation, offline, latency, precision, browser matrix) is
  manual: see `docs/validation-protocol.md`.
