# @vic-octavian/api-football

A type-safe, rate-limit-aware Node.js client for [API-Football v3](https://www.api-football.com/documentation-v3) (api-sports.io). It works in Next.js, NestJS and any Node 18+ application.

> **Unofficial.** This package is not affiliated with or endorsed by API-Football / API-Sports.

Instead of hand-writing `fetch()` calls, you call methods like `apiFootball.getLeagues({ id: 39 })`. The client also protects your account from the things that get API keys blocked: bursts of requests, wasted daily quota, and hammering an unhealthy upstream.

---

## Table of contents

1. [Features](#features)
2. [Installation](#installation)
3. [Setup](#setup)
4. [Quick start](#quick-start)
5. [Configuration](#configuration)
6. [Endpoint reference](#endpoint-reference)
7. [Pagination](#pagination)
8. [Caching](#caching)
9. [Rate limiting and quota protection](#rate-limiting-and-quota-protection)
10. [Error handling](#error-handling)
11. [Next.js guide](#nextjs-guide)
12. [NestJS guide](#nestjs-guide)
13. [Recommended architecture](#recommended-architecture-for-a-livescore-app)
14. [Types and helpers](#types-and-helpers)
15. [Limitations and roadmap](#limitations-and-roadmap)
16. [FAQ](#faq)

---

## Features

- **One method per endpoint**, covering all 38 API-Football v3 endpoints.
- **Typed params and responses.** Required and conditional params are enforced at compile time. For example, `getStandings({ league: 39 })` without `season` will not compile.
- **Per-minute rate limiter** that matches your plan and syncs with the server's rate-limit headers.
- **Daily quota guard** that stops calling before you run out (configurable reserve).
- **Built-in caching** with sensible per-endpoint TTLs and a pluggable store (memory by default, bring your own Redis).
- **Request coalescing.** Identical simultaneous calls become one upstream request.
- **Circuit breaker + stale fallback.** After repeated upstream failures, calls pause and cached data is served if available.
- **Typed errors**, including cases where the API answers HTTP 200 with an `errors` payload.
- **Correct headers.** Only `x-apisports-key` is sent. Extra headers make the API reject requests.
- Dual ESM + CJS build with bundled type declarations.

---

## Installation

```bash
npm install @vic-octavian/api-football
# or
pnpm add @vic-octavian/api-football
yarn add @vic-octavian/api-football
```

Requires **Node.js 18+** (uses the global `fetch` and `AbortSignal.timeout`).

---

## Setup

1. Create an account and get your key at [dashboard.api-football.com](https://dashboard.api-football.com/register).
2. Add it to your `.env`:

```env
API_FOOTBALL_KEY=your_api_key_here
```

3. Never expose this key to the browser. Use the package only in server code (route handlers, server components, API routes, NestJS services, cron jobs).

The key is read **lazily** on the first request, so importing the package never crashes a build if the variable is missing at build time. A missing key throws `MissingApiKeyError` when you actually make a call.

---

## Quick start

```ts
import { apiFootball } from "@vic-octavian/api-football";

// Leagues
const { response: leagues } = await apiFootball.getLeagues({ id: 39, season: 2024 });

// Live matches
const { response: live } = await apiFootball.getLiveFixtures();
for (const m of live) {
  console.log(`${m.teams.home.name} ${m.goals.home}-${m.goals.away} ${m.teams.away.name} (${m.fixture.status.elapsed}')`);
}

// Table
const { response } = await apiFootball.getStandings({ league: 39, season: 2024 });
const table = response[0]?.league.standings[0] ?? [];
```

Every method returns the full API envelope:

```ts
{
  get: string;
  parameters: ...;
  errors: ...;      // already checked; non-empty errors throw
  results: number;
  paging: { current: number; total: number };
  response: T;      // typed per method
}
```

`apiFootball` is a ready-made instance. For custom configuration, create your own (see below).

---

## Configuration

```ts
import { ApiFootball } from "@vic-octavian/api-football";

export const api = new ApiFootball({
  plan: "pro",          // sets the per-minute limit
  quotaReserve: 50,     // stop when this many daily requests remain
  timeoutMs: 8000,
  cache: myRedisStore,  // or `false` to disable caching
  ttl: { standings: 1800, "fixtures:live": 30 },
});
```

| Option | Type | Default | Description |
|---|---|---|---|
| `apiKey` | `string` | `process.env.API_FOOTBALL_KEY` | Your API key. |
| `plan` | `"free" \| "pro" \| "ultra" \| "mega" \| "custom"` | `"free"` | Sets the per-minute limit (10 / 300 / 450 / 900 / 1200). |
| `rateLimitPerMinute` | `number` | from `plan` | Explicit per-minute limit. Overrides `plan` (use it if your custom plan differs). |
| `quotaReserve` | `number` | `10` | Throw `QuotaExceededError` when daily remaining requests fall to this number. |
| `cache` | `CacheStore \| false` | in-memory | Cache backend. `false` disables caching. |
| `ttl` | `Record<string, number>` | see [Caching](#caching) | TTL overrides in seconds, keyed by endpoint. |
| `timeoutMs` | `number` | `10000` | Request timeout. |
| `baseUrl` | `string` | `https://v3.football.api-sports.io` | Override for testing or proxies. |

> Set `plan` to match your real subscription. The default (`free`) is the safest, but it also throttles you to 10 requests per minute.

---

## Endpoint reference

All methods return `Promise<ApiResponse<T>>`. Params shown are the typed inputs.

### Account
| Method | Notes |
|---|---|
| `getStatus()` | Account, plan and usage. **Does not count toward your quota.** |

### Reference
| Method | Params |
|---|---|
| `getTimezones()` | none |
| `getCountries(p?)` | `name`, `code`, `search` |
| `getLeagues(p?)` | `id`, `name`, `country`, `code`, `season`, `team`, `type`, `current`, `search`, `last` |
| `getLeagueSeasons()` | none |

### Teams and venues
| Method | Params |
|---|---|
| `getTeams(p)` | one of `{id}`, `{name}`, `{league, season}`, `{country}`, `{search}`, plus optional `code`, `venue` |
| `getTeamStatistics(p)` | `league`, `season`, `team`, optional `date` |
| `getTeamSeasons({team})` | |
| `getTeamCountries()` | |
| `getVenues(p)` | one of `{id}`, `{name}`, `{city}`, `{country}`, `{search}` |

### Standings
| Method | Params |
|---|---|
| `getStandings(p)` | `league`, `season`, optional `team` |

### Fixtures
| Method | Params |
|---|---|
| `getFixtures(p)` | `id`, `ids`, `live`, `date`, `team`, `last`, `next`, `from`, `to`, `round`, `status`, `venue`, `timezone`. `league` and `season` must be passed together. |
| `getLiveFixtures(leagueIds?)` | optional array of league IDs. Shortcut for `live: "all"` or `"39-61"`. |
| `getFixtureRounds(p)` | `league`, `season`, optional `current`, `dates` |
| `getHeadToHead(p)` | `h2h: "33-34"` (typed as `` `${number}-${number}` ``), plus optional filters |
| `getFixtureStatistics(p)` | `fixture`, optional `team`, `type`, `half` |
| `getFixtureEvents(p)` | `fixture`, optional `team`, `player`, `type` |
| `getFixtureLineups(p)` | `fixture`, optional `team`, `player`, `type` |
| `getFixturePlayers(p)` | `fixture`, optional `team` |

### Injuries, predictions, coaches
| Method | Params |
|---|---|
| `getInjuries(p)` | one of `{league, season}`, `{fixture}`, `{team, season}`, `{player, season}`, `{date}` |
| `getPredictions({fixture})` | |
| `getCoaches(p)` | one of `{id}`, `{team}`, `{search}` |

### Players
| Method | Params |
|---|---|
| `getPlayers(p)` | `season` plus one of `{id}`, `{team}`, `{league}`, `{search}`; optional `page` |
| `getPlayerProfiles(p?)` | `player`, `search`, `page` |
| `getPlayerSeasons(p?)` | `player` |
| `getSquads(p)` | `{team}` or `{player}` |
| `getPlayerTeams({player})` | |
| `getTopScorers(p)` / `getTopAssists(p)` / `getTopYellowCards(p)` / `getTopRedCards(p)` | `league`, `season` |

### Transfers, trophies, sidelined
| Method | Params |
|---|---|
| `getTransfers(p)` | `{player}` or `{team}` |
| `getTrophies(p)` | `{player}` or `{coach}` |
| `getSidelined(p)` | `{player}` or `{coach}` |

### Odds
| Method | Params |
|---|---|
| `getOdds(p)` | one of `{fixture}`, `{league, season}`, `{date}`; optional `page`, `bookmaker`, `bet`, `timezone` |
| `getOddsMapping(p?)` | `page` |
| `getBookmakers(p?)` / `getBetTypes(p?)` | `id`, `search` |
| `getLiveOdds(p?)` | `fixture`, `league`, `bet` |
| `getLiveBetTypes(p?)` | `id`, `search` |

### Escape hatch
For an endpoint or param the package doesn't type yet:

```ts
const res = await apiFootball.request<MyType[]>("some/endpoint", { foo: "bar" });
```

It still goes through the limiter, cache, breaker and error handling.

### Examples

```ts
// Fixtures for a date, in a timezone
await apiFootball.getFixtures({ date: "2025-03-15", timezone: "Africa/Lagos" });

// Next 5 fixtures of a team
await apiFootball.getFixtures({ team: 33, next: 5 });

// A whole league season
await apiFootball.getFixtures({ league: 39, season: 2024 });

// Match centre
const [events, stats, lineups] = await Promise.all([
  apiFootball.getFixtureEvents({ fixture: 215662 }),
  apiFootball.getFixtureStatistics({ fixture: 215662 }),
  apiFootball.getFixtureLineups({ fixture: 215662 }),
]);

// Prediction + head to head
const { response: [prediction] } = await apiFootball.getPredictions({ fixture: 215662 });
console.log(prediction?.predictions.advice, prediction?.predictions.percent);
const h2h = await apiFootball.getHeadToHead({ h2h: "33-34", last: 10 });

// Compile-time errors
// @ts-expect-error season is required
await apiFootball.getStandings({ league: 39 });
// @ts-expect-error league needs season
await apiFootball.getFixtures({ league: 39 });
```

---

## Pagination

`getPlayers`, `getOdds`, `getPlayerProfiles` and `getOddsMapping` return 20 items per page. Use `paging.total` to loop:

```ts
async function allPlayers(team: number, season: number) {
  const out = [];
  let page = 1, total = 1;
  do {
    const res = await apiFootball.getPlayers({ team, season, page });
    out.push(...res.response);
    total = res.paging.total;
    page++;
  } while (page <= total);
  return out;
}
```

Each page is one request against your quota. Cache the result in your own database where you can.

---

## Caching

Caching is on by default (in-memory). It can cut your upstream traffic dramatically.

**Default TTLs (seconds)**

| Key | TTL | Key | TTL |
|---|---|---|---|
| `fixtures:live` (any call with `live`) | 60 | `leagues`, `countries`, `timezone`, `teams` | 86400 |
| `fixtures` | 300 | `teams/statistics` | 3600 |
| `fixtures/events`, `fixtures/statistics` | 60 | `players`, `players/squads` | 86400 |
| `fixtures/lineups` | 300 | `players/topscorers`, `players/topassists` | 3600 |
| `standings` | 3600 | `transfers`, `predictions` | 86400 |
| `injuries` | 1800 | `odds` | 900 |

Endpoints not listed (for example `fixtures/headtohead`, `coachs`, `trophies`, `sidelined`, `odds/live`, `status`) are **not cached** unless you set a TTL:

```ts
new ApiFootball({ ttl: { "fixtures/headtohead": 3600, trophies: 86400 } });
```

**How it behaves**
- Data is considered fresh for its TTL. It is retained 10x longer internally so it can be served **stale** if the upstream is rate-limited, down, or the circuit is open.
- Concurrent identical requests share a single upstream call.

### Using Redis (recommended for serverless / multi-instance)

The in-memory cache is per process. On Vercel or several Nest pods, plug in a shared store by implementing `CacheStore`:

```ts
import Redis from "ioredis";
import { ApiFootball, type CacheStore, type CacheEntry } from "@vic-octavian/api-football";

class RedisCache implements CacheStore {
  constructor(private redis: Redis) {}

  async get(key: string): Promise<CacheEntry | undefined> {
    const raw = await this.redis.get(`apif:${key}`);
    return raw ? (JSON.parse(raw) as CacheEntry) : undefined;
  }

  // ttlSeconds = how long to retain the entry
  async set(key: string, value: unknown, ttlSeconds: number) {
    const entry: CacheEntry = { value, expiresAt: Date.now() + ttlSeconds * 1000 };
    await this.redis.set(`apif:${key}`, JSON.stringify(entry), "EX", ttlSeconds);
  }
}

export const api = new ApiFootball({
  plan: "pro",
  cache: new RedisCache(new Redis(process.env.REDIS_URL!)),
});
```

Disable caching entirely with `cache: false`.

---

## Rate limiting and quota protection

API-Football limits requests per **minute** and per **day** (plan dependent), and may block keys that exceed the per-minute rate, sometimes without notice. The client defends you in three layers:

1. **Per-minute limiter.** A sliding window sized from `plan` (or `rateLimitPerMinute`), using about 90% of the limit as a safety margin. Calls beyond the window wait instead of failing.
2. **Header sync.** After each response the client reads the server's remaining-requests headers. If the server says the minute budget is zero, calls pause for a minute.
3. **Daily quota guard.** When remaining daily requests fall to `quotaReserve`, the client throws `QuotaExceededError` rather than spending your last requests.

```ts
console.log(api.remainingToday); // undefined until the first response
```

Plan limits:

| Plan | Daily | Per minute |
|---|---|---|
| Free | 100 | 10 |
| Pro | 7,500 | 300 |
| Ultra | 75,000 | 450 |
| Mega | 150,000 | 900 |
| Custom | per contract | 1200 |

Important: the limiter and quota counter live **in the memory of one process**. With several instances (serverless, multiple pods), each instance counts separately. Combine a shared cache with a background worker (see [Recommended architecture](#recommended-architecture-for-a-livescore-app)) so that only one place calls the API.

---

## Error handling

All errors extend `ApiFootballError` (`status` and `details` are available when relevant).

| Error | When |
|---|---|
| `MissingApiKeyError` | `API_FOOTBALL_KEY` not set. |
| `RateLimitError` | HTTP 429 or the API's rate-limit error payload. |
| `QuotaExceededError` | Daily quota reached, or your `quotaReserve` was hit. |
| `CircuitOpenError` | 5 consecutive upstream failures; calls pause for 30 seconds. |
| `ApiResponseError` | HTTP 200 with a non-empty `errors` body (invalid params, plan restrictions, and so on). |
| `ApiFootballError` | Network errors, timeouts, 5xx, other HTTP errors. |

```ts
import { apiFootball, RateLimitError, QuotaExceededError, ApiResponseError } from "@vic-octavian/api-football";

try {
  const { response } = await apiFootball.getFixtures({ live: "all" });
} catch (err) {
  if (err instanceof QuotaExceededError) {
    // stop polling until tomorrow; serve cached data
  } else if (err instanceof RateLimitError) {
    // back off
  } else if (err instanceof ApiResponseError) {
    console.error("Bad request:", err.details);
  } else {
    throw err;
  }
}
```

When a cached copy exists, `RateLimitError`, `QuotaExceededError`, `CircuitOpenError` and 5xx failures are **swallowed and the stale copy is returned** instead.

---

## Next.js guide

Keep the client in a server-only module:

```ts
// lib/football.ts
import "server-only";
import { ApiFootball } from "@vic-octavian/api-football";

export const football = new ApiFootball({ plan: "pro" });
```

**Server Component**

```tsx
// app/standings/page.tsx
import { football } from "@/lib/football";

export const revalidate = 3600;

export default async function Page() {
  const { response } = await football.getStandings({ league: 39, season: 2024 });
  const rows = response[0]?.league.standings[0] ?? [];
  return (
    <ol>
      {rows.map((r) => (
        <li key={r.team.id}>{r.rank}. {r.team.name} ({r.points} pts)</li>
      ))}
    </ol>
  );
}
```

**Route Handler** (for client-side polling of your own endpoint, never the provider's)

```ts
// app/api/live/route.ts
import { football } from "@/lib/football";

export async function GET() {
  const { response } = await football.getLiveFixtures();
  return Response.json(response);
}
```

Notes:
- Next.js loads `.env` / `.env.local` automatically.
- On serverless hosting, use a shared cache (Redis) so instances don't each hit the API.
- Your browser clients should poll **your** route, not API-Football.

---

## NestJS guide

**Module**

```ts
// football/football.module.ts
import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiFootball } from "@vic-octavian/api-football";

@Module({
  providers: [
    {
      provide: ApiFootball,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new ApiFootball({
          apiKey: config.getOrThrow<string>("API_FOOTBALL_KEY"),
          plan: "pro",
        }),
    },
  ],
  exports: [ApiFootball],
})
export class FootballModule {}
```

**Service**

```ts
import { Injectable } from "@nestjs/common";
import { ApiFootball } from "@vic-octavian/api-football";

@Injectable()
export class LiveService {
  constructor(private readonly api: ApiFootball) {}

  async liveScores() {
    const { response } = await this.api.getLiveFixtures();
    return response.map((f) => ({
      id: f.fixture.id,
      home: f.teams.home.name,
      away: f.teams.away.name,
      score: `${f.goals.home ?? 0}-${f.goals.away ?? 0}`,
      minute: f.fixture.status.elapsed,
    }));
  }
}
```

**Background sync with `@nestjs/schedule`**

```ts
import { Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { ApiFootball } from "@vic-octavian/api-football";

@Injectable()
export class SyncService {
  constructor(private readonly api: ApiFootball) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async syncLive() {
    const { response } = await this.api.getLiveFixtures();
    // upsert into your DB / Redis here
  }

  @Cron(CronExpression.EVERY_DAY_AT_5AM)
  async syncTodayFixtures() {
    const date = new Date().toISOString().slice(0, 10);
    await this.api.getFixtures({ date });
  }
}
```

A dedicated `ApiFootballModule.forRoot()` is on the roadmap. The provider above is equivalent.

---

## Recommended architecture for a livescore app

The best protection for your quota is to make sure **user traffic never triggers upstream calls**.

```
Users ─▶ Your Next.js / Nest API ─▶ Redis / DB (read only)
                                        ▲
              Background worker ─▶ @vic-octavian/api-football ─▶ API-Football
```

- **Worker/cron** is the only caller of the API (one instance, or guarded by a lock).
- Live fixtures: refresh about every 60 seconds (one call returns all live matches).
- Standings, top scorers: hourly. Leagues, teams, squads: daily.
- Predictions: fetch once per upcoming fixture and store.
- Use `fixtures?ids=` (max 20 per call) and `date` queries to batch instead of one call per match.
- Check `season.coverage` from `getLeagues` before requesting lineups, statistics, odds or predictions for a league.
- Cache logos/photos on your side (`https://media.api-sports.io/...`). They don't use your quota but are rate-limited.

---

## Types and helpers

All response types are exported:

```ts
import type { Fixture, StandingsEntry, LeagueEntry, Prediction, PlayerEntry } from "@vic-octavian/api-football";
```

Param types are exported too (`FixturesParams`, `PlayersParams`, `OddsParams`, ...).

Helpers:

```ts
import { isLive, isFinished, isNotStarted, STATUS_LABELS, teamLogoUrl, playerPhotoUrl, leagueLogoUrl, countryFlagUrl } from "@vic-octavian/api-football";

isLive(fixture.fixture.status.short);          // 1H, HT, 2H, ET, BT, P, INT
STATUS_LABELS[fixture.fixture.status.short];   // "Half Time"
teamLogoUrl(33);                               // https://media.api-sports.io/football/teams/33.png
```

Some field names are misspelled by the API itself and kept as-is for fidelity: `appearences`, `commited`, and the `/coachs` endpoint (exposed as `getCoaches`).

---

## Agent skill (skills.sh)

This repo ships an agent skill so AI coding agents (Claude Code, Cursor, Codex and others) use the package correctly instead of writing raw `fetch()` calls:

```bash
npx skills add Vizzicute/api-football-package --skill api-football-client
```

The skill lives at `skills/api-football-client/SKILL.md`.

---

## Limitations and roadmap

**Current limitations**
- Limiter and quota state are per process (no shared limiter store yet).
- Circuit breaker thresholds (5 failures, 30 s cooldown) are not configurable yet.
- No automatic retries. Failures surface as typed errors.
- Response typing follows the API documentation; fields can differ in practice, so handle `null`s defensively.

**Planned**
- Redis-backed shared limiter and quota counter
- `ApiFootballModule.forRoot()` for NestJS and a Next.js helper package
- Optional runtime response validation (zod)
- Auto-pagination helper
- Retry with backoff and jitter
- Test suite with a mocked fetch

---

## FAQ

**Do I need to add a `Content-Type` header or anything else?**
No. The client sends only `x-apisports-key`. Extra headers make the API reject the request.

**Does `getStatus()` cost quota?**
No. It is free, so it is safe to call to monitor usage.

**Can I use it in the browser?**
No. It would expose your key. Call your own backend instead.

**Why do I get `QuotaExceededError` before 0 requests remain?**
That's the `quotaReserve` safety margin (default 10). Lower it if you prefer.

**My data looks stale.**
Check the TTLs for that endpoint, or pass `ttl` overrides. Live fixtures are cached for 60 seconds by default.

---

## License

MIT
