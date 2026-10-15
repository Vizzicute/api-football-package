---
name: api-football-client
description: "Use when a Node.js, Next.js or NestJS task needs football data (livescores, fixtures, standings, predictions, odds, players, transfers) from API-Football v3 via the @vic/api-football package. Covers setup with API_FOOTBALL_KEY, typed method calls, caching, plan-aware rate limiting, daily quota protection, error handling, and the background-worker architecture. Triggers on api-football, api-sports, livescore, football fixtures, rate-limit or quota problems with API-Football."
license: MIT
compatibility: "Node.js 18+. Server-side only. Works in Next.js (App Router and Pages), NestJS and plain Node."
---

# @vic/api-football

Type-safe, rate-limit-aware client for API-Football v3 (`https://v3.football.api-sports.io`). It is an unofficial package.

## Rules for agents

1. **Use the package, never raw `fetch()`** to API-Football in this project. The package handles the auth header, limits, caching and errors.
2. **Server-side only.** Never import it in client components or browser code. In Next.js, wrap it in a module that starts with `import "server-only"`.
3. **Key comes from `API_FOOTBALL_KEY`** in `.env`. Never hard-code a key or log it. The key is read lazily on first request.
4. **Do not send extra headers** (such as `Content-Type`) to the API. The package already sends only `x-apisports-key`.
5. **User traffic must not trigger upstream calls** for live or heavy data. Fetch in a background worker or cron, store the result, and serve users from cache or DB.
6. **Set `plan` to the real subscription**, or the limiter will be too strict (default `free`) or too loose.

## Install and setup

```bash
npm install @vic/api-football
```

```env
API_FOOTBALL_KEY=your_key
```

```ts
import { apiFootball } from "@vic/api-football"; // default instance, free-plan limits

import { ApiFootball } from "@vic/api-football";
export const api = new ApiFootball({ plan: "pro", quotaReserve: 50 }); // custom config
```

Options: `apiKey`, `plan` (`free|pro|ultra|mega|custom`), `rateLimitPerMinute`, `quotaReserve` (default 10), `cache` (`CacheStore | false`), `ttl` (per-endpoint seconds), `timeoutMs` (10000), `baseUrl`.

## Plan limits

| Plan | Per minute | Per day |
|---|---|---|
| free | 10 | 100 |
| pro | 300 | 7,500 |
| ultra | 450 | 75,000 |
| mega | 900 | 150,000 |
| custom | 1,200 (override with `rateLimitPerMinute`) | per contract |

## Calling endpoints

Every method returns the API envelope `{ get, parameters, errors, results, paging, response }`. Read data from `.response`.

```ts
const { response } = await apiFootball.getStandings({ league: 39, season: 2024 });
const live = await apiFootball.getLiveFixtures();           // all live matches
const one = await apiFootball.getLiveFixtures([39, 61]);    // specific leagues
```

| Area | Methods |
|---|---|
| Account (free, uncounted) | `getStatus` |
| Reference | `getTimezones`, `getCountries`, `getLeagues`, `getLeagueSeasons` |
| Teams/venues | `getTeams`, `getTeamStatistics`, `getTeamSeasons`, `getTeamCountries`, `getVenues` |
| Standings | `getStandings` |
| Fixtures | `getFixtures`, `getLiveFixtures`, `getFixtureRounds`, `getHeadToHead`, `getFixtureStatistics`, `getFixtureEvents`, `getFixtureLineups`, `getFixturePlayers` |
| Other | `getInjuries`, `getPredictions`, `getCoaches` |
| Players | `getPlayers`, `getPlayerProfiles`, `getPlayerSeasons`, `getSquads`, `getPlayerTeams`, `getTopScorers`, `getTopAssists`, `getTopYellowCards`, `getTopRedCards` |
| Transfers etc. | `getTransfers`, `getTrophies`, `getSidelined` |
| Odds | `getOdds`, `getOddsMapping`, `getBookmakers`, `getBetTypes`, `getLiveOdds`, `getLiveBetTypes` |
| Escape hatch | `request<T>(endpoint, params)` |

Param rules (enforced by types, so fix compile errors instead of casting):
- `getStandings`, `getTeamStatistics`, `getTopScorers` need `league` + `season` (and `team` for team stats).
- `getFixtures`: `league` and `season` go together. Other filters: `id`, `ids` (max 20, comma-separated), `date`, `team`, `last`, `next`, `from`+`to`, `round`, `status`, `live`.
- `getHeadToHead({ h2h: "33-34" })`.
- `getPlayers` needs `season` plus one of `id | team | league | search`.
- `getInjuries`, `getOdds`, `getTeams`, `getSquads` need at least one valid identifier combination (see types).

Use `ids` and `date` queries to batch instead of one call per match.

## Caching (on by default, in memory)

Default TTLs: live fixtures 60s, fixtures 300s, events/statistics 60s, lineups 300s, standings 3600s, top scorers/assists 3600s, injuries 1800s, odds 900s, leagues/countries/teams/players/squads/transfers/predictions 86400s. Endpoints not listed (head-to-head, coaches, trophies, sidelined, live odds, status) are not cached unless you set `ttl`.

- Identical concurrent requests share one upstream call.
- Entries are retained 10x their TTL and served stale if the upstream is rate-limited, down, or the circuit is open.
- For serverless or multiple instances, pass a shared store implementing `CacheStore` (`get(key)` returns `{ value, expiresAt }`, `set(key, value, ttlSeconds)`), for example Redis.

## Pagination

`getPlayers`, `getOdds`, `getPlayerProfiles`, `getOddsMapping` return 20 per upstream page (`paging.current` / `paging.total`). Each page costs one request, but each page is cached separately. When building paged UI, loop the upstream pages once (ideally in a worker), store the merged list, and paginate, sort and filter locally. Do not map user pages one-to-one to upstream pages. (`getAll` and `paginate` helpers are not in the package yet.)

## Errors

All extend `ApiFootballError`:

- `MissingApiKeyError`: env var not set.
- `RateLimitError`: HTTP 429 or rate-limit payload. Back off.
- `QuotaExceededError`: daily quota reached or `quotaReserve` hit. Stop polling, serve cached data.
- `CircuitOpenError`: 5 consecutive upstream failures, 30s pause.
- `ApiResponseError`: HTTP 200 with a non-empty `errors` body (bad params, plan restrictions). Inspect `err.details`.

```ts
try { await api.getFixtures({ live: "all" }); }
catch (e) { if (e instanceof QuotaExceededError) { /* serve cache */ } else throw e; }
```

## Framework recipes

**Next.js** (`lib/football.ts`):

```ts
import "server-only";
import { ApiFootball } from "@vic/api-football";
export const football = new ApiFootball({ plan: "pro" });
```

Use in server components or route handlers (`app/api/live/route.ts` returning `Response.json(response)`); browsers poll your route, never API-Football. Use `export const revalidate = 3600` for slow data like standings.

**NestJS**: provide the client through `useFactory` with `ConfigService`:

```ts
{ provide: ApiFootball, inject: [ConfigService],
  useFactory: (c: ConfigService) => new ApiFootball({ apiKey: c.getOrThrow("API_FOOTBALL_KEY"), plan: "pro" }) }
```

Inject `ApiFootball` into services. Run syncs with `@nestjs/schedule` `@Cron` jobs.

## Recommended architecture

```
Users -> your API -> Redis/DB (read only)
Worker/cron -> @vic/api-football -> API-Football
```

- Live fixtures: every ~60s (one call returns all live matches).
- Standings, top scorers: hourly. Leagues, teams, squads: daily.
- Predictions: once per upcoming fixture, then stored.
- Check `season.coverage` from `getLeagues` before requesting lineups, statistics, odds or predictions for a league.
- Run exactly one worker, or guard it with a lock. Limiter and quota counters are per process.

## Helpers and types

Exported types: `Fixture`, `StandingsEntry`, `LeagueEntry`, `Prediction`, `PlayerEntry`, and the param types (`FixturesParams`, `PlayersParams`, ...). Helpers: `isLive`, `isFinished`, `isNotStarted`, `STATUS_LABELS`, `teamLogoUrl`, `playerPhotoUrl`, `leagueLogoUrl`, `countryFlagUrl`, `PLAN_PER_MINUTE`, `PLAN_PER_DAY`.

API quirks kept for fidelity: `appearences` and `commited` are misspelled by the API, and the coaches endpoint is `/coachs` (method `getCoaches`). Many fields can be `null`, so handle them defensively.

Media URLs (logos, photos) do not use quota but are rate-limited, so cache or store them yourself.

## Checklist before finishing a task

- No raw `fetch` to `v3.football.api-sports.io` and no key in client code.
- `plan` matches the subscription.
- Live and heavy data comes from a worker or cache, not from user requests.
- Errors are handled (`QuotaExceededError`, `RateLimitError`) with a stale-data fallback.
