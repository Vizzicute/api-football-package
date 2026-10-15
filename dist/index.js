"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ApiFootball: () => ApiFootball,
  ApiFootballError: () => ApiFootballError,
  ApiResponseError: () => ApiResponseError,
  CircuitOpenError: () => CircuitOpenError,
  DEFAULT_TTL: () => DEFAULT_TTL,
  LIVE_STATUSES: () => LIVE_STATUSES,
  MemoryCache: () => MemoryCache,
  MissingApiKeyError: () => MissingApiKeyError,
  PLAN_PER_DAY: () => PLAN_PER_DAY,
  PLAN_PER_MINUTE: () => PLAN_PER_MINUTE,
  QuotaExceededError: () => QuotaExceededError,
  RateLimitError: () => RateLimitError,
  STATUS_LABELS: () => STATUS_LABELS,
  apiFootball: () => apiFootball,
  countryFlagUrl: () => countryFlagUrl,
  isFinished: () => isFinished,
  isLive: () => isLive,
  isNotStarted: () => isNotStarted,
  leagueLogoUrl: () => leagueLogoUrl,
  playerPhotoUrl: () => playerPhotoUrl,
  teamLogoUrl: () => teamLogoUrl
});
module.exports = __toCommonJS(index_exports);

// src/errors.ts
var ApiFootballError = class extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
    this.name = new.target.name;
  }
  status;
  details;
};
var RateLimitError = class extends ApiFootballError {
};
var QuotaExceededError = class extends ApiFootballError {
};
var CircuitOpenError = class extends ApiFootballError {
};
var ApiResponseError = class extends ApiFootballError {
};
var MissingApiKeyError = class extends ApiFootballError {
};

// src/limiter.ts
var PLAN_PER_MINUTE = { free: 10, pro: 300, ultra: 450, mega: 900, custom: 1200 };
var PLAN_PER_DAY = { free: 100, pro: 7500, ultra: 75e3, mega: 15e4 };
var sleep = (ms) => new Promise((r) => setTimeout(r, ms));
var RateLimiter = class {
  constructor(perMinute, reserve) {
    this.perMinute = perMinute;
    this.reserve = reserve;
  }
  perMinute;
  reserve;
  stamps = [];
  blockedUntil = 0;
  dailyRemaining;
  async acquire() {
    if (this.dailyRemaining !== void 0 && this.dailyRemaining <= this.reserve) {
      throw new QuotaExceededError(
        `Daily quota guard: ${this.dailyRemaining} requests left (reserve ${this.reserve}).`
      );
    }
    for (; ; ) {
      const now = Date.now();
      if (now < this.blockedUntil) {
        await sleep(this.blockedUntil - now);
        continue;
      }
      this.stamps = this.stamps.filter((t) => now - t < 6e4);
      if (this.stamps.length < Math.max(1, Math.floor(this.perMinute * 0.9))) {
        this.stamps.push(now);
        if (this.dailyRemaining !== void 0) this.dailyRemaining--;
        return;
      }
      await sleep(Math.max(50, (this.stamps[0] ?? now) + 6e4 - now));
    }
  }
  /** Sync local counters with what the server says. */
  update(h) {
    const daily = h.get("x-ratelimit-requests-remaining");
    if (daily !== null && !Number.isNaN(+daily)) this.dailyRemaining = +daily;
    const minute = h.get("x-ratelimit-remaining");
    if (minute !== null && +minute <= 0) this.blockedUntil = Date.now() + 6e4;
  }
  get remainingToday() {
    return this.dailyRemaining;
  }
};
var CircuitBreaker = class {
  constructor(threshold, cooldownMs) {
    this.threshold = threshold;
    this.cooldownMs = cooldownMs;
  }
  threshold;
  cooldownMs;
  failures = 0;
  openUntil = 0;
  get isOpen() {
    return Date.now() < this.openUntil;
  }
  success() {
    this.failures = 0;
  }
  failure() {
    if (++this.failures >= this.threshold) {
      this.openUntil = Date.now() + this.cooldownMs;
      this.failures = 0;
    }
  }
};

// src/cache.ts
var MemoryCache = class {
  constructor(maxEntries = 5e3) {
    this.maxEntries = maxEntries;
  }
  maxEntries;
  m = /* @__PURE__ */ new Map();
  async get(key) {
    return this.m.get(key);
  }
  async set(key, value, ttlSeconds) {
    if (this.m.size >= this.maxEntries) this.m.delete(this.m.keys().next().value);
    this.m.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1e3 });
  }
};
var DEFAULT_TTL = {
  "fixtures:live": 60,
  fixtures: 300,
  "fixtures/events": 60,
  "fixtures/statistics": 60,
  "fixtures/lineups": 300,
  standings: 3600,
  leagues: 86400,
  countries: 86400,
  timezone: 86400,
  teams: 86400,
  "teams/statistics": 3600,
  players: 86400,
  "players/squads": 86400,
  "players/topscorers": 3600,
  "players/topassists": 3600,
  transfers: 86400,
  predictions: 86400,
  injuries: 1800,
  odds: 900
};

// src/client.ts
var BASE = "https://v3.football.api-sports.io";
var ApiFootball = class {
  constructor(opts = {}) {
    this.opts = opts;
    this.limiter = new RateLimiter(opts.rateLimitPerMinute ?? PLAN_PER_MINUTE[opts.plan ?? "free"], opts.quotaReserve ?? 10);
    this.cache = opts.cache === false ? null : opts.cache ?? new MemoryCache();
    this.ttl = { ...DEFAULT_TTL, ...opts.ttl };
  }
  opts;
  limiter;
  breaker = new CircuitBreaker(5, 3e4);
  cache;
  inflight = /* @__PURE__ */ new Map();
  ttl;
  // ───────── core ─────────
  key() {
    const k = this.opts.apiKey ?? process.env.API_FOOTBALL_KEY;
    if (!k) throw new MissingApiKeyError("API_FOOTBALL_KEY is not set.");
    return k;
  }
  ttlFor(endpoint, q) {
    if (endpoint === "fixtures" && q.live) return this.ttl["fixtures:live"] ?? 60;
    return this.ttl[endpoint] ?? 0;
  }
  async request(endpoint, params = {}) {
    const q = {};
    for (const [k, v] of Object.entries(params).sort(([a], [b]) => a.localeCompare(b)))
      if (v !== void 0 && v !== null) q[k] = String(v);
    const cacheKey = `${endpoint}?${new URLSearchParams(q)}`;
    const ttl = this.ttlFor(endpoint, q);
    const raw = ttl && this.cache ? await this.cache.get(cacheKey) : void 0;
    const hit = raw?.value;
    if (hit && hit.freshUntil > Date.now()) return hit.data;
    const pending = this.inflight.get(cacheKey);
    if (pending) return pending;
    const p = this.fetchOnce(endpoint, q).then(async (data) => {
      if (ttl && this.cache) await this.cache.set(cacheKey, { data, freshUntil: Date.now() + ttl * 1e3 }, ttl * 10);
      return data;
    }).catch((err) => {
      if (hit && (err instanceof CircuitOpenError || err instanceof RateLimitError || err instanceof QuotaExceededError || err instanceof ApiFootballError && (err.status ?? 0) >= 500))
        return hit.data;
      throw err;
    }).finally(() => this.inflight.delete(cacheKey));
    this.inflight.set(cacheKey, p);
    return p;
  }
  async fetchOnce(endpoint, q) {
    if (this.breaker.isOpen) throw new CircuitOpenError("Upstream paused after repeated failures.");
    const apiKey = this.key();
    await this.limiter.acquire();
    const url = `${this.opts.baseUrl ?? BASE}/${endpoint}${Object.keys(q).length ? `?${new URLSearchParams(q)}` : ""}`;
    let res;
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { "x-apisports-key": apiKey },
        signal: AbortSignal.timeout(this.opts.timeoutMs ?? 1e4)
      });
    } catch (e) {
      this.breaker.failure();
      throw new ApiFootballError(`Network error: ${e.message}`);
    }
    this.limiter.update(res.headers);
    if (res.status === 429) {
      this.breaker.failure();
      throw new RateLimitError("HTTP 429", 429);
    }
    if (res.status >= 500) {
      this.breaker.failure();
      throw new ApiFootballError(`Server ${res.status}`, res.status);
    }
    if (!res.ok) throw new ApiFootballError(`HTTP ${res.status}`, res.status);
    const body = await res.json();
    const errs = body.errors;
    const hasErr = Array.isArray(errs) ? errs.length > 0 : Object.keys(errs ?? {}).length > 0;
    if (hasErr) {
      const e = errs;
      if (e.rateLimit) throw new RateLimitError(e.rateLimit, 200, errs);
      if (e.requests) throw new QuotaExceededError(e.requests, 200, errs);
      throw new ApiResponseError(`API errors: ${JSON.stringify(errs)}`, 200, errs);
    }
    this.breaker.success();
    return body;
  }
  /** Requests left today according to the last response (undefined until first call). */
  get remainingToday() {
    return this.limiter.remainingToday;
  }
  // ───────── account (free, not counted) ─────────
  getStatus() {
    return this.request("status");
  }
  // ───────── reference ─────────
  getTimezones() {
    return this.request("timezone");
  }
  getCountries(p = {}) {
    return this.request("countries", p);
  }
  getLeagues(p = {}) {
    return this.request("leagues", p);
  }
  getLeagueSeasons() {
    return this.request("leagues/seasons");
  }
  // ───────── teams & venues ─────────
  getTeams(p) {
    return this.request("teams", p);
  }
  getTeamStatistics(p) {
    return this.request("teams/statistics", p);
  }
  getTeamSeasons(p) {
    return this.request("teams/seasons", p);
  }
  getTeamCountries() {
    return this.request("teams/countries");
  }
  getVenues(p) {
    return this.request("venues", p);
  }
  // ───────── standings ─────────
  getStandings(p) {
    return this.request("standings", p);
  }
  // ───────── fixtures ─────────
  getFixtures(p) {
    return this.request("fixtures", p);
  }
  getLiveFixtures(leagues) {
    return this.getFixtures({ live: leagues?.length ? leagues.join("-") : "all" });
  }
  getFixtureRounds(p) {
    return this.request("fixtures/rounds", p);
  }
  getHeadToHead(p) {
    return this.request("fixtures/headtohead", p);
  }
  getFixtureStatistics(p) {
    return this.request("fixtures/statistics", p);
  }
  getFixtureEvents(p) {
    return this.request("fixtures/events", p);
  }
  getFixtureLineups(p) {
    return this.request("fixtures/lineups", p);
  }
  getFixturePlayers(p) {
    return this.request("fixtures/players", p);
  }
  // ───────── injuries, predictions, coaches ─────────
  getInjuries(p) {
    return this.request("injuries", p);
  }
  getPredictions(p) {
    return this.request("predictions", p);
  }
  getCoaches(p) {
    return this.request("coachs", p);
  }
  // ───────── players ─────────
  getPlayers(p) {
    return this.request("players", p);
  }
  getPlayerProfiles(p = {}) {
    return this.request("players/profiles", p);
  }
  getPlayerSeasons(p = {}) {
    return this.request("players/seasons", p);
  }
  getSquads(p) {
    return this.request("players/squads", p);
  }
  getPlayerTeams(p) {
    return this.request("players/teams", p);
  }
  getTopScorers(p) {
    return this.request("players/topscorers", p);
  }
  getTopAssists(p) {
    return this.request("players/topassists", p);
  }
  getTopYellowCards(p) {
    return this.request("players/topyellowcards", p);
  }
  getTopRedCards(p) {
    return this.request("players/topredcards", p);
  }
  // ───────── transfers, trophies, sidelined ─────────
  getTransfers(p) {
    return this.request("transfers", p);
  }
  getTrophies(p) {
    return this.request("trophies", p);
  }
  getSidelined(p) {
    return this.request("sidelined", p);
  }
  // ───────── odds ─────────
  getLiveOdds(p = {}) {
    return this.request("odds/live", p);
  }
  getLiveBetTypes(p = {}) {
    return this.request("odds/live/bets", p);
  }
  getOdds(p) {
    return this.request("odds", p);
  }
  getOddsMapping(p = {}) {
    return this.request("odds/mapping", p);
  }
  getBookmakers(p = {}) {
    return this.request("odds/bookmakers", p);
  }
  getBetTypes(p = {}) {
    return this.request("odds/bets", p);
  }
};

// src/types.ts
var LIVE_STATUSES = [
  "1H",
  "HT",
  "2H",
  "ET",
  "BT",
  "P",
  "INT"
];
function isLive(status) {
  return LIVE_STATUSES.includes(status);
}
function isFinished(status) {
  return ["FT", "AET", "PEN"].includes(status);
}
function isNotStarted(status) {
  return ["TBD", "NS"].includes(status);
}
function teamLogoUrl(teamId) {
  return `https://media.api-sports.io/football/teams/${teamId}.png`;
}
function playerPhotoUrl(playerId) {
  return `https://media.api-sports.io/football/players/${playerId}.png`;
}
function leagueLogoUrl(leagueId) {
  return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
}
function countryFlagUrl(countryCode) {
  return `https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`;
}
var STATUS_LABELS = {
  TBD: "TBD",
  NS: "Not Started",
  "1H": "1st Half",
  HT: "Half Time",
  "2H": "2nd Half",
  ET: "Extra Time",
  BT: "Break Time",
  P: "Penalty Shootout",
  SUSP: "Suspended",
  INT: "Interrupted",
  FT: "Full Time",
  AET: "After Extra Time",
  PEN: "After Penalties",
  PST: "Postponed",
  CANC: "Cancelled",
  ABD: "Abandoned",
  AWD: "Tech. Loss",
  WO: "Walk Over",
  LIVE: "Live"
};

// src/index.ts
var apiFootball = new ApiFootball();
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ApiFootball,
  ApiFootballError,
  ApiResponseError,
  CircuitOpenError,
  DEFAULT_TTL,
  LIVE_STATUSES,
  MemoryCache,
  MissingApiKeyError,
  PLAN_PER_DAY,
  PLAN_PER_MINUTE,
  QuotaExceededError,
  RateLimitError,
  STATUS_LABELS,
  apiFootball,
  countryFlagUrl,
  isFinished,
  isLive,
  isNotStarted,
  leagueLogoUrl,
  playerPhotoUrl,
  teamLogoUrl
});
