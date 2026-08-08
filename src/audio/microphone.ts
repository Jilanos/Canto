/**
 * Local microphone pipeline (item_003).
 *
 * The stream is analysed frame by frame and never stored, copied to a durable
 * buffer or sent anywhere (item_003 scope, item_005 AC5). Stopping the pipeline
 * releases the media tracks, which is what turns the browser's recording
 * indicator off (item_003 AC4).
 */

import { PitchTracker, type PitchSample, type TrackerOptions } from '../pitch/tracker';
import { DEFAULT_PITCH_OPTIONS, estimatePitch } from '../pitch/yin';

/** ~43 ms at 48 kHz: long enough for C2, short enough for the latency budget. */
export const ANALYSIS_WINDOW = 2048;

export type MicrophoneFailure = 'denied' | 'unavailable' | 'interrupted' | 'unsupported';

export class MicrophoneError extends Error {
  readonly reason: MicrophoneFailure;

  constructor(reason: MicrophoneFailure, message?: string) {
    super(message ?? reason);
    this.name = 'MicrophoneError';
    this.reason = reason;
  }
}

export interface MicrophoneHandlers {
  onSample(sample: PitchSample): void;
  onFailure(error: MicrophoneError): void;
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
  private frame = 0;
  private trackEndedHandler: (() => void) | null = null;

  constructor(context: AudioContext, handlers: MicrophoneHandlers, options: MicrophoneOptions = {}) {
    this.context = context;
    this.handlers = handlers;
    this.tracker = new PitchTracker(options.tracker ?? {});
  }

  get running(): boolean {
    return this.stream !== null;
  }

  /**
   * Must be called from a user gesture, after the privacy note has been shown
   * (item_003 AC1). Throws a `MicrophoneError` the UI can map to a recovery hint.
   */
  async start(): Promise<void> {
    if (this.stream) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      throw new MicrophoneError('unsupported', 'getUserMedia is unavailable in this browser context');
    }

    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // Voice processing would fight the pitch detector.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
    } catch (error) {
      throw new MicrophoneError(classify(error), error instanceof Error ? error.message : undefined);
    }

    if (this.context.state !== 'running') await this.context.resume();

    this.stream = stream;
    this.tracker.reset();
    this.source = this.context.createMediaStreamSource(stream);
    this.analyser = this.context.createAnalyser();
    this.analyser.fftSize = ANALYSIS_WINDOW;
    this.analyser.smoothingTimeConstant = 0;
    this.source.connect(this.analyser);
    // The analyser is intentionally not connected to the destination: monitoring the
    // microphone through the speakers would feed straight back into the detector.

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
    this.tracker.reset();
  }

  private readonly tick = (): void => {
    const analyser = this.analyser;
    if (!analyser || !this.stream) return;

    analyser.getFloatTimeDomainData(this.buffer);
    const estimate = estimatePitch(this.buffer, { ...DEFAULT_PITCH_OPTIONS, sampleRate: this.context.sampleRate });
    this.handlers.onSample(this.tracker.push(estimate, this.context.currentTime * 1000));

    this.frame = requestAnimationFrame(this.tick);
  };
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
