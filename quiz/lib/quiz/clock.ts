export interface OffsetSample {
  offset: number;
  rtt: number;
}

/** NTP-style: assume the server stamped serverNow halfway through the round trip. */
export function computeOffset(sentAt: number, receivedAt: number, serverNow: number): OffsetSample {
  const rtt = Math.max(0, receivedAt - sentAt);
  return { offset: serverNow + rtt / 2 - receivedAt, rtt };
}

/** Keeps the last 8 samples and trusts the one with the smallest round trip. */
export class OffsetEstimator {
  private samples: OffsetSample[] = [];

  add(sample: OffsetSample): void {
    this.samples.push(sample);
    if (this.samples.length > 8) this.samples.shift();
  }

  get offset(): number {
    if (this.samples.length === 0) return 0;
    return this.samples.reduce((best, s) => (s.rtt < best.rtt ? s : best)).offset;
  }
}

export function secondsLeft(closesAtMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((closesAtMs - nowMs) / 1000));
}
