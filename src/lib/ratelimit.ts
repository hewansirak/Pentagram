/**
 * In-memory sliding-window limiter. On serverless platforms each instance has its
 * own memory, so this is a best-effort guard for GPU spend, not a hard guarantee.
 */
export class RateLimiter {
  private hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number
  ) {}

  /** Returns true when the request is allowed, and records it. */
  check(key: string, now = Date.now()): boolean {
    const recent = (this.hits.get(key) ?? []).filter(
      t => now - t < this.windowMs
    );
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);
    return true;
  }
}
