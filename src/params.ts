type LeagueSeason = { league: number; season: number } | { league?: undefined; season?: undefined };

export interface Page { page?: number }
export interface LeaguesParams {
  id?: number; name?: string; country?: string; code?: string; season?: number;
  team?: number; type?: "league" | "cup"; current?: boolean; search?: string; last?: number;
}
export type TeamsParams = (
  | { id: number } | { name: string } | { league: number; season: number }
  | { country: string } | { search: string }
) & { code?: string; venue?: number };
export interface TeamStatisticsParams { league: number; season: number; team: number; date?: string }
export type VenuesParams = { id: number } | { name: string } | { city: string } | { country: string } | { search: string };
export interface StandingsParams { league: number; season: number; team?: number }
export type FixturesParams = {
  id?: number; ids?: string; live?: "all" | string; date?: string; team?: number;
  last?: number; next?: number; from?: string; to?: string; round?: string;
  status?: string; venue?: number; timezone?: string;
} & LeagueSeason;
export interface RoundsParams { league: number; season: number; current?: boolean; dates?: boolean }
export interface HeadToHeadParams {
  h2h: `${number}-${number}`; date?: string; league?: number; season?: number; last?: number;
  from?: string; to?: string; status?: string; venue?: number; timezone?: string;
}
export interface FixtureStatsParams { fixture: number; team?: number; type?: string; half?: boolean }
export interface FixtureEventsParams { fixture: number; team?: number; player?: number; type?: "Goal" | "Card" | "subst" | "Var" }
export interface FixtureLineupsParams { fixture: number; team?: number; player?: number; type?: "startXI" | "substitutes" }
export interface FixturePlayersParams { fixture: number; team?: number }
export type InjuriesParams = ({ league: number; season: number } | { fixture: number } | { team: number; season: number } | { player: number; season: number } | { date: string })
  & { timezone?: string };
export interface PredictionsParams { fixture: number }
export type CoachsParams = { id: number } | { team: number } | { search: string };
export type PlayersParams = { season: number } & ({ id: number } | { team: number } | { league: number } | { search: string }) & Page;
export interface PlayerProfilesParams extends Page { player?: number; search?: string }
export type SquadsParams = { team: number } | { player: number };
export interface TopParams { league: number; season: number }
export type TransfersParams = { player: number } | { team: number };
export type TrophiesParams = { player: number } | { coach: number };
export type SidelinedParams = { player: number } | { coach: number };
export interface OddsLiveParams { fixture?: number; league?: number; bet?: number }
export type OddsParams = ({ fixture: number } | { league: number; season: number } | { date: string })
  & Page & { timezone?: string; bookmaker?: number; bet?: number };
export interface IdSearch { id?: number; search?: string }
