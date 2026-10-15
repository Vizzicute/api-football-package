/**
 * types.ts
 * API-Football v3 – Complete TypeScript Type Definitions
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Base URL:  https://v3.football.api-sports.io/{endpoint}        │
 * │  Auth:      Header `x-apisports-key: YOUR_API_KEY`              │
 * │  Docs:      https://www.api-football.com/documentation-v3       │
 * └──────────────────────────────────────────────────────────────────┘
 */
/** Generic API response wrapper used by all endpoints */
interface ApiResponse<T> {
    /** Endpoint name, e.g. "fixtures" */
    get: string;
    /** Echo of request parameters */
    parameters: Record<string, string> | never[];
    /** Error object (empty array when no errors) */
    errors: Record<string, string> | never[];
    /** Number of results returned */
    results: number;
    /** Pagination info */
    paging: {
        current: number;
        total: number;
    };
    /** The actual response data */
    response: T;
}
interface StatusResponse {
    account: {
        firstname: string;
        lastname: string;
        email: string;
    };
    subscription: {
        plan: string;
        end: string;
        active: boolean;
    };
    requests: {
        current: number;
        limit_day: number;
    };
}
/** Response is simply string[] – no separate type needed */
interface Country {
    name: string;
    /** ISO code, e.g. "GB", "FR" */
    code: string | null;
    /** Flag SVG URL: https://media.api-sports.io/flags/{code}.svg */
    flag: string | null;
}
interface LeagueInfo {
    id: number;
    name: string;
    /** "League" or "Cup" */
    type: string;
    /** Logo URL */
    logo: string;
}
interface SeasonCoverage {
    fixtures: {
        events: boolean;
        lineups: boolean;
        statistics_fixtures: boolean;
        statistics_players: boolean;
    };
    standings: boolean;
    players: boolean;
    top_scorers: boolean;
    top_assists: boolean;
    top_cards: boolean;
    injuries: boolean;
    predictions: boolean;
    odds: boolean;
}
interface Season {
    year: number;
    start: string;
    end: string;
    current: boolean;
    coverage: SeasonCoverage;
}
interface LeagueEntry {
    league: LeagueInfo;
    country: Country;
    seasons: Season[];
}
interface TeamInfo {
    id: number;
    name: string;
    /** Tri-code, e.g. "MUN", "BAR" */
    code: string | null;
    country: string;
    founded: number | null;
    national: boolean;
    /** Logo URL */
    logo: string;
}
interface Venue {
    id: number;
    name: string;
    address: string | null;
    city: string;
    capacity: number;
    surface: string | null;
    /** Photo URL */
    image: string;
}
interface TeamEntry {
    team: TeamInfo;
    venue: Venue;
}
interface WinDrawLoss {
    home: number;
    away: number;
    total: number;
}
interface GoalMinutePeriod {
    total: number | null;
    percentage: string | null;
}
interface TeamStatistics {
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
    };
    team: {
        id: number;
        name: string;
        logo: string;
    };
    /** Form string, e.g. "WDLWW" */
    form: string;
    fixtures: {
        played: WinDrawLoss;
        wins: WinDrawLoss;
        draws: WinDrawLoss;
        loses: WinDrawLoss;
    };
    goals: {
        for: {
            total: WinDrawLoss;
            average: {
                home: string;
                away: string;
                total: string;
            };
            minute: Record<string, GoalMinutePeriod>;
            under_over: Record<string, {
                over: number;
                under: number;
            }>;
        };
        against: {
            total: WinDrawLoss;
            average: {
                home: string;
                away: string;
                total: string;
            };
            minute: Record<string, GoalMinutePeriod>;
            under_over: Record<string, {
                over: number;
                under: number;
            }>;
        };
    };
    biggest: {
        streak: {
            wins: number;
            draws: number;
            loses: number;
        };
        wins: {
            home: string | null;
            away: string | null;
        };
        loses: {
            home: string | null;
            away: string | null;
        };
        goals: {
            for: {
                home: number;
                away: number;
            };
            against: {
                home: number;
                away: number;
            };
        };
    };
    clean_sheet: WinDrawLoss;
    failed_to_score: WinDrawLoss;
    penalty: {
        scored: {
            total: number;
            percentage: string;
        };
        missed: {
            total: number;
            percentage: string;
        };
        total: number;
    };
    lineups: Array<{
        formation: string;
        played: number;
    }>;
    cards: {
        yellow: Record<string, GoalMinutePeriod>;
        red: Record<string, GoalMinutePeriod>;
    };
}
interface StandingRecord {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
        for: number;
        against: number;
    };
}
interface StandingRow {
    rank: number;
    team: {
        id: number;
        name: string;
        logo: string;
    };
    points: number;
    goalsDiff: number;
    group: string;
    /** Last 5 results: "WDLWW" */
    form: string;
    /** e.g. "Promotion - Champions League" or null */
    status: string;
    /** Qualification/relegation description */
    description: string | null;
    all: StandingRecord;
    home: StandingRecord;
    away: StandingRecord;
    update: string;
}
interface StandingsEntry {
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
        /** Array of groups arrays. Most leagues have 1 group. */
        standings: StandingRow[][];
    };
}
/** Fixture short status codes */
type FixtureStatusShort = "TBD" | "NS" | "1H" | "HT" | "2H" | "ET" | "BT" | "P" | "SUSP" | "INT" | "FT" | "AET" | "PEN" | "PST" | "CANC" | "ABD" | "AWD" | "WO" | "LIVE";
/** Fixture long status labels */
type FixtureStatusLong = "Time to Be Defined" | "Not Started" | "First Half, Kick Off" | "Halftime" | "Second Half, 2nd Half Started" | "Extra Time" | "Break Time" | "Penalty In Progress" | "Match Suspended" | "Match Interrupted" | "Match Finished" | "Match Finished After Extra Time" | "Match Finished After Penalty" | "Match Postponed" | "Match Cancelled" | "Match Abandoned" | "Technical Loss" | "WalkOver" | "In Progress";
interface FixtureStatus {
    long: FixtureStatusLong;
    short: FixtureStatusShort;
    /** Minutes elapsed (null if not started) */
    elapsed: number | null;
    /** Added/extra time within a period (e.g., stoppage time) */
    extra: number | null;
}
interface FixturePeriods {
    first: number | null;
    second: number | null;
}
interface FixtureScore {
    halftime: {
        home: number | null;
        away: number | null;
    };
    fulltime: {
        home: number | null;
        away: number | null;
    };
    extratime: {
        home: number | null;
        away: number | null;
    };
    penalty: {
        home: number | null;
        away: number | null;
    };
}
interface FixtureTeam {
    id: number;
    name: string;
    logo: string;
    winner: boolean | null;
}
interface FixtureGoals {
    home: number | null;
    away: number | null;
}
interface Fixture {
    fixture: {
        id: number;
        referee: string | null;
        timezone: string;
        /** ISO datetime string */
        date: string;
        /** Unix timestamp */
        timestamp: number;
        periods: FixturePeriods;
        venue: {
            id: number | null;
            name: string;
            city: string;
        };
        status: FixtureStatus;
        /** Whether standings are available for this competition */
        standings: boolean;
        /** Extra time per half if applicable */
        extra: {
            first_half: number | null;
            second_half: number | null;
        } | null;
    };
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string | null;
        season: number;
        round: string;
    };
    teams: {
        home: FixtureTeam;
        away: FixtureTeam;
    };
    goals: FixtureGoals;
    score: FixtureScore;
}
/** Event types: "Goal", "Card", "subst", "Var" */
type FixtureEventType = "Goal" | "Card" | "subst" | "Var";
/** Goal details */
type GoalDetail = "Normal Goal" | "Own Goal" | "Penalty" | "Missed Penalty";
/** Card details */
type CardDetail = "Yellow Card" | "Second Yellow card" | "Red Card";
/** Substitution details */
type SubstDetail = `Substitution ${1 | 2 | 3 | 4 | 5 | 6}`;
interface FixtureEvent {
    time: {
        /** Minute of the event */
        elapsed: number;
        /** Additional minutes (stoppage time), null if none */
        extra: number | null;
    };
    team: {
        id: number;
        name: string;
        logo: string;
    };
    player: {
        id: number;
        name: string;
    };
    /** For substitution: player coming on. For assists: assisting player */
    assist: {
        id: number | null;
        name: string | null;
    };
    type: FixtureEventType;
    detail: string;
    comments: string | null;
}
interface LineupPlayer {
    id: number;
    name: string;
    /** Jersey number */
    number: number;
    /** Position: G=Goalkeeper, D=Defender, M=Midfielder, F=Forward */
    pos: "G" | "D" | "M" | "F";
    /** Grid position, e.g. "1:1", "2:3" */
    grid: string | null;
}
interface LineupColors {
    player: {
        primary: string;
        number: string;
        border: string;
    };
    goalkeeper: {
        primary: string;
        number: string;
        border: string;
    };
}
interface FixtureLineup {
    team: {
        id: number;
        name: string;
        logo: string;
        colors: LineupColors | null;
    };
    /** Formation, e.g. "4-3-3" */
    formation: string;
    startXI: Array<{
        player: LineupPlayer;
    }>;
    substitutes: Array<{
        player: LineupPlayer;
    }>;
    coach: {
        id: number;
        name: string;
        photo: string;
    };
}
interface StatisticItem {
    /** e.g. "Shots on Goal", "Ball Possession", "Corner Kicks" */
    type: string;
    value: number | string | null;
}
interface FixtureStatistics {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    statistics: StatisticItem[];
}
/** Known statistic type names */
type StatisticType = "Shots on Goal" | "Shots off Goal" | "Total Shots" | "Blocked Shots" | "Shots insidebox" | "Shots outsidebox" | "Fouls" | "Corner Kicks" | "Offsides" | "Ball Possession" | "Yellow Cards" | "Red Cards" | "Goalkeeper Saves" | "Total passes" | "Passes accurate" | "Passes %" | "expected_goals";
interface FixturePlayerStats {
    games: {
        minutes: number | null;
        number: number | null;
        position: string;
        rating: string | null;
        captain: boolean;
        substitute: boolean;
    };
    offsides: number | null;
    shots: {
        total: number | null;
        on: number | null;
    };
    goals: {
        total: number | null;
        conceded: number | null;
        assists: number | null;
        saves: number | null;
    };
    passes: {
        total: number | null;
        key: number | null;
        accuracy: string | null;
    };
    tackles: {
        total: number | null;
        blocks: number | null;
        interceptions: number | null;
    };
    duels: {
        total: number | null;
        won: number | null;
    };
    dribbles: {
        attempts: number | null;
        success: number | null;
        past: number | null;
    };
    fouls: {
        drawn: number | null;
        committed: number | null;
    };
    cards: {
        yellow: number;
        yellowred: number;
        red: number;
    };
    penalty: {
        won: number | null;
        commited: number | null;
        scored: number;
        missed: number;
        saved: number | null;
    };
}
interface FixturePlayerEntry {
    player: {
        id: number;
        name: string;
        photo: string;
    };
    statistics: FixturePlayerStats[];
}
interface FixturePlayersEntry {
    team: {
        id: number;
        name: string;
        logo: string;
        update: string;
    };
    players: FixturePlayerEntry[];
}
interface Injury {
    player: {
        id: number;
        name: string;
        photo: string;
        /** Injury type, e.g. "Knee Injury", "Hamstring" */
        type: string;
        /** Reason/detail */
        reason: string;
    };
    team: {
        id: number;
        name: string;
        logo: string;
    };
    fixture: {
        id: number;
        timezone: string;
        date: string;
        timestamp: number;
    };
    league: {
        id: number;
        season: number;
        name: string;
        country: string;
        logo: string;
        flag: string | null;
    };
}
interface PredictionPercent {
    home: string;
    draw: string;
    away: string;
}
interface PredictionComparison {
    form: {
        home: string;
        away: string;
    };
    att: {
        home: string;
        away: string;
    };
    def: {
        home: string;
        away: string;
    };
    poisson_distribution: {
        home: string;
        away: string;
    };
    h2h: {
        home: string;
        away: string;
    };
    goals: {
        home: string;
        away: string;
    };
    total: {
        home: string;
        away: string;
    };
}
interface Prediction {
    predictions: {
        winner: {
            id: number;
            name: string;
            comment: string;
        } | null;
        win_or_draw: boolean;
        under_over: string | null;
        goals: {
            home: string;
            away: string;
        };
        advice: string;
        percent: PredictionPercent;
    };
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
    };
    teams: {
        home: {
            id: number;
            name: string;
            logo: string;
            last_5: {
                form: string;
                att: string;
                def: string;
                goals: {
                    for: {
                        total: number;
                        average: string;
                    };
                    against: {
                        total: number;
                        average: string;
                    };
                };
            };
            league: {
                form: string;
                fixtures: any;
                goals: any;
                biggest: any;
                clean_sheet: any;
                failed_to_score: any;
            };
        };
        away: {
            id: number;
            name: string;
            logo: string;
            last_5: {
                form: string;
                att: string;
                def: string;
                goals: {
                    for: {
                        total: number;
                        average: string;
                    };
                    against: {
                        total: number;
                        average: string;
                    };
                };
            };
            league: {
                form: string;
                fixtures: any;
                goals: any;
                biggest: any;
                clean_sheet: any;
                failed_to_score: any;
            };
        };
    };
    comparison: PredictionComparison;
    h2h: Fixture[];
}
interface CoachCareer {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    start: string;
    end: string | null;
}
interface Coach {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
        date: string;
        place: string | null;
        country: string;
    };
    nationality: string;
    height: string | null;
    weight: string | null;
    photo: string;
    team: {
        id: number;
        name: string;
        logo: string;
    };
    career: CoachCareer[];
}
interface PlayerInfo {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
        date: string;
        place: string | null;
        country: string;
    };
    nationality: string;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
}
interface PlayerSeasonStats {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string | null;
        season: number;
    };
    games: {
        appearences: number | null;
        lineups: number | null;
        minutes: number | null;
        number: number | null;
        position: string;
        rating: string | null;
        captain: boolean;
    };
    substitutes: {
        in: number | null;
        out: number | null;
        bench: number | null;
    };
    shots: {
        total: number | null;
        on: number | null;
    };
    goals: {
        total: number | null;
        conceded: number | null;
        assists: number | null;
        saves: number | null;
    };
    passes: {
        total: number | null;
        key: number | null;
        accuracy: number | null;
    };
    tackles: {
        total: number | null;
        blocks: number | null;
        interceptions: number | null;
    };
    duels: {
        total: number | null;
        won: number | null;
    };
    dribbles: {
        attempts: number | null;
        success: number | null;
        past: number | null;
    };
    fouls: {
        drawn: number | null;
        committed: number | null;
    };
    cards: {
        yellow: number;
        yellowred: number;
        red: number;
    };
    penalty: {
        won: number | null;
        commited: number | null;
        scored: number;
        missed: number;
        saved: number | null;
    };
}
interface PlayerEntry {
    player: PlayerInfo;
    statistics: PlayerSeasonStats[];
}
/** Profile variant (from GET /players/profiles) */
interface PlayerProfile {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
        date: string;
        place: string | null;
        country: string;
    };
    nationality: string;
    height: string | null;
    weight: string | null;
    injured: boolean;
    photo: string;
}
interface SquadPlayer {
    id: number;
    name: string;
    age: number;
    number: number | null;
    position: string;
    photo: string;
}
interface SquadEntry {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    players: SquadPlayer[];
}
interface PlayerTeamSeason {
    season: number;
    team: {
        id: number;
        name: string;
        logo: string;
    };
}
interface PlayerTeamEntry {
    player: {
        id: number;
        name: string;
        photo: string;
    };
    teams: PlayerTeamSeason[];
}
interface Transfer {
    date: string;
    /** Transfer type: e.g. "€20M", "Free", "Loan", "N/A" */
    type: string;
    teams: {
        in: {
            id: number;
            name: string;
            logo: string;
        };
        out: {
            id: number;
            name: string;
            logo: string;
        };
    };
}
interface TransferEntry {
    player: {
        id: number;
        name: string;
    };
    update: string;
    transfers: Transfer[];
}
interface Trophy {
    league: string;
    country: string;
    season: string;
    /** "Winner" | "Runner-up" | etc. */
    place: string;
}
interface SidelinedEntry {
    /** Injury/suspension type */
    type: string;
    /** Start date "YYYY-MM-DD" */
    start: string;
    /** End date "YYYY-MM-DD" or null if ongoing */
    end: string | null;
}
interface OddValue {
    value: string;
    odd: string;
    handicap: string | null;
    main: boolean | null;
    suspended: boolean;
}
interface Bet {
    id: number;
    name: string;
    values: OddValue[];
}
interface OddsBookmaker {
    id: number;
    name: string;
    bets: Bet[];
}
interface OddsEntry {
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
    };
    fixture: {
        id: number;
        timezone: string;
        date: string;
        timestamp: number;
    };
    update: string;
    bookmakers: OddsBookmaker[];
}
interface OddsMapping {
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
    };
    fixture: {
        id: number;
        date: string;
    };
    update: string;
}
interface Bookmaker {
    id: number;
    name: string;
}
interface BetType {
    id: number;
    name: string;
}
interface OddsLiveBet {
    id: number;
    name: string;
    values: OddValue[];
}
interface OddsLiveBookmaker {
    id: number;
    name: string;
    bets: OddsLiveBet[];
}
interface OddsLiveEntry {
    league: {
        id: number;
        name: string;
        country: string;
        logo: string;
        flag: string;
        season: number;
    };
    fixture: {
        id: number;
        status: FixtureStatus;
        update: string;
    };
    bookmakers: OddsLiveBookmaker[];
}
/** Fixture status states that indicate a match is currently live */
declare const LIVE_STATUSES: FixtureStatusShort[];
/** Check if a fixture is live */
declare function isLive(status: FixtureStatusShort): boolean;
/** Check if a fixture has finished */
declare function isFinished(status: FixtureStatusShort): boolean;
/** Check if a fixture has not started */
declare function isNotStarted(status: FixtureStatusShort): boolean;
/** Build media URL for team logo */
declare function teamLogoUrl(teamId: number): string;
/** Build media URL for player photo */
declare function playerPhotoUrl(playerId: number): string;
/** Build media URL for league logo */
declare function leagueLogoUrl(leagueId: number): string;
/** Build media URL for country flag */
declare function countryFlagUrl(countryCode: string): string;
/** Human-readable status label mapping */
declare const STATUS_LABELS: Record<FixtureStatusShort, string>;

type LeagueSeason = {
    league: number;
    season: number;
} | {
    league?: undefined;
    season?: undefined;
};
interface Page {
    page?: number;
}
interface LeaguesParams {
    id?: number;
    name?: string;
    country?: string;
    code?: string;
    season?: number;
    team?: number;
    type?: "league" | "cup";
    current?: boolean;
    search?: string;
    last?: number;
}
type TeamsParams = ({
    id: number;
} | {
    name: string;
} | {
    league: number;
    season: number;
} | {
    country: string;
} | {
    search: string;
}) & {
    code?: string;
    venue?: number;
};
interface TeamStatisticsParams {
    league: number;
    season: number;
    team: number;
    date?: string;
}
type VenuesParams = {
    id: number;
} | {
    name: string;
} | {
    city: string;
} | {
    country: string;
} | {
    search: string;
};
interface StandingsParams {
    league: number;
    season: number;
    team?: number;
}
type FixturesParams = {
    id?: number;
    ids?: string;
    live?: "all" | string;
    date?: string;
    team?: number;
    last?: number;
    next?: number;
    from?: string;
    to?: string;
    round?: string;
    status?: string;
    venue?: number;
    timezone?: string;
} & LeagueSeason;
interface RoundsParams {
    league: number;
    season: number;
    current?: boolean;
    dates?: boolean;
}
interface HeadToHeadParams {
    h2h: `${number}-${number}`;
    date?: string;
    league?: number;
    season?: number;
    last?: number;
    from?: string;
    to?: string;
    status?: string;
    venue?: number;
    timezone?: string;
}
interface FixtureStatsParams {
    fixture: number;
    team?: number;
    type?: string;
    half?: boolean;
}
interface FixtureEventsParams {
    fixture: number;
    team?: number;
    player?: number;
    type?: "Goal" | "Card" | "subst" | "Var";
}
interface FixtureLineupsParams {
    fixture: number;
    team?: number;
    player?: number;
    type?: "startXI" | "substitutes";
}
interface FixturePlayersParams {
    fixture: number;
    team?: number;
}
type InjuriesParams = ({
    league: number;
    season: number;
} | {
    fixture: number;
} | {
    team: number;
    season: number;
} | {
    player: number;
    season: number;
} | {
    date: string;
}) & {
    timezone?: string;
};
interface PredictionsParams {
    fixture: number;
}
type CoachsParams = {
    id: number;
} | {
    team: number;
} | {
    search: string;
};
type PlayersParams = {
    season: number;
} & ({
    id: number;
} | {
    team: number;
} | {
    league: number;
} | {
    search: string;
}) & Page;
interface PlayerProfilesParams extends Page {
    player?: number;
    search?: string;
}
type SquadsParams = {
    team: number;
} | {
    player: number;
};
interface TopParams {
    league: number;
    season: number;
}
type TransfersParams = {
    player: number;
} | {
    team: number;
};
type TrophiesParams = {
    player: number;
} | {
    coach: number;
};
type SidelinedParams = {
    player: number;
} | {
    coach: number;
};
interface OddsLiveParams {
    fixture?: number;
    league?: number;
    bet?: number;
}
type OddsParams = ({
    fixture: number;
} | {
    league: number;
    season: number;
} | {
    date: string;
}) & Page & {
    timezone?: string;
    bookmaker?: number;
    bet?: number;
};
interface IdSearch {
    id?: number;
    search?: string;
}

declare const PLAN_PER_MINUTE: {
    readonly free: 10;
    readonly pro: 300;
    readonly ultra: 450;
    readonly mega: 900;
    readonly custom: 1200;
};
declare const PLAN_PER_DAY: {
    readonly free: 100;
    readonly pro: 7500;
    readonly ultra: 75000;
    readonly mega: 150000;
};
type Plan = keyof typeof PLAN_PER_MINUTE;

interface CacheEntry {
    value: unknown;
    expiresAt: number;
}
/** Implement this for Redis / Next.js cache / anything shared. */
interface CacheStore {
    get(key: string): Promise<CacheEntry | undefined>;
    /** ttlSeconds = how long to retain the entry (the client tracks freshness itself). */
    set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}
declare class MemoryCache implements CacheStore {
    private maxEntries;
    private m;
    constructor(maxEntries?: number);
    get(key: string): Promise<CacheEntry | undefined>;
    set(key: string, value: unknown, ttlSeconds: number): Promise<void>;
}
/** Default TTLs (seconds) per endpoint, from the API-Football guidance. */
declare const DEFAULT_TTL: Record<string, number>;

interface ApiFootballOptions {
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
declare class ApiFootball {
    private opts;
    private limiter;
    private breaker;
    private cache;
    private inflight;
    private ttl;
    constructor(opts?: ApiFootballOptions);
    private key;
    private ttlFor;
    request<R>(endpoint: string, params?: object): Promise<ApiResponse<R>>;
    private fetchOnce;
    /** Requests left today according to the last response (undefined until first call). */
    get remainingToday(): number | undefined;
    getStatus(): Promise<ApiResponse<StatusResponse>>;
    getTimezones(): Promise<ApiResponse<string[]>>;
    getCountries(p?: {
        name?: string;
        code?: string;
        search?: string;
    }): Promise<ApiResponse<Country[]>>;
    getLeagues(p?: LeaguesParams): Promise<ApiResponse<LeagueEntry[]>>;
    getLeagueSeasons(): Promise<ApiResponse<number[]>>;
    getTeams(p: TeamsParams): Promise<ApiResponse<TeamEntry[]>>;
    getTeamStatistics(p: TeamStatisticsParams): Promise<ApiResponse<TeamStatistics>>;
    getTeamSeasons(p: {
        team: number;
    }): Promise<ApiResponse<number[]>>;
    getTeamCountries(): Promise<ApiResponse<Country[]>>;
    getVenues(p: VenuesParams): Promise<ApiResponse<Venue[]>>;
    getStandings(p: StandingsParams): Promise<ApiResponse<StandingsEntry[]>>;
    getFixtures(p: FixturesParams): Promise<ApiResponse<Fixture[]>>;
    getLiveFixtures(leagues?: number[]): Promise<ApiResponse<Fixture[]>>;
    getFixtureRounds(p: RoundsParams): Promise<ApiResponse<string[]>>;
    getHeadToHead(p: HeadToHeadParams): Promise<ApiResponse<Fixture[]>>;
    getFixtureStatistics(p: FixtureStatsParams): Promise<ApiResponse<FixtureStatistics[]>>;
    getFixtureEvents(p: FixtureEventsParams): Promise<ApiResponse<FixtureEvent[]>>;
    getFixtureLineups(p: FixtureLineupsParams): Promise<ApiResponse<FixtureLineup[]>>;
    getFixturePlayers(p: FixturePlayersParams): Promise<ApiResponse<FixturePlayersEntry[]>>;
    getInjuries(p: InjuriesParams): Promise<ApiResponse<Injury[]>>;
    getPredictions(p: PredictionsParams): Promise<ApiResponse<Prediction[]>>;
    getCoaches(p: CoachsParams): Promise<ApiResponse<Coach[]>>;
    getPlayers(p: PlayersParams): Promise<ApiResponse<PlayerEntry[]>>;
    getPlayerProfiles(p?: PlayerProfilesParams): Promise<ApiResponse<PlayerProfile[]>>;
    getPlayerSeasons(p?: {
        player?: number;
    }): Promise<ApiResponse<number[]>>;
    getSquads(p: SquadsParams): Promise<ApiResponse<SquadEntry[]>>;
    getPlayerTeams(p: {
        player: number;
    }): Promise<ApiResponse<PlayerTeamEntry[]>>;
    getTopScorers(p: TopParams): Promise<ApiResponse<PlayerEntry[]>>;
    getTopAssists(p: TopParams): Promise<ApiResponse<PlayerEntry[]>>;
    getTopYellowCards(p: TopParams): Promise<ApiResponse<PlayerEntry[]>>;
    getTopRedCards(p: TopParams): Promise<ApiResponse<PlayerEntry[]>>;
    getTransfers(p: TransfersParams): Promise<ApiResponse<TransferEntry[]>>;
    getTrophies(p: TrophiesParams): Promise<ApiResponse<Trophy[]>>;
    getSidelined(p: SidelinedParams): Promise<ApiResponse<SidelinedEntry[]>>;
    getLiveOdds(p?: OddsLiveParams): Promise<ApiResponse<OddsLiveEntry[]>>;
    getLiveBetTypes(p?: IdSearch): Promise<ApiResponse<BetType[]>>;
    getOdds(p: OddsParams): Promise<ApiResponse<OddsEntry[]>>;
    getOddsMapping(p?: Page): Promise<ApiResponse<OddsMapping[]>>;
    getBookmakers(p?: IdSearch): Promise<ApiResponse<Bookmaker[]>>;
    getBetTypes(p?: IdSearch): Promise<ApiResponse<BetType[]>>;
}

declare class ApiFootballError extends Error {
    readonly status?: number | undefined;
    readonly details?: unknown | undefined;
    constructor(message: string, status?: number | undefined, details?: unknown | undefined);
}
/** Per-minute limit hit (HTTP 429 or errors.rateLimit). */
declare class RateLimitError extends ApiFootballError {
}
/** Daily quota exhausted, or our own safety reserve reached. */
declare class QuotaExceededError extends ApiFootballError {
}
/** Too many consecutive upstream failures; calls are paused. */
declare class CircuitOpenError extends ApiFootballError {
}
/** HTTP 200 but the body carried an `errors` payload (bad params, plan limits...). */
declare class ApiResponseError extends ApiFootballError {
}
/** API_FOOTBALL_KEY missing. */
declare class MissingApiKeyError extends ApiFootballError {
}

/** Ready-to-use instance; reads API_FOOTBALL_KEY lazily on first request. */
declare const apiFootball: ApiFootball;

export { ApiFootball, ApiFootballError, type ApiFootballOptions, type ApiResponse, ApiResponseError, type Bet, type BetType, type Bookmaker, type CacheEntry, type CacheStore, type CardDetail, CircuitOpenError, type Coach, type CoachCareer, type CoachsParams, type Country, DEFAULT_TTL, type Fixture, type FixtureEvent, type FixtureEventType, type FixtureEventsParams, type FixtureGoals, type FixtureLineup, type FixtureLineupsParams, type FixturePeriods, type FixturePlayerEntry, type FixturePlayerStats, type FixturePlayersEntry, type FixturePlayersParams, type FixtureScore, type FixtureStatistics, type FixtureStatsParams, type FixtureStatus, type FixtureStatusLong, type FixtureStatusShort, type FixtureTeam, type FixturesParams, type GoalDetail, type GoalMinutePeriod, type HeadToHeadParams, type IdSearch, type InjuriesParams, type Injury, LIVE_STATUSES, type LeagueEntry, type LeagueInfo, type LeaguesParams, type LineupColors, type LineupPlayer, MemoryCache, MissingApiKeyError, type OddValue, type OddsBookmaker, type OddsEntry, type OddsLiveBet, type OddsLiveBookmaker, type OddsLiveEntry, type OddsLiveParams, type OddsMapping, type OddsParams, PLAN_PER_DAY, PLAN_PER_MINUTE, type Page, type Plan, type PlayerEntry, type PlayerInfo, type PlayerProfile, type PlayerProfilesParams, type PlayerSeasonStats, type PlayerTeamEntry, type PlayerTeamSeason, type PlayersParams, type Prediction, type PredictionComparison, type PredictionPercent, type PredictionsParams, QuotaExceededError, RateLimitError, type RoundsParams, STATUS_LABELS, type Season, type SeasonCoverage, type SidelinedEntry, type SidelinedParams, type SquadEntry, type SquadPlayer, type SquadsParams, type StandingRecord, type StandingRow, type StandingsEntry, type StandingsParams, type StatisticItem, type StatisticType, type StatusResponse, type SubstDetail, type TeamEntry, type TeamInfo, type TeamStatistics, type TeamStatisticsParams, type TeamsParams, type TopParams, type Transfer, type TransferEntry, type TransfersParams, type TrophiesParams, type Trophy, type Venue, type VenuesParams, type WinDrawLoss, apiFootball, countryFlagUrl, isFinished, isLive, isNotStarted, leagueLogoUrl, playerPhotoUrl, teamLogoUrl };
