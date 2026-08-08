/**
 * Local microphone pipeline (item_003).
 *
 * The stream is analysed frame by frame and never stored, copied to a durable
 * buffer or sent anywhere (item_003 scope, item_005 AC5). Stopping the pipeline
 * releases the media tracks, which is what turns the browser's recording
 * indicator off (item_003 AC4).
 *
 * Two details exist because of the sustained-note dropout of item_007:
 * the voice-processing constraints are verified after the fact and re-applied when
 * the browser ignored them, and the analyser branch is terminated into a muted
 * output so every engine keeps pulling audio through it.
 */

import { PitchTracker, type PitchSample, type TrackerOptions } from '../pitch/tracker';
import { DEFAULT_PITCH_OPTIONS, estimatePitch } from '../pitch/yin';
import { CaptureGateDetector } from './capture-gate';

/** ~43 ms at 48 kHz: long enough for C2, short enough for the latency budget. */
export const ANALYSIS_WINDOW = 2048;

/**
 * Voice processing fights pitch detection: noise suppression treats a steady vowel
 * as stationary noise and gain control rides a held note down.
 */
const RAW_AUDIO_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
};

export type MicrophoneFailure = 'denied' | 'unavailable' | 'interrupted' | 'unsupported';

export class MicrophoneError extends Error {
  readonly reason: MicrophoneFailure;

  constructor(reason: MicrophoneFailure, message?: string) {
    super(message ?? reason);
    this.name = 'MicrophoneError';
    this.reason = reason;
  }
}

/**
 * What the browser actually granted, as opposed to what was asked for. Read by the
 * diagnostics panel; the answer decides whether a dropout comes from the capture
 * chain or from our own thresholds.
 */
export interface CaptureReport {
  sampleRate: number;
  /** Settings reported by the track, limited to what matters for detection. */
  echoCancellation: boolean | null;
  noiseSuppression: boolean | null;
  autoGainControl: boolean | null;
  /** True when a second attempt was needed to turn voice processing off. */
  reapplied: boolean;
  /** True when voice processing is still on despite both attempts. */
  processingStillOn: boolean;
  label: string;
}

export interface MicrophoneHandlers {
  onSample(sample: PitchSample): void;
  onFailure(error: MicrophoneError): void;
  onCaptureReport?(report: CaptureReport): void;
  /** Fired once per gate when the capture chain mutes a live note (item_007). */
  onCaptureGate?(): void;
}

/** An audio input the user can pick. Labels only exist after permission is granted. */
export interface InputDevice {
  deviceId: string;
  label: string;
}

/**
 * Lists audio inputs. Returns an empty list rather than throwing: the picker is an
 * escape hatch, never a prerequisite for practising.
 */
export async function listInputDevices(): Promise<InputDevice[]> {
  if (!navigator.mediaDevices?.enumerateDevices) return [];
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices
      .filter((device) => device.kind === 'audioinput')
      .map((device) => ({ deviceId: device.deviceId, label: device.label }));
  } catch {
    return [];
  }
}

export interface MicrophoneOptions {
  tracker?: Partial<TrackerOptions>;
}

export class MicrophonePipeline {
  private readonly context: AudioContext;
  private readonly handlers: MicrophoneHandlers;
  private readonly tracker: PitchTracker;
  private readonly buffer = new Float32Array(ANALYSIS_WINDOW);

  private stream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private sink: GainNode | null = null;
  private frame = 0;
  private trackEndedHandler: (() => void) | null = null;
  private report: CaptureReport | null = null;
  private readonly gateDetector = new CaptureGateDetector();

  constructor(context: AudioContext, handlers: MicrophoneHandlers, options: MicrophoneOptions = {}) {
    this.context = context;
    this.handlers = handlers;
    this.tracker = new PitchTracker(options.tracker ?? {});
  }

  get running(): boolean {
    return this.stream !== null;
  }

  /** Last capture report, or null when the microphone has never been started. */
  get captureReport(): CaptureReport | null {
    return this.report;
  }

  get thresholds(): Readonly<TrackerOptions> {
    return this.tracker.thresholds;
  }

  /** How many times the capture chain muted a live note this session. */
  get captureGateCount(): number {
    return this.gateDetector.gateCount;
  }

  /**
   * Must be called from a user gesture, after the privacy note has been shown
   * (item_003 AC1). Throws a `MicrophoneError` the UI can map to a recovery hint.
   */
  async start(deviceId?: string): Promise<void> {
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new MicrophoneError('unsupported', 'getUserMedia is unavailable in this browser context');
    }

    let stream: MediaStream;
    try {
      const audio: MediaTrackConstraints = { ...RAW_AUDIO_CONSTRAINTS };
      // `exact` so a gated device is never silently swapped for another one: the
      // point of choosing an input is to know which one is being used.
      if (deviceId) audio.deviceId = { exact: deviceId };
      stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
    } catch (error) {
      throw new MicrophoneError(classify(error), error instanceof Error ? error.message : undefined);
    }

    if (this.context.state !== 'running') await this.context.resume();

    this.stream = stream;
    this.tracker.reset();
    this.gateDetector.reset();
    this.report = await this.inspectCapture(stream);
    this.handlers.onCaptureReport?.(this.report);

    this.source = this.context.createMediaStreamSource(stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = ANALYSIS_WINDOW;
    this.analyser.smoothingTimeConstant = 0;
    this.source.connect(this.analyser);

    // Terminating the branch into a silent output keeps every engine pulling audio
    // through the analyser. The gain is zero, so the microphone is never monitored
    // through the speakers and cannot feed back into the detector.
    this.sink = this.context.createGain();
    this.sink.gain.value = 0;
    this.analyser.connect(this.sink);
    this.sink.connect(this.context.destination);

    this.trackEndedHandler = () => {
      this.stop();
      this.handlers.onFailure(new MicrophoneError('interrupted', 'The audio input ended'));
    };
    for (const track of stream.getAudioTracks()) {
      track.addEventListener('ended', this.trackEndedHandler);
    }

    this.frame = requestAnimationFrame(this.tick);
  }

  /** Stops analysis and releases the media tracks. Safe to call repeatedly. */
  stop(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;

    if (this.stream) {
      for (const track of this.stream.getAudioTracks()) {
        if (this.trackEndedHandler) track.removeEventListener('ended', this.trackEndedHandler);
        track.stop();
      }
    }
    this.trackEndedHandler = null;
    this.stream = null;

    this.source?.disconnect();
    this.source = null;
    this.analyser?.disconnect();
    this.analyser = null;
    this.sink?.disconnect();
    this.sink = null;
    this.tracker.reset();
  }

  /**
   * Reads back what the track really applied and retries once when the browser
   * ignored the request. Some engines accept the constraints at `getUserMedia` time
   * and still report processing as enabled.
   */
  private async inspectCapture(stream: MediaStream): Promise<CaptureReport> {
    const track = stream.getAudioTracks()[0];
    if (!track) {
      return {
        sampleRate: this.context.sampleRate,
        echoCancellation: null,
        noiseSuppression: null,
        autoGainControl: null,
        reapplied: false,
        processingStillOn: false,
        label: '',
      };
    }

    let settings = readSettings(track);
    let reapplied = false;
    if (isProcessingOn(settings)) {
      try {
        await track.applyConstraints({ ...RAW_AUDIO_CONSTRAINTS });
        reapplied = true;
        settings = readSettings(track);
      } catch {
        // Constraint unsupported: the report below records that processing stayed on.
      }
    }

    return {
      sampleRate: this.context.sampleRate,
      ...settings,
      reapplied,
      processingStillOn: isProcessingOn(settings),
      label: track.label,
    };
  }

  private readonly tick = (): void => {
    const analyser = this.analyser;
    if (!analyser || !this.stream) return;

    analyser.getFloatTimeDomainData(this.buffer);
    const estimate = estimatePitch(this.buffer, { ...DEFAULT_PITCH_OPTIONS, sampleRate: this.context.sampleRate });
    const timestamp = this.context.currentTime * 1000;
    if (this.gateDetector.push(estimate?.rms ?? 0, timestamp)) this.handlers.onCaptureGate?.();
    this.handlers.onSample(this.tracker.push(estimate, timestamp));

    this.frame = requestAnimationFrame(this.tick);
  };
}

type ProcessingSettings = Pick<CaptureReport, 'echoCancellation' | 'noiseSuppression' | 'autoGainControl'>;

function readSettings(track: MediaStreamTrack): ProcessingSettings {
  const settings = track.getSettings() as Partial<Record<keyof ProcessingSettings, boolean>>;
  return {
    echoCancellation: settings.echoCancellation ?? null,
    noiseSuppression: settings.noiseSuppression ?? null,
    autoGainControl: settings.autoGainControl ?? null,
  };
}

function isProcessingOn(settings: ProcessingSettings): boolean {
  return settings.noiseSuppression === true || settings.autoGainControl === true || settings.echoCancellation === true;
}

function classify(error: unknown): MicrophoneFailure {
  if (!(error instanceof Error)) return 'unavailable';
  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError':
      return 'denied';
    case 'NotFoundError':
    case 'OverconstrainedError':
      return 'unavailable';
    case 'NotReadableError':
    case 'AbortError':
      return 'interrupted';
    default:
      return 'unavailable';
  }
}
