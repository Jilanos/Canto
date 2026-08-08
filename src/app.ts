/**
 * Free-practice controller (item_005): binds the instrument engine, the microphone
 * pipeline, the trace renderer and the DOM together, and owns the user-visible
 * state machine for microphone status and pitch feedback.
 *
 * It also owns the vertical height budget (item_006): the trace and the keyboard are
 * sized from measured chrome so the whole loop stays on one screen.
 */

import { InstrumentEngine, isInstrumentId } from './audio/instruments';
import {
  MicrophoneError,
  MicrophonePipeline,
  listInputDevices,
  type CaptureReport,
  type MicrophoneFailure,
} from './audio/microphone';
import { t, type TranslationKey } from './i18n';
import { IN_TUNE_CENTS, noteLabel } from './music/notes';
import { availableBottomNotes, clampBottomMidi, createKeyboardLayout } from './music/layout';
import type { PitchSample, PitchState } from './pitch/tracker';
import { TraceBuffer } from './render/trace-buffer';
import { TraceRenderer, UNCERTAIN_CLARITY } from './render/trace-renderer';
import { loadPreferences, savePreferences, type Preferences } from './state/preferences';
import { MIN_TRACE_HEIGHT, allocateHeights } from './ui/height-budget';
import { PianoKeyboard, describeRange } from './ui/piano';
import { renderApp, renderDiagnostics, type AppView } from './ui/view';

const MIC_STATUS_KEYS: Record<PitchState, TranslationKey> = {
  silence: 'mic.statusSilence',
  weak: 'mic.statusWeak',
  unstable: 'mic.statusUnstable',
  tracking: 'mic.statusListening',
};

const MIC_ERROR_KEYS: Record<MicrophoneFailure, TranslationKey> = {
  denied: 'mic.errorDenied',
  unavailable: 'mic.errorUnavailable',
  interrupted: 'mic.errorInterrupted',
  unsupported: 'mic.errorUnsupported',
};

/** Diagnostics refresh interval: readable without competing with the audio loop. */
const DIAGNOSTICS_INTERVAL_MS = 250;

export class CantoApp {
  private readonly view: AppView;
  private readonly engine: InstrumentEngine;
  private readonly microphone: MicrophonePipeline;
  private readonly buffer = new TraceBuffer();
  private readonly renderer: TraceRenderer;
  private readonly piano: PianoKeyboard;
  private preferences: Preferences;
  private lastAnnouncedNote: string | null = null;
  private lastSample: PitchSample | null = null;
  private captureReport: CaptureReport | null = null;
  private diagnosticsOpen = false;
  /** Sticky once a capture cut is seen, so the explanation survives the next frame. */
  private captureGated = false;
  private diagnosticsTimer = 0;
  private layoutFrame = 0;
  private frameCount = 0;
  private frameWindowStart = 0;
  private frameRate = 0;

  constructor(root: HTMLElement) {
    this.preferences = loadPreferences();
    this.view = renderApp(root);

    const context = new AudioContext({ latencyHint: 'interactive' });
    this.engine = new InstrumentEngine(context);
    this.engine.setInstrument(this.preferences.instrument);
    this.engine.setVolume(this.preferences.volume);
    this.engine.setMuted(this.preferences.muted);

    const layout = createKeyboardLayout(this.preferences.bottomMidi);
    this.piano = new PianoKeyboard(this.view.pianoRoot, layout, {
      onNoteOn: (midi) => {
        void this.engine.resume();
        this.engine.noteOn(midi);
        this.syncActiveNotes();
      },
      onNoteOff: (midi) => {
        this.engine.noteOff(midi);
        this.syncActiveNotes();
      },
    });

    this.renderer = new TraceRenderer(this.view.canvas, layout, this.buffer);
    this.microphone = new MicrophonePipeline(context, {
      onSample: (sample) => this.handleSample(sample),
      onFailure: (error) => this.handleMicrophoneFailure(error),
      onCaptureReport: (report) => {
        this.captureReport = report;
        this.refreshDiagnostics();
      },
      onCaptureGate: () => this.handleCaptureGate(),
    });

    this.bindControls();
    this.applyPreferencesToView();
    this.applyHeightBudget();
    this.renderer.draw();
  }

  dispose(): void {
    this.microphone.stop();
    this.renderer.stop();
    this.piano.destroy();
    this.engine.dispose();
    if (this.diagnosticsTimer) window.clearInterval(this.diagnosticsTimer);
    if (this.layoutFrame) cancelAnimationFrame(this.layoutFrame);
  }

  // --- layout (item_006) --------------------------------------------------

  /**
   * Measures the fixed chrome, twice when needed, and hands the remaining height to
   * the keyboard and the trace. Measuring beats hard-coding because the chrome grows
   * with its own copy, and the copy changes with the locale.
   */
  private applyHeightBudget(): void {
    const { root, traceSection, pianoSection } = this.view;
    const viewportHeight = window.innerHeight;

    root.dataset.compact = 'false';
    const chromeHeight = this.measureChrome();
    root.dataset.compact = 'true';
    const compactChromeHeight = this.measureChrome();
    root.dataset.compact = 'false';

    const budget = allocateHeights({ viewportHeight, chromeHeight, compactChromeHeight });
    root.dataset.compact = String(budget.compact);
    root.dataset.overflowing = String(budget.overflowing);
    root.style.setProperty('--piano-height', `${Math.round(budget.piano)}px`);
    root.style.setProperty('--trace-height', `${Math.round(budget.trace)}px`);

    // Trust, then verify: the measurement above is an estimate of chrome that has
    // not been laid out yet. If the result still overflows, take the overflow out of
    // the trace rather than letting the controls be clipped.
    const overflow = root.scrollHeight - root.clientHeight;
    if (overflow > 1 && !budget.overflowing) {
      const corrected = Math.max(MIN_TRACE_HEIGHT, budget.trace - overflow);
      root.style.setProperty('--trace-height', `${Math.round(corrected)}px`);
      root.dataset.compact = 'true';
    }

    // The canvas backing store follows its new CSS box.
    void traceSection.offsetHeight;
    void pianoSection.offsetHeight;
    this.renderer.resize();
  }

  /** Height of everything that is not the trace or the keyboard. */
  private measureChrome(): number {
    const { root, traceSection, pianoSection } = this.view;
    return Math.max(0, root.scrollHeight - traceSection.offsetHeight - pianoSection.offsetHeight);
  }

  private scheduleHeightBudget(): void {
    if (this.layoutFrame) cancelAnimationFrame(this.layoutFrame);
    this.layoutFrame = requestAnimationFrame(() => {
      this.layoutFrame = 0;
      this.applyHeightBudget();
    });
  }

  // --- microphone ---------------------------------------------------------

  private async toggleMicrophone(): Promise<void> {
    if (this.microphone.running) {
      this.stopMicrophone();
      return;
    }
    try {
      await this.engine.resume();
      await this.microphone.start(this.view.deviceSelect.value || undefined);
      this.view.micButton.textContent = t('mic.stop');
      this.view.micButton.setAttribute('aria-pressed', 'true');
      this.setStatus('mic.statusListening');
      this.captureGated = false;
      void this.populateInputDevices();
      this.frameCount = 0;
      this.frameWindowStart = performance.now();
      this.renderer.start();
    } catch (error) {
      this.handleMicrophoneFailure(
        error instanceof MicrophoneError ? error : new MicrophoneError('unavailable', String(error)),
      );
    }
  }

  private stopMicrophone(): void {
    this.microphone.stop();
    this.renderer.stop();
    this.buffer.clear();
    this.renderer.draw();
    this.view.micButton.textContent = t('mic.start');
    this.view.micButton.setAttribute('aria-pressed', 'false');
    this.setStatus('mic.statusIdle');
    this.updateLevel(0);
    this.setNoteReadout(null);
    this.lastAnnouncedNote = null;
    this.lastSample = null;
    this.frameRate = 0;
    this.captureGated = false;
    this.refreshDiagnostics();
  }

  private handleMicrophoneFailure(error: MicrophoneError): void {
    this.microphone.stop();
    this.renderer.stop();
    this.view.micButton.textContent = t('mic.start');
    this.view.micButton.setAttribute('aria-pressed', 'false');
    this.view.micStatus.textContent = t(MIC_ERROR_KEYS[error.reason]);
    this.view.micStatus.classList.add('mic__status--error');
    this.updateLevel(0);
    this.setNoteReadout(null);
  }

  private handleSample(sample: PitchSample): void {
    this.buffer.add(sample);
    this.lastSample = sample;
    this.updateLevel(sample.level);
    // While the capture chain is muting a live note, "No sound detected" would be a
    // lie: the singer is singing. Keep the explanation until sound returns.
    if (this.captureGated && sample.state === 'silence') {
      this.setNoteReadout(sample);
      this.countFrame();
      return;
    }
    this.captureGated = false;
    this.setStatus(MIC_STATUS_KEYS[sample.state]);
    this.setNoteReadout(sample);
    this.countFrame();
  }

  /**
   * The capture chain cut a live note (item_007). The browser reports its own voice
   * processing as disabled in this case, so the filtering sits below it: an OS
   * enhancement, a driver, or a virtual noise-suppression device. Name it and point
   * at the one lever this page has, choosing another input.
   */
  private handleCaptureGate(): void {
    this.captureGated = true;
    this.view.micStatus.textContent = t('mic.statusGated');
    this.view.micStatus.classList.add('mic__status--error');
    this.refreshDiagnostics();
  }

  /** Fills the input picker; labels only exist once permission has been granted. */
  private async populateInputDevices(): Promise<void> {
    const devices = await listInputDevices();
    if (devices.length <= 1) return;

    const current = this.view.deviceSelect.value;
    const options = devices.map((device, index) => {
      const option = document.createElement('option');
      option.value = device.deviceId;
      option.textContent = device.label || t('mic.deviceDefault') + ` ${index + 1}`;
      return option;
    });
    this.view.deviceSelect.replaceChildren(...options);
    if (current && devices.some((device) => device.deviceId === current)) this.view.deviceSelect.value = current;
    this.view.deviceControl.hidden = false;
    this.scheduleHeightBudget();
  }

  /** Switching input restarts the capture; the choice is not persisted. */
  private async switchInputDevice(): Promise<void> {
    if (!this.microphone.running) return;
    const deviceId = this.view.deviceSelect.value;
    this.microphone.stop();
    this.buffer.clear();
    this.captureGated = false;
    try {
      await this.microphone.start(deviceId);
      this.setStatus('mic.statusListening');
    } catch (error) {
      this.handleMicrophoneFailure(
        error instanceof MicrophoneError ? error : new MicrophoneError('unavailable', String(error)),
      );
    }
  }

  /** Rolling analysis frame rate, reported by the diagnostics panel. */
  private countFrame(): void {
    this.frameCount += 1;
    const now = performance.now();
    const elapsed = now - this.frameWindowStart;
    if (elapsed >= 1000) {
      this.frameRate = (this.frameCount * 1000) / elapsed;
      this.frameCount = 0;
      this.frameWindowStart = now;
    }
  }

  // --- readouts -----------------------------------------------------------

  private setStatus(key: TranslationKey): void {
    const message = t(key);
    if (this.view.micStatus.textContent !== message) this.view.micStatus.textContent = message;
    this.view.micStatus.classList.remove('mic__status--error');
  }

  private setNoteReadout(sample: PitchSample | null): void {
    if (!sample || sample.state !== 'tracking' || sample.note === null) {
      this.view.noteReadout.textContent = t('pitch.none');
      this.view.tuningReadout.textContent = '';
      this.view.tuningReadout.className = 'pitch__tuning';
      return;
    }

    this.view.noteReadout.textContent = sample.note;
    const inTune = Math.abs(sample.cents ?? 100) <= IN_TUNE_CENTS;
    const uncertain = sample.held || sample.clarity < UNCERTAIN_CLARITY;
    // Text, not colour alone, carries the tuning state (item_005 AC6).
    this.view.tuningReadout.textContent = uncertain
      ? t('pitch.uncertain')
      : inTune
        ? t('pitch.inTune')
        : t('pitch.offTune');
    this.view.tuningReadout.className = `pitch__tuning pitch__tuning--${uncertain ? 'uncertain' : inTune ? 'in-tune' : 'off'}`;

    // Announce a note change only once, so assistive tech is not flooded at 60 Hz.
    if (sample.note !== this.lastAnnouncedNote) {
      this.lastAnnouncedNote = sample.note;
      this.view.liveRegion.textContent = t('a11y.pitchAnnounce', { note: sample.note });
    }
  }

  private updateLevel(level: number): void {
    const percent = Math.round(level * 100);
    this.view.levelFill.style.width = `${percent}%`;
    this.view.levelMeter.setAttribute('aria-valuenow', String(percent));
  }

  private syncActiveNotes(): void {
    const active = this.engine.activeNotes();
    this.piano.setActiveNotes(active);
    this.view.liveRegion.textContent = active.length
      ? t('a11y.activeNotes', { notes: active.map((midi) => noteLabel(midi)).join(', ') })
      : t('a11y.noActiveNotes');
  }

  // --- diagnostics (item_007) ---------------------------------------------

  private toggleDiagnostics(): void {
    this.diagnosticsOpen = !this.diagnosticsOpen;
    this.view.diagnosticsPanel.classList.toggle('panel--hidden', !this.diagnosticsOpen);
    this.view.diagnosticsButton.setAttribute('aria-expanded', String(this.diagnosticsOpen));
    if (this.diagnosticsOpen) {
      this.refreshDiagnostics();
      this.diagnosticsTimer = window.setInterval(() => this.refreshDiagnostics(), DIAGNOSTICS_INTERVAL_MS);
    } else if (this.diagnosticsTimer) {
      window.clearInterval(this.diagnosticsTimer);
      this.diagnosticsTimer = 0;
    }
  }

  private refreshDiagnostics(): void {
    if (!this.diagnosticsOpen) return;
    const sample = this.lastSample;
    const report = this.captureReport;
    const thresholds = this.microphone.thresholds;

    const rows: [string, string][] = [
      [t('diag.state'), sample ? sample.state : t('diag.idle')],
      [t('diag.note'), sample?.note ?? t('pitch.none')],
      [t('diag.rms'), sample ? sample.rms.toFixed(4) : '—'],
      [t('diag.level'), sample ? `${Math.round(sample.level * 100)}%` : '—'],
      [t('diag.clarity'), sample ? sample.clarity.toFixed(2) : '—'],
      [t('diag.held'), sample?.held ? t('diag.yes') : t('diag.no')],
      [t('diag.frameRate'), this.frameRate ? this.frameRate.toFixed(0) : '—'],
      [t('diag.sampleRate'), report ? `${report.sampleRate} Hz` : '—'],
      [t('diag.device'), report?.label || '—'],
      [
        t('diag.processing'),
        report ? (report.processingStillOn ? t('diag.processingOn') : t('diag.processingOff')) : '—',
      ],
      [t('diag.reapplied'), report?.reapplied ? t('diag.yes') : t('diag.no')],
      [t('diag.gates'), String(this.microphone.captureGateCount)],
      [
        t('diag.thresholds'),
        `RMS ${thresholds.attackRms} / ${thresholds.releaseRms} · clarity ${thresholds.attackClarity} / ${thresholds.releaseClarity} · hold ${thresholds.holdMs} ms`,
      ],
    ];
    renderDiagnostics(this.view.diagnosticsBody, rows);
  }

  private toggleHelp(): void {
    const open = this.view.helpPanel.classList.contains('panel--hidden');
    this.view.helpPanel.classList.toggle('panel--hidden', !open);
    this.view.helpButton.setAttribute('aria-expanded', String(open));
  }

  // --- controls -----------------------------------------------------------

  private bindControls(): void {
    this.view.micButton.addEventListener('click', () => void this.toggleMicrophone());
    this.view.helpButton.addEventListener('click', () => this.toggleHelp());
    this.view.diagnosticsButton.addEventListener('click', () => this.toggleDiagnostics());
    this.view.helpCloseButton.addEventListener('click', () => this.closePanels());
    this.view.diagnosticsCloseButton.addEventListener('click', () => this.closePanels());

    this.view.deviceSelect.addEventListener('change', () => void this.switchInputDevice());

    this.view.instrumentSelect.addEventListener('change', () => {
      const value = this.view.instrumentSelect.value;
      if (!isInstrumentId(value)) return;
      this.engine.setInstrument(value);
      this.updatePreferences({ instrument: value });
    });

    this.view.volumeInput.addEventListener('input', () => {
      const volume = Number(this.view.volumeInput.value) / 100;
      this.engine.setVolume(volume);
      this.updatePreferences({ volume });
    });

    this.view.muteButton.addEventListener('click', () => {
      const muted = !this.engine.isMuted;
      this.engine.setMuted(muted);
      this.view.muteButton.textContent = t(muted ? 'piano.unmute' : 'piano.mute');
      this.view.muteButton.setAttribute('aria-pressed', muted ? 'true' : 'false');
      this.updatePreferences({ muted });
      this.syncActiveNotes();
    });

    this.view.panicButton.addEventListener('click', () => {
      this.engine.releaseAll();
      this.syncActiveNotes();
    });

    this.view.octaveDownButton.addEventListener('click', () => this.shiftOctave(-1));
    this.view.octaveUpButton.addEventListener('click', () => this.shiftOctave(1));

    window.addEventListener('keydown', (event) => {
      if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea')) return;
      if (event.key === 'ArrowLeft') this.shiftOctave(-1);
      if (event.key === 'ArrowRight') this.shiftOctave(1);
      if (event.key === 'Escape') this.closePanels();
    });

    window.addEventListener('resize', () => this.scheduleHeightBudget());
    window.addEventListener('orientationchange', () => this.scheduleHeightBudget());
    // Releasing the microphone when the view is hidden keeps the recording
    // indicator honest and frees the device (item_003 AC4).
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.microphone.running) this.stopMicrophone();
    });
  }

  private closePanels(): void {
    this.view.helpPanel.classList.add('panel--hidden');
    this.view.helpButton.setAttribute('aria-expanded', 'false');
    if (this.diagnosticsOpen) this.toggleDiagnostics();
  }

  private shiftOctave(direction: number): void {
    const bottom = clampBottomMidi(this.piano.visibleLayout.bottomMidi + direction * 12);
    if (bottom === this.piano.visibleLayout.bottomMidi) return;
    const layout = this.piano.setBottomMidi(bottom);
    this.renderer.setLayout(layout);
    this.renderer.draw();
    this.view.rangeReadout.textContent = describeRange(layout);
    this.updateOctaveButtons();
    this.updatePreferences({ bottomMidi: bottom });
    this.syncActiveNotes();
  }

  private updateOctaveButtons(): void {
    const bottoms = availableBottomNotes();
    const current = this.piano.visibleLayout.bottomMidi;
    this.view.octaveDownButton.disabled = current <= (bottoms[0] as number);
    this.view.octaveUpButton.disabled = current >= (bottoms[bottoms.length - 1] as number);
  }

  private applyPreferencesToView(): void {
    this.view.instrumentSelect.value = this.preferences.instrument;
    this.view.volumeInput.value = String(Math.round(this.preferences.volume * 100));
    this.view.muteButton.textContent = t(this.preferences.muted ? 'piano.unmute' : 'piano.mute');
    this.view.muteButton.setAttribute('aria-pressed', this.preferences.muted ? 'true' : 'false');
    this.view.rangeReadout.textContent = describeRange(this.piano.visibleLayout);
    this.updateOctaveButtons();
    this.updateLevel(0);
  }

  private updatePreferences(patch: Partial<Preferences>): void {
    this.preferences = { ...this.preferences, ...patch };
    savePreferences(this.preferences);
  }
}

export function mountApp(root: HTMLElement): CantoApp {
  return new CantoApp(root);
}
