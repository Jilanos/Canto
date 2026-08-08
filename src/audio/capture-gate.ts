/**
 * Detects a capture chain that gates the signal to digital silence (item_007).
 *
 * Observed on Firefox desktop: a held note reads a healthy RMS of 0.05 to 0.1 for
 * two to four seconds, then drops straight to 0.000 while the singer is still
 * singing, and the browser reports voice processing as disabled.
 *
 * A real microphone in a real room never returns an exact zero — room tone, breath
 * and preamp noise always leave a residue around 0.001 to 0.005. Digital silence
 * therefore means something upstream of the browser muted the stream: an operating
 * system enhancement, a driver, or a virtual noise-suppression device. That is
 * outside our reach to fix, but it is inside our reach to *name*, instead of
 * showing "No sound detected" and letting the singer think they went quiet.
 *
 * Pure and DOM-free so the discrimination rule is unit tested rather than guessed.
 */

/** Below this RMS the window is digitally silent, not quietly noisy. */
export const DIGITAL_SILENCE_RMS = 1e-5;

/** Above this RMS the signal was unambiguously present. */
export const HEALTHY_RMS = 0.02;

/** How long digital silence must persist before it is reported as a gate. */
export const GATE_CONFIRM_MS = 200;

/** A gate only follows a healthy signal that was present recently. */
const RECENT_SIGNAL_MS = 1500;

export class CaptureGateDetector {
  private lastHealthyAt: number | null = null;
  private silenceStartedAt: number | null = null;
  private reported = false;
  private count = 0;

  /** Number of gates observed since the pipeline started. */
  get gateCount(): number {
    return this.count;
  }

  reset(): void {
    this.lastHealthyAt = null;
    this.silenceStartedAt = null;
    this.reported = false;
    this.count = 0;
  }

  /**
   * Feeds one frame. Returns true exactly once per gate, on the frame where it is
   * confirmed, so the caller can surface it without repeating itself every frame.
   */
  push(rms: number, timestamp: number): boolean {
    if (rms >= HEALTHY_RMS) {
      this.lastHealthyAt = timestamp;
      this.silenceStartedAt = null;
      this.reported = false;
      return false;
    }

    if (rms >= DIGITAL_SILENCE_RMS) {
      // Quiet but alive: an ordinary release, or a soft passage. Not a gate.
      this.silenceStartedAt = null;
      this.reported = false;
      return false;
    }

    // Digital silence. Only meaningful if a healthy signal was present just before:
    // a session that starts silent is simply a microphone nobody is singing into.
    if (this.lastHealthyAt === null || timestamp - this.lastHealthyAt > RECENT_SIGNAL_MS) {
      this.silenceStartedAt = null;
      return false;
    }

    if (this.silenceStartedAt === null) this.silenceStartedAt = timestamp;
    if (this.reported || timestamp - this.silenceStartedAt < GATE_CONFIRM_MS) return false;

    this.reported = true;
    this.count += 1;
    return true;
  }
}
