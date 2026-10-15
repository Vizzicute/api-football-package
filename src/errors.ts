export class ApiFootballError extends Error {
  constructor(message: string, public readonly status?: number, public readonly details?: unknown) {
    super(message);
    this.name = new.target.name;
  }
}
/** Per-minute limit hit (HTTP 429 or errors.rateLimit). */
export class RateLimitError extends ApiFootballError {}
/** Daily quota exhausted, or our own safety reserve reached. */
export class QuotaExceededError extends ApiFootballError {}
/** Too many consecutive upstream failures; calls are paused. */
export class CircuitOpenError extends ApiFootballError {}
/** HTTP 200 but the body carried an `errors` payload (bad params, plan limits...). */
export class ApiResponseError extends ApiFootballError {}
/** API_FOOTBALL_KEY missing. */
export class MissingApiKeyError extends ApiFootballError {}
