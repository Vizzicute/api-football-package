import { QuotaExceededError } from "./errors";

export const PLAN_PER_MINUTE = { free: 10, pro: 300, ultra: 450, mega: 900, custom: 1200 } as const;
export const PLAN_PER_DAY = { free: 100, pro: 7500, ultra: 75000, mega: 150000 } as const; // custom: per contract
export type Plan = keyof typeof PLAN_PER_MINUTE;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Sliding-window per-minute limiter + daily quota guard fed by response headers. */
export class RateLimiter {
  private stamps: number[] = [];
  private blockedUntil = 0;
  private dailyRemaining?: number;

  constructor(private perMinute: number, private reserve: number) {}

  async acquire(): Promise<void> {
    if (this.dailyRemaining !== undefined && this.dailyRemaining <= this.reserve) {
      throw new QuotaExceededError(
        `Daily quota guard: ${this.dailyRemaining} requests left (reserve ${this.reserve}).`
      );
    }
    for (;;) {
      const now = Date.now();
      if (now < this.blockedUntil) { await sleep(this.blockedUntil - now); continue; }
      this.stamps = this.stamps.filter((t) => now - t < 60_000);
      // keep a ~10% margin under the plan limit
      if (this.stamps.length < Math.max(1, Math.floor(this.perMinute * 0.9))) {
        this.stamps.push(now);
        if (this.dailyRemaining !== undefined) this.dailyRemaining--;
        return;
      }
      await sleep(Math.max(50, (this.stamps[0] ?? now) + 60_000 - now));
    }
  }

  /** Sync local counters with what the server says. */
  update(h: Headers): void {
    const daily = h.get("x-ratelimit-requests-remaining");
    if (daily !== null && !Number.isNaN(+daily)) this.dailyRemaining = +daily;
    const minute = h.get("x-ratelimit-remaining");
    if (minute !== null && +minute <= 0) this.blockedUntil = Date.now() + 60_000;
  }

  get remainingToday() { return this.dailyRemaining; }
}

export class CircuitBreaker {
  private failures = 0;
  private openUntil = 0;
  constructor(private threshold: number, private cooldownMs: number) {}
  get isOpen() { return Date.now() < this.openUntil; }
  success() { this.failures = 0; }
  failure() {
    if (++this.failures >= this.threshold) { this.openUntil = Date.now() + this.cooldownMs; this.failures = 0; }
  }
}
