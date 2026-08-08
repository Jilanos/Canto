import { describe, expect, it } from 'vitest';
import { CaptureGateDetector, DIGITAL_SILENCE_RMS, GATE_CONFIRM_MS, HEALTHY_RMS } from './capture-gate';

const FRAME_MS = 16;

/** Feeds frames of a constant RMS, returning how many gates were reported. */
function feed(detector: CaptureGateDetector, rms: number, durationMs: number, startAt: number): number {
  let gates = 0;
  for (let t = startAt; t < startAt + durationMs; t += FRAME_MS) {
    if (detector.push(rms, t)) gates += 1;
  }
  return gates;
}

describe('the observed desktop failure', () => {
  it('reports a gate when a healthy note drops straight to digital silence', () => {
    const detector = new CaptureGateDetector();
    // Three seconds of a held note at the levels measured on the desktop.
    expect(feed(detector, 0.07, 3000, 0)).toBe(0);
    // Then the capture chain mutes it while the singer keeps singing.
    expect(feed(detector, 0, 1000, 3000)).toBe(1);
    expect(detector.gateCount).toBe(1);
  });

  it('reports once per gate, not once per frame', () => {
    const detector = new CaptureGateDetector();
    feed(detector, 0.07, 1000, 0);
    expect(feed(detector, 0, 5000, 1000)).toBe(1);
  });

  it('reports a second gate after the signal comes back and is cut again', () => {
    const detector = new CaptureGateDetector();
    feed(detector, 0.07, 1000, 0);
    feed(detector, 0, 1000, 1000);
    feed(detector, 0.07, 1000, 2000);
    expect(feed(detector, 0, 1000, 3000)).toBe(1);
    expect(detector.gateCount).toBe(2);
  });

  it('waits for the silence to persist before accusing the capture chain', () => {
    const detector = new CaptureGateDetector();
    feed(detector, 0.07, 1000, 0);
    // A single dropped buffer is not a gate.
    expect(feed(detector, 0, GATE_CONFIRM_MS - FRAME_MS, 1000)).toBe(0);
  });
});

describe('what must not be mistaken for a gate', () => {
  it('ignores an ordinary release into room tone', () => {
    const detector = new CaptureGateDetector();
    feed(detector, 0.07, 2000, 0);
    // A real microphone keeps returning room noise once the singer stops.
    expect(feed(detector, 0.003, 5000, 2000)).toBe(0);
    expect(detector.gateCount).toBe(0);
  });

  it('ignores a very quiet but living signal, as measured on the phone', () => {
    const detector = new CaptureGateDetector();
    expect(feed(detector, DIGITAL_SILENCE_RMS * 5, 10000, 0)).toBe(0);
  });

  it('ignores a session that simply starts silent', () => {
    const detector = new CaptureGateDetector();
    expect(feed(detector, 0, 10000, 0)).toBe(0);
  });

  it('ignores digital silence long after the last healthy signal', () => {
    const detector = new CaptureGateDetector();
    feed(detector, 0.07, 500, 0);
    feed(detector, 0.003, 3000, 500); // room tone for a while
    expect(feed(detector, 0, 2000, 3500)).toBe(0);
  });

  it('treats the healthy threshold as the boundary it claims to be', () => {
    const detector = new CaptureGateDetector();
    feed(detector, HEALTHY_RMS, 1000, 0);
    expect(feed(detector, 0, 1000, 1000)).toBe(1);
  });
});

describe('lifecycle', () => {
  it('forgets everything on reset', () => {
    const detector = new CaptureGateDetector();
    feed(detector, 0.07, 1000, 0);
    feed(detector, 0, 1000, 1000);
    expect(detector.gateCount).toBe(1);
    detector.reset();
    expect(detector.gateCount).toBe(0);
    // A gate needs a fresh healthy signal again.
    expect(feed(detector, 0, 2000, 2000)).toBe(0);
  });
});
