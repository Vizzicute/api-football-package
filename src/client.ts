import type * as T from "./types";
import type * as P from "./params";
import {
  ApiFootballError, ApiResponseError, CircuitOpenError, MissingApiKeyError,
  QuotaExceededError, RateLimitError,
} from "./errors";
import { CircuitBreaker, PLAN_PER_MINUTE, RateLimiter, type Plan } from "./limiter";
import { DEFAULT_TTL, MemoryCache, type CacheStore } from "./cache";

export interface ApiFootballOptions {
  /** Defaults to process.env.API_FOOTBALL_KEY (read lazily, so builds don't crash). */
  apiKey?: string;
  plan?: Plan;
  /** Explicit per-minute limit; overrides `plan` (useful for custom plans). */
  rateLimitPerMinute?: number;
  /** Stop calling when this many daily requests remain. Default 10. */
  quotaReserve?: number;
  cache?: CacheStore | false;
  /** Override TTLs (seconds) per endpoint key. */
  ttl?: Record<string, number>;
  timeoutMs?: number;
  baseUrl?: string;
}

const BASE = "https://v3.football.api-sports.io";

export class ApiFootball {
  private limiter: RateLimiter;
  private breaker = new CircuitBreaker(5, 30_000);
  private cache: CacheStore | null;
  private inflight = new Map<string, Promise<unknown>>();
  private ttl: Record<string, number>;

  constructor(private opts: ApiFootballOptions = {}) {
    this.limiter = new RateLimiter(opts.rateLimitPerMinute ?? PLAN_PER_MINUTE[opts.plan ?? "free"], opts.quotaReserve ?? 10);
    this.cache = opts.cache === false ? null : opts.cache ?? new MemoryCache();
    this.ttl = { ...DEFAULT_TTL, ...opts.ttl };
  }

  // ───────── core ─────────
  private key(): string {
    const k = this.opts.apiKey ?? process.env.API_FOOTBALL_KEY;
    if (!k) throw new MissingApiKeyError("API_FOOTBALL_KEY is not set.");
    return k;
  }

  private ttlFor(endpoint: string, q: Record<string, string>): number {
    if (endpoint === "fixtures" && q.live) return this.ttl["fixtures:live"] ?? 60;
    return this.ttl[endpoint] ?? 0;
  }

  async request<R>(endpoint: string, params: object = {}): Promise<T.ApiResponse<R>> {
    const q: Record<string, string> = {};
    for (const [k, v] of Object.entries(params).sort(([a], [b]) => a.localeCompare(b)))
      if (v !== undefined && v !== null) q[k] = String(v);
    const cacheKey = `${endpoint}?${new URLSearchParams(q)}`;
    const ttl = this.ttlFor(endpoint, q);

    type Stored = { data: T.ApiResponse<R>; freshUntil: number };
    const raw = ttl && this.cache ? await this.cache.get(cacheKey) : undefined;
    const hit = raw?.value as Stored | undefined;
    if (hit && hit.freshUntil > Date.now()) return hit.data;

    const pending = this.inflight.get(cacheKey);
    if (pending) return pending as Promise<T.ApiResponse<R>>; // coalesce identical calls

    const p = this.fetchOnce<R>(endpoint, q)
      .then(async (data) => {
        // fresh for `ttl`; physically retained 10x longer so it can be served stale on upstream trouble
        if (ttl && this.cache) await this.cache.set(cacheKey, { data, freshUntil: Date.now() + ttl * 1000 } satisfies Stored, ttl * 10);
        return data;
      })
      .catch((err) => {
        // serve stale data if upstream is unhappy
        if (hit && (err instanceof CircuitOpenError || err instanceof RateLimitError ||
            err instanceof QuotaExceededError || (err instanceof ApiFootballError && (err.status ?? 0) >= 500)))
          return hit.data;
        throw err;
      })
      .finally(() => this.inflight.delete(cacheKey));
    this.inflight.set(cacheKey, p);
    return p;
  }

  private async fetchOnce<R>(endpoint: string, q: Record<string, string>): Promise<T.ApiResponse<R>> {
    if (this.breaker.isOpen) throw new CircuitOpenError("Upstream paused after repeated failures.");
    const apiKey = this.key();
    await this.limiter.acquire();

    const url = `${this.opts.baseUrl ?? BASE}/${endpoint}${Object.keys(q).length ? `?${new URLSearchParams(q)}` : ""}`;
    let res: Response;
    try {
      // Only the x-apisports-key header: extra headers make the API reject the call.
      res = await fetch(url, {
        method: "GET",
        headers: { "x-apisports-key": apiKey },
        signal: AbortSignal.timeout(this.opts.timeoutMs ?? 10_000),
      });
    } catch (e) {
      this.breaker.failure();
      throw new ApiFootballError(`Network error: ${(e as Error).message}`);
    }
    this.limiter.update(res.headers);

    if (res.status === 429) { this.breaker.failure(); throw new RateLimitError("HTTP 429", 429); }
    if (res.status >= 500) { this.breaker.failure(); throw new ApiFootballError(`Server ${res.status}`, res.status); }
    if (!res.ok) throw new ApiFootballError(`HTTP ${res.status}`, res.status);

    const body = (await res.json()) as T.ApiResponse<R>;
    const errs = body.errors;
    const hasErr = Array.isArray(errs) ? errs.length > 0 : Object.keys(errs ?? {}).length > 0;
    if (hasErr) {
      const e = errs as Record<string, string>;
      if (e.rateLimit) throw new RateLimitError(e.rateLimit, 200, errs);
      if (e.requests) throw new QuotaExceededError(e.requests, 200, errs);
      throw new ApiResponseError(`API errors: ${JSON.stringify(errs)}`, 200, errs);
    }
    this.breaker.success();
    return body;
  }

  /** Requests left today according to the last response (undefined until first call). */
  get remainingToday() { return this.limiter.remainingToday; }

  // ───────── account (free, not counted) ─────────
  getStatus() { return this.request<T.StatusResponse>("status"); }

  // ───────── reference ─────────
  getTimezones() { return this.request<string[]>("timezone"); }
  getCountries(p: { name?: string; code?: string; search?: string } = {}) { return this.request<T.Country[]>("countries", p); }
  getLeagues(p: P.LeaguesParams = {}) { return this.request<T.LeagueEntry[]>("leagues", p); }
  getLeagueSeasons() { return this.request<number[]>("leagues/seasons"); }

  // ───────── teams & venues ─────────
  getTeams(p: P.TeamsParams) { return this.request<T.TeamEntry[]>("teams", p); }
  getTeamStatistics(p: P.TeamStatisticsParams) { return this.request<T.TeamStatistics>("teams/statistics", p); }
  getTeamSeasons(p: { team: number }) { return this.request<number[]>("teams/seasons", p); }
  getTeamCountries() { return this.request<T.Country[]>("teams/countries"); }
  getVenues(p: P.VenuesParams) { return this.request<T.Venue[]>("venues", p); }

  // ───────── standings ─────────
  getStandings(p: P.StandingsParams) { return this.request<T.StandingsEntry[]>("standings", p); }

  // ───────── fixtures ─────────
  getFixtures(p: P.FixturesParams) { return this.request<T.Fixture[]>("fixtures", p); }
  getLiveFixtures(leagues?: number[]) { return this.getFixtures({ live: leagues?.length ? leagues.join("-") : "all" }); }
  getFixtureRounds(p: P.RoundsParams) { return this.request<string[]>("fixtures/rounds", p); }
  getHeadToHead(p: P.HeadToHeadParams) { return this.request<T.Fixture[]>("fixtures/headtohead", p); }
  getFixtureStatistics(p: P.FixtureStatsParams) { return this.request<T.FixtureStatistics[]>("fixtures/statistics", p); }
  getFixtureEvents(p: P.FixtureEventsParams) { return this.request<T.FixtureEvent[]>("fixtures/events", p); }
  getFixtureLineups(p: P.FixtureLineupsParams) { return this.request<T.FixtureLineup[]>("fixtures/lineups", p); }
  getFixturePlayers(p: P.FixturePlayersParams) { return this.request<T.FixturePlayersEntry[]>("fixtures/players", p); }

  // ───────── injuries, predictions, coaches ─────────
  getInjuries(p: P.InjuriesParams) { return this.request<T.Injury[]>("injuries", p); }
  getPredictions(p: P.PredictionsParams) { return this.request<T.Prediction[]>("predictions", p); }
  getCoaches(p: P.CoachsParams) { return this.request<T.Coach[]>("coachs", p); }

  // ───────── players ─────────
  getPlayers(p: P.PlayersParams) { return this.request<T.PlayerEntry[]>("players", p); }
  getPlayerProfiles(p: P.PlayerProfilesParams = {}) { return this.request<T.PlayerProfile[]>("players/profiles", p); }
  getPlayerSeasons(p: { player?: number } = {}) { return this.request<number[]>("players/seasons", p); }
  getSquads(p: P.SquadsParams) { return this.request<T.SquadEntry[]>("players/squads", p); }
  getPlayerTeams(p: { player: number }) { return this.request<T.PlayerTeamEntry[]>("players/teams", p); }
  getTopScorers(p: P.TopParams) { return this.request<T.PlayerEntry[]>("players/topscorers", p); }
  getTopAssists(p: P.TopParams) { return this.request<T.PlayerEntry[]>("players/topassists", p); }
  getTopYellowCards(p: P.TopParams) { return this.request<T.PlayerEntry[]>("players/topyellowcards", p); }
  getTopRedCards(p: P.TopParams) { return this.request<T.PlayerEntry[]>("players/topredcards", p); }

  // ───────── transfers, trophies, sidelined ─────────
  getTransfers(p: P.TransfersParams) { return this.request<T.TransferEntry[]>("transfers", p); }
  getTrophies(p: P.TrophiesParams) { return this.request<T.Trophy[]>("trophies", p); }
  getSidelined(p: P.SidelinedParams) { return this.request<T.SidelinedEntry[]>("sidelined", p); }

  // ───────── odds ─────────
  getLiveOdds(p: P.OddsLiveParams = {}) { return this.request<T.OddsLiveEntry[]>("odds/live", p); }
  getLiveBetTypes(p: P.IdSearch = {}) { return this.request<T.BetType[]>("odds/live/bets", p); }
  getOdds(p: P.OddsParams) { return this.request<T.OddsEntry[]>("odds", p); }
  getOddsMapping(p: P.Page = {}) { return this.request<T.OddsMapping[]>("odds/mapping", p); }
  getBookmakers(p: P.IdSearch = {}) { return this.request<T.Bookmaker[]>("odds/bookmakers", p); }
  getBetTypes(p: P.IdSearch = {}) { return this.request<T.BetType[]>("odds/bets", p); }
}
