# Canto

**Local-first practice tool for singing in tune.** Play a reference note on a
visual piano, sing, and watch your pitch land on the same note columns as the keys.

Everything — instruments, microphone analysis, rendering — runs in the browser.
No account, no backend, no audio ever leaves the device.

```
    ┌───────────────────────────────────────────────┐
    │  ·   ·   │ ·  ·  · │   ·   ·   │ ·  ·  ·   ·  │   ← 8 s of history rising
    │      ╭───╮                                    │
    │  ────╯   ╰──╮        ╭────────╮               │
    │             ╰────────╯        ╰──────●        │   ← now (● = live pitch)
    ├─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┬─┤
    │ │▓│ │▓│ │ │▓│ │▓│ │▓│ │ │▓│ │▓│ │ │▓│ │▓│ │▓│ │   ← the piano, same columns
    └─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┴─┘
     C3                     C4                     C5
```

Status: **MVP free-practice mode**, feature-complete and covered by automated
tests; validation on the target devices is still outstanding (see
[Validation](#validation)). Workflow docs live under `logics/` (in French) —
start with `logics/INDEX.md`.

---

## Table of contents

- [What it does](#what-it-does)
- [Quick start](#quick-start)
- [Commands](#commands)
- [Using the app](#using-the-app)
- [Privacy](#privacy)
- [Architecture](#architecture)
- [Project layout](#project-layout)
- [Testing](#testing)
- [Validation](#validation)
- [Deployment](#deployment)
- [Browser support](#browser-support)
- [Out of scope](#out-of-scope)
- [Known gaps](#known-gaps)

---

## What it does

- **A reference you can hear.** A two-octave piano covering C2–C6, with three
  offline timbres: `Studio Grand`, `Soft Piano`, `Warm Organ`.
- **A reference you can see.** Your sung pitch is drawn directly above the keys.
  A perfectly tuned note sits on its key's centre; a pitch between two semitones
  sits between their centres. There is no hertz axis to translate in your head.
- **Eight seconds of memory.** The present is drawn next to the keyboard and the
  history rises away from it, so you can watch yourself correcting a note.
- **Honest feedback.** Silence breaks the line, a quiet or ambiguous signal is
  never presented as a confident note, and the ±15 cents "in tune" band is shown
  by shape and thickness as well as colour.
- **One screen.** The keyboard, the detected note and the trace are always visible
  together; nothing scrolls, and the help and diagnostics panels float above rather
  than pushing the keyboard away.
- **Installable and offline.** After the first load, the whole practice mode
  works with no network at all.

---

## Quick start

```bash
git clone https://github.com/Jilanos/Canto.git
cd Canto
npm install
npm run icons     # generate the placeholder PWA icons into public/icons/
npm run dev       # http://localhost:5173
```

`localhost` counts as a secure context, so the microphone works in development
without HTTPS.

Requirements: **Node 20+** (developed on Node 24) and a browser from the
[support matrix](#browser-support).

---

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install the toolchain (Vite, TypeScript, Vitest, jsdom) |
| `npm run icons` | Generate the placeholder PWA icons into `public/icons/` |
| `npm run dev` | Dev server with hot reload on `http://localhost:5173` |
| `npm test` | Run the automated suite once |
| `npm run test:watch` | Run the suite in watch mode |
| `npm run build` | Icons → typecheck → static bundle in `dist/` |
| `npm run preview` | Serve `dist/` locally to exercise install and offline behaviour |

The service worker is registered **only in a production build**, so `npm run dev`
never serves stale modules. To test offline behaviour, use
`npm run build && npm run preview`.

---

## Using the app

### The loop

1. Press a piano key to hear the note you want to reach.
2. Press **Enable microphone** and allow access when the browser asks.
3. Sing. Your pitch appears above the keys and rises as it ages.
4. Adjust until the trace sits inside the note's in-tune band.

No tutorial, no exercise, no score — just the loop.

### Controls

| Input | Effect |
| --- | --- |
| Mouse / touch | Press a key; multi-touch plays chords |
| `A W S E D F T G Y H U J K` | Lower visible octave, chromatically |
| `Z X C V B N M` | White keys of the upper visible octave |
| `←` / `→` | Move the visible two-octave window through C2–C6 |
| `Tab` + `Enter` / `Space` | Focus a key and play a short note |
| **Mute piano** | Silences the instrument, leaves the microphone running |
| **Stop all sound** | Releases every voice immediately |
| **Stop microphone** | Ends capture and releases the media tracks |
| **Help and privacy** | Keyboard map, headphone advice and the privacy statement |
| **Diagnostics** | Live capture values — see below |
| `Esc` | Closes an open panel |

### States you may see

| Message | Meaning |
| --- | --- |
| *No sound detected* | Below the silence floor |
| *Too quiet* | Audible but too weak to trust |
| *Pitch unclear* | No stable fundamental — try one steady vowel |
| *Microphone access was refused* | Re-allow it in the browser's site settings |
| *No microphone was found* | No input device available |
| *The microphone input stopped* | The device was disconnected or taken over |

### Diagnostics panel

Open **Diagnostics** in the header to see what the audio pipeline is really doing:
state, detected note, raw RMS, level, clarity, whether the current frame is being
held through the grace period, analysis frame rate, sample rate, input device, and —
the useful one — whether the browser actually honoured the request to turn echo
cancellation, noise suppression and gain control **off**.

That last row matters. Voice processing fights pitch detection: noise suppression
treats a steady vowel as stationary noise and gain control rides a held note down.
Canto asks for it to be disabled, verifies what was granted, and re-applies the
constraints once if the browser ignored them. If the panel still says *Still on*,
a dropout on a held note comes from the capture chain, not from Canto's thresholds.

Nothing in the panel is recorded or sent anywhere.

### Speakers vs headphones

On speakers, the piano can leak back into the microphone and confuse the
detector. The app stays usable that way and says so; headphones give a clean
reading.

---

## Privacy

- The microphone stream is analysed **frame by frame in memory**. Nothing is
  recorded, buffered to disk, or uploaded.
- The eight-second trace is dropped as it ages out; no session is stored.
- `localStorage` holds exactly four values under `canto.preferences.v1`:
  instrument, volume, mute, visible octave. The persistence layer drops anything
  else, and a test asserts that allow-list.
- No analytics, no fonts, no CDN, no third-party request of any kind — the
  service worker precaches the app and the app makes no network calls at runtime.

---

## Architecture

Fully static frontend, no server-side runtime (see
`logics/architecture/adr_001_*.md`).

```
microphone ─▶ AnalyserNode ─▶ YIN estimator ─▶ pitch tracker ─┐
                                                              ├─▶ trace renderer
                                        keyboard layout ──────┘
piano keys ─▶ instrument engine ─▶ audio output
```

Four boundaries are kept deliberately clean so a future song mode can reuse them:

| Module | Responsibility |
| --- | --- |
| `src/music/notes.ts` | Note ↔ frequency ↔ cents primitives, A4 = 440 Hz, range C2–C6 |
| `src/music/layout.ts` | Horizontal geometry — the single source of where a pitch sits |
| `src/pitch/yin.ts` | Pure fundamental-frequency estimation with a clarity score |
| `src/pitch/tracker.ts` | Validity decision and the normalised sample stream |
| `src/audio/instruments.ts` | Polyphonic synthesis of the three timbres |
| `src/audio/microphone.ts` | Consent, capture, per-frame analysis, teardown |
| `src/render/trace-renderer.ts` | Canvas 2D note-time trace |
| `src/ui/`, `src/app.ts` | Layout, controls, user-visible state machine |
| `src/state/preferences.ts` | The only persistence |
| `src/ui/height-budget.ts` | Splits the viewport between the trace and the keyboard |

Three decisions are worth knowing before changing anything:

- **The renderer never sees the detector.** It consumes
  `{timestamp, frequency, midi, note, cents, clarity, level, state}`, so the
  estimator can be swapped or compared without touching the UI.
- **Alignment is structural, not duplicated.** The DOM keyboard and the canvas
  both derive their x positions from `music/layout.ts`. They cannot drift apart.
- **Pitch analysis is a pure function.** `estimatePitch(buffer, options)` takes a
  `Float32Array`, so accuracy and cost are measured in unit tests, with no
  browser and no microphone involved.
- **Tracking thresholds are asymmetric.** Starting to track a note demands a clearly
  audible, clearly periodic window; staying tracked demands much less, and a short
  grace period rides out isolated bad frames. That is what stops a held note from
  dying mid-phrase when its captured level drifts down. True silence still drops out
  immediately, so releasing a note never leaves a ghost.
- **The layout is computed, not guessed.** `allocateHeights()` receives the measured
  chrome and returns the trace and keyboard heights, applied as CSS custom
  properties. CSS alone cannot promise a scroll-free screen because the chrome grows
  with its own copy.

### Technology

Vite + strict TypeScript, no UI framework (one screen does not need a reactive
renderer), Canvas 2D for the trace, Web Audio for both synthesis and analysis,
Vitest + jsdom for tests. The service worker is hand-written and its precache
list is injected from the real bundle at build time by a plugin in
`vite.config.ts` — a missing injection fails the build rather than shipping a
broken offline mode.

---

## Project layout

```
├── index.html                  App shell
├── public/
│   ├── manifest.webmanifest    PWA manifest (name, icons, standalone)
│   └── icons/                  Generated, git-ignored
├── scripts/generate-icons.mjs  Draws and PNG-encodes the placeholder icons
├── src/
│   ├── app.ts                  Controller wiring every module together, owns the height budget
│   ├── main.ts                 Entry point, service worker registration
│   ├── audio/                  Instrument engine, microphone pipeline
│   ├── music/                  Note primitives, keyboard geometry
│   ├── pitch/                  YIN estimator, tracker, synthetic test signals
│   ├── render/                 Trace buffer, Canvas renderer, palette
│   ├── service-worker/         Registration + build-time SW template
│   ├── state/                  Preference persistence
│   ├── styles/app.css          Whole stylesheet
│   ├── ui/                     Piano keyboard, app shell markup, height budget
│   └── i18n/en.json            Every visible string
├── docs/validation-protocol.md Device validation procedure
└── logics/                     Workflow docs: request, product, ADR, backlog, task
```

### Adding or changing copy

All visible text comes from `src/i18n/en.json`, a nested catalogue declared in
`logics/i18n/contract.json`. Add the key there, use it through `t('group.key')`,
and run `npm test` — a test fails on both missing and unused keys. Placeholders
use `{name}` syntax. Adding a locale means adding a catalogue file, not touching
the views.

---

## Testing

```bash
npm test          # 91 tests across 9 files
```

| Area | File | What it pins down |
| --- | --- | --- |
| Musical conversions | `music/notes.test.ts` | A4 = 440 Hz, C2–C6 bounds, cents sign and range, refusal of invalid input |
| Alignment | `music/layout.test.ts` | Tuned pitch on the key centre, continuity between semitones, viewport bounds |
| Detection | `pitch/yin.test.ts` | <5 cents on every semitone C2–C6 (mean <1.5), no octave error on harmonic tones, noise tolerance, silence rejected, per-frame cost |
| Validity | `pitch/tracker.test.ts` | Silence / weak / unstable / tracking thresholds, octave-slip rejection |
| Trace | `render/trace-buffer.test.ts` | Eight-second window, breaks on silence, dropped frames and implausible jumps |
| Layout | `ui/height-budget.test.ts` | Keyboard and trace stay above their minimums on every target viewport, and the stylesheet's compact chrome budget is enforced |
| Sustained notes | `pitch/tracker.test.ts` | A 20 s held note with a decaying level never drops out, while stopping drops out at once |
| Persistence | `state/preferences.test.ts` | Only the allow-listed preferences are ever written |
| Copy | `i18n/catalogue.test.ts` | No missing or unused catalogue key |
| UI | `ui/piano.test.ts`, `ui/view.test.ts` | Stuck-note prevention on every input path, accessible labels, control wiring |

Detection tests run on deterministic synthetic signals from `pitch/signals.ts`
(pure tones, voiced tones with harmonics, seeded noise), so results are
reproducible across machines.

---

## Validation

Automated coverage is not enough for an audio app. `docs/validation-protocol.md`
holds the reproducible device procedure: installation, real offline use,
permission refusal and recovery, on-device accuracy, a frame-counting latency
measurement against the 150 ms target, fluidity, orientation, speaker vs
headphone behaviour, and accessibility.

**Current state:** section 1 (automated) passes. Sections 2.1–2.8 have not been
run on Chrome Android, Firefox desktop or Firefox Android yet, and the app has
not been published to the production domain.

---

## Deployment

`npm run build` produces a purely static `dist/` (≈196 KB, of which 34 KB of
JavaScript, 11 KB gzipped) intended for the **root** of
`https://canto.paulmondou.fr` — `base: '/'` in `vite.config.ts`.

Publish the contents of `dist/` at the domain root, and make sure the host:

- serves over **HTTPS** — required for microphone capture and installation;
- serves `manifest.webmanifest` as `application/manifest+json` and `sw.js` as
  `text/javascript`, both from the root scope;
- falls back to `/index.html` for unknown paths;
- does **not** cache `sw.js` long-term, so updates can roll out.

No server-side runtime, environment variable or API key is involved. When a new
version is deployed, the running app shows a *"A new version is ready"* banner
instead of swapping itself out mid-exercise.

---

## Browser support

| Browser | Status |
| --- | --- |
| Chrome on Android | Required by the MVP; device validation pending |
| Firefox desktop | Required by the MVP; device validation pending |
| Firefox Android | Required by the MVP; device validation pending |

Anything else is expected to work — the app uses only Web Audio, Canvas 2D,
pointer events and a service worker — but is not part of the validated matrix.

---

## Out of scope

Deliberately excluded from this MVP:

- Song mode, karaoke, lyrics, scores, backing tracks
- Performance scoring, gamification, saved sessions or progress
- Harmonics or spectral-intensity display (the MVP shows the fundamental only)
- MIDI devices, sustain pedal, velocity, sequencer, metronome, recording
- Accounts, backends, cloud sync, analytics

The architecture keeps the musical-time, pitch, rendering and transport
primitives separate so a song mode can be built on them later — but none of it
is implemented here.

---

## Known gaps

- **The two pianos are synthesised, not sampled.** `item_002` asks for
  lightweight embedded piano resources; no sample bank ships in this MVP, so the
  timbres are close cousins rather than recorded instruments. The "no runtime
  download" constraint holds either way. Replacing the synthesis with light
  samples is follow-up work that does not change the architecture contract.
- **The PWA icons are placeholders**, drawn by `scripts/generate-icons.mjs`.
- **Device validation is outstanding** — see [Validation](#validation).
- **Pitch analysis runs on the main thread.** Measurements put a frame far inside
  the latency budget, so moving it to an AudioWorklet is not justified yet; the
  stream contract already allows it without UI changes.
