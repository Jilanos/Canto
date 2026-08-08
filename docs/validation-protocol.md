# Canto MVP validation protocol

Reproducible checks for the free-practice loop. Covers `item_003` AC6 (accuracy and
latency) and `item_005` AC4 / AC7 (end-to-end validation on the target browsers).

Record every run in the table at the bottom and mirror the outcome into the
`# Validation` section of the matching Logics doc.

## 1. Automated: musical accuracy and analysis cost

```bash
npm test
```

Covers, without any browser or device:

| Check | Where | Threshold |
| --- | --- | --- |
| Note ↔ frequency ↔ cents conversions, A4 = 440 Hz | `src/music/notes.test.ts` | exact to 1e-9 |
| Pitch column geometry and key alignment | `src/music/layout.test.ts` | perfect pitch lands on the key centre |
| YIN accuracy on pure tones, every semitone C2–C6 | `src/pitch/yin.test.ts` | < 5 cents error, mean < 1.5 cents |
| YIN on harmonic-rich (voiced) tones | `src/pitch/yin.test.ts` | < 10 cents, no octave error |
| YIN under additive noise | `src/pitch/yin.test.ts` | < 20 cents |
| Silence and broadband noise rejected | `src/pitch/yin.test.ts` | no confident pitch |
| Analysis cost per frame | `src/pitch/yin.test.ts` | < 20 ms on the dev machine |
| Validity thresholds (silence / weak / unstable / tracking) | `src/pitch/tracker.test.ts` | state machine per `item_003` AC3 |
| Eight-second window and trace breaks | `src/render/trace-buffer.test.ts` | window and segmentation rules |
| Persistence allow-list | `src/state/preferences.test.ts` | only instrument, volume, mute, octave |
| Every visible string comes from the English catalogue | `src/i18n/catalogue.test.ts` | no missing or unused keys |
| UI states, stuck-note prevention, accessible labels | `src/ui/*.test.ts` | per `item_002` AC3, AC4 |
| Height budget on target viewports | `src/ui/height-budget.test.ts` | keyboard and trace both above their minimums, nothing scrolls |
| Sustained note does not drop out | `src/pitch/tracker.test.ts` | 20 s held note, decaying level, zero dropouts |

## 2. Manual: device runs

Do the full sequence per browser. `S` = signal generator (a tone app, a keyboard, or
another device playing a known note).

### 2.1 Install and offline (`item_001` AC1, AC2, AC4, AC5)

1. Serve the production build over HTTPS (or `npm run preview` on localhost).
2. Load the app, confirm the name, icon and standalone install prompt.
3. Install it; launch from the home screen / app list and confirm no browser chrome.
4. Reload once so the service worker takes control; the footer shows
   "Ready offline. You can practise without a network connection."
5. Enable airplane mode / stop the server, relaunch, and complete a full loop
   (play a note, sing, see the trace).
6. In devtools, confirm zero network requests during the exercise.

### 2.2 Permissions and privacy (`item_003` AC1, AC4, AC5; `item_005` AC5)

1. Fresh profile: confirm the privacy sentence is visible **before** any prompt and
   that no prompt appears until "Enable microphone" is pressed.
2. Deny the permission: expect the recovery message, no crash, and the button back
   to its idle label.
3. Allow it, then press "Stop microphone": the browser recording indicator must
   disappear.
4. Switch tabs / background the app while listening: capture stops.
5. Unplug or disable the input device while listening: the interrupted message
   appears and the app stays usable.
6. Devtools network panel: no request carries audio. Application → Local Storage:
   only `canto.preferences.v1` with instrument, volume, mute, bottom octave.

### 2.3 Accuracy on device (`item_003` AC2, AC6)

For each of C3, A3, C4, A4, C5 played by `S` at a comfortable level:

1. Read the detected note in the readout and its position on the trace.
2. Expect the correct note name, a stable trace, no octave flip.
3. Detune `S` by roughly a quarter tone: the trace must move visibly off the note
   centre and the readout must say "Off centre".

Then sing the same notes and confirm the reading is stable within a semitone.

### 2.4 Latency (`request` AC7, target 150 ms excluding hardware)

1. Start from silence, then attack a note sharply on `S`.
2. Film the screen and the source together at 60 fps (a phone slow-motion capture
   is enough), or clap and sing so the attack is audible on the recording.
3. Count frames between the audible attack and the first trace movement:
   at 60 fps, 9 frames ≈ 150 ms. Repeat five times, record the median.
4. Sources of budget: ~43 ms analysis window, one animation frame of render,
   plus uncontrollable device input latency.

### 2.4bis Sustained note and capture diagnostics (`item_007`)

1. Open **Diagnostics** in the header. Note the *Voice processing* row: it says
   whether the browser really turned echo cancellation, noise suppression and gain
   control off, and whether the constraints had to be re-applied.
2. Enable the microphone and hold one steady vowel for **at least 30 seconds**.
   The trace must stay unbroken and *State* must stay `tracking` throughout.
3. Watch *RMS* during the held note. Two different faults look identical on screen:
   - RMS collapses towards zero → the capture chain is gating the signal. Record the
     *Voice processing* row; that is the browser, not the thresholds.
   - RMS stays healthy but the state leaves `tracking` → the thresholds are wrong.
     Record the RMS value at the moment it drops.
4. Stop singing: the state must return to `silence` immediately, with no lingering
   note. *Held frame* may flash `Yes` for a fraction of a second — that is the grace
   period — but must not stay on.
5. If the note is cut while you are still singing and *RMS* reads `0.0000`, the app
   now says so explicitly instead of claiming silence, and *Capture cuts detected*
   counts the occurrences. A digital zero cannot come from a live microphone in a
   real room, so the filtering is outside the browser: try another entry in the
   **Microphone** picker, or disable the audio enhancements of that device in the
   operating system.
6. Record the observed values per browser in the table below.

### 2.5 Fluidity and layout (`item_001` AC3; `item_004` AC5, AC7)

1. Sing continuously for 30 s: the trace must stay smooth and the piano responsive.
2. Change instrument and octave while singing: no audio dropout, alignment holds.
3. Rotate the device: landscape is the recommended posture; portrait stays usable.
4. Both visible octaves remain on screen; `←` / `→` and the octave buttons walk the
   whole C2–C6 range.
5. **Single screen (`item_006`)**: the keyboard, the detected note and the trace are
   visible together, with **no page scrolling**, in landscape, in portrait and on
   desktop. Open **Help and privacy** and **Diagnostics**: both float over the trace
   and never push the keyboard off screen.
6. Resize the desktop window from tall to short: the trace shrinks first, the
   keyboard keeps a playable height, and secondary labels collapse rather than the
   layout breaking.

### 2.6 Instrument and no stuck notes (`item_002`)

1. Play chords with several fingers; hold one key and press others — nothing cuts.
2. Slide a finger off a key, release outside the window, switch apps mid-press:
   the note always stops.
3. Tab to a key and press Enter or Space: a short note sounds.
4. Try all three instruments, including after going offline.
5. "Stop all sound" silences everything instantly.

### 2.7 Speaker vs headphones (`item_005` AC9)

1. On speaker, play a sustained note and stay silent: the piano may be detected —
   this is the documented acoustic bleed.
2. Confirm the headphone hint is visible in the interface.
3. Repeat with headphones: the trace should follow only the voice.

### 2.8 Accessibility (`item_005` AC6)

1. Reach every control with Tab; focus is always visible.
2. Keys expose `Play <note>` and a pressed state to a screen reader.
3. Microphone state and detected note are announced without flooding.
4. Tuning state is readable from the text label, not colour alone.

## 3. Result log

| Date | Build | Browser / device | Sections run | Latency median | Held-note RMS | Voice processing | Result | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| | | Chrome Android | | | | | not run | |
| | | Firefox desktop | | | | | not run | |
| | | Firefox Android | | | | | not run | |

Section 1 passes in CI on every push (111 automated checks).

Production hosting was verified on 2026-08-08 against https://canto.paulmondou.fr
after the v1.0.0 release: health payload carrying the deployed version, app shell,
`Permissions-Policy: microphone=(self)` on this site only, service worker never
cached, manifest MIME type, immutable hashed assets, deep-link fallback, icons,
HSTS and the shared Content-Security-Policy.

Sections 2.1–2.8 require the target devices and are outstanding.
