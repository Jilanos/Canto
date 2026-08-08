/**
 * Free-practice controller (item_005): binds the instrument engine, the microphone
 * pipeline, the trace renderer and the DOM together, and owns the user-visible
 * state machine for microphone status and pitch feedback.
 */

import { InstrumentEngine, isInstrumentId } from './audio/instruments';
import { MicrophoneError, MicrophonePipeline, type MicrophoneFailure } from './audio/microphone';
import { t, type TranslationKey } from './i18n';
import { IN_TUNE_CENTS, noteLabel } from './music/notes';
import { availableBottomNotes, clampBottomMidi, createKeyboardLayout } from './music/layout';
import type { PitchSample, PitchState } from './pitch/tracker';
import { TraceBuffer } from './render/trace-buffer';
import { TraceRenderer } from './render/trace-renderer';
import { loadPreferences, savePreferences, type Preferences } from './state/preferences';
import { PianoKeyboard, describeRange } from './ui/piano';
import { renderApp, type AppView } from './ui/view';

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

export class CantoApp {
  private readonly view: AppView;
  private readonly engine: InstrumentEngine;
  private readonly microphone: MicrophonePipeline;
  private readonly buffer = new TraceBuffer();
  private readonly renderer: TraceRenderer;
  private readonly piano: PianoKeyboard;
  private preferences: Preferences;
  private lastAnnouncedNote: string | null = null;

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
    });

    this.bindControls();
    this.applyPreferencesToView();
    this.renderer.draw();
  }

  dispose(): void {
    this.microphone.stop();
    this.renderer.stop();
    this.piano.destroy();
    this.engine.dispose();
  }

  // --- microphone ---------------------------------------------------------

  private async toggleMicrophone(): Promise<void> {
    if (this.microphone.running) {
      this.stopMicrophone();
      return;
    }
    try {
      await this.engine.resume();
      await this.microphone.start();
      this.view.micButton.textContent = t('mic.stop');
      this.view.micButton.setAttribute('aria-pressed', 'true');
      this.setStatus('mic.statusListening');
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
    this.updateLevel(sample.level);
    this.setStatus(MIC_STATUS_KEYS[sample.state]);
    this.setNoteReadout(sample);
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
    const uncertain = sample.clarity < 0.85;
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

  // --- controls -----------------------------------------------------------

  private bindControls(): void {
    this.view.micButton.addEventListener('click', () => void this.toggleMicrophone());

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
      if (event.target !== document.body && event.target !== null) {
        if (event.target instanceof HTMLElement && event.target.closest('input, select, textarea')) return;
      }
      if (event.key === 'ArrowLeft') this.shiftOctave(-1);
      if (event.key === 'ArrowRight') this.shiftOctave(1);
    });

    window.addEventListener('resize', () => this.renderer.resize());
    window.addEventListener('orientationchange', () => this.renderer.resize());
    // Releasing the microphone when the view is hidden keeps the recording
    // indicator honest and frees the device (item_003 AC4).
    document.addEventListener('visibilitychange', () => {
      if (document.hidden && this.microphone.running) this.stopMicrophone();
    });
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
