import { ApiFootball } from "./client";

export { ApiFootball, type ApiFootballOptions } from "./client";
export * from "./errors";
export { MemoryCache, type CacheStore, type CacheEntry, DEFAULT_TTL } from "./cache";
export { PLAN_PER_MINUTE, PLAN_PER_DAY, type Plan } from "./limiter";
export type * from "./params";
export * from "./types";

/** Ready-to-use instance; reads API_FOOTBALL_KEY lazily on first request. */
export const apiFootball = new ApiFootball();
