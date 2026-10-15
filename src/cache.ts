export interface CacheEntry { value: unknown; expiresAt: number }

/** Implement this for Redis / Next.js cache / anything shared. */
export interface CacheStore {
  get(key: string): Promise<CacheEntry | undefined>;
  /** ttlSeconds = how long to retain the entry (the client tracks freshness itself). */
  set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}

export class MemoryCache implements CacheStore {
  private m = new Map<string, CacheEntry>();
  constructor(private maxEntries = 5000) {}
  async get(key: string) { return this.m.get(key); }
  async set(key: string, value: unknown, ttlSeconds: number) {
    if (this.m.size >= this.maxEntries) this.m.delete(this.m.keys().next().value as string);
    this.m.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
  }
}

/** Default TTLs (seconds) per endpoint, from the API-Football guidance. */
export const DEFAULT_TTL: Record<string, number> = {
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
  odds: 900,
};
