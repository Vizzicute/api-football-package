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

// ─────────────────────────────────────────────────────────
// GENERIC API RESPONSE
// ─────────────────────────────────────────────────────────

/** Generic API response wrapper used by all endpoints */
export interface ApiResponse<T> {
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

// ─────────────────────────────────────────────────────────
// STATUS
// GET /status  (does NOT count towards daily quota)
// ─────────────────────────────────────────────────────────

export interface StatusResponse {
    account: {
        firstname: string;
        lastname: string;
        email: string;
    };
    subscription: {
        plan: string;
        end: string; // ISO datetime
        active: boolean;
    };
    requests: {
        current: number;
        limit_day: number;
    };
}

// ─────────────────────────────────────────────────────────
// TIMEZONE
// GET /timezone
// ─────────────────────────────────────────────────────────

/** Response is simply string[] – no separate type needed */

// ─────────────────────────────────────────────────────────
// COUNTRIES
// GET /countries
// ─────────────────────────────────────────────────────────

export interface Country {
    name: string;
    /** ISO code, e.g. "GB", "FR" */
    code: string | null;
    /** Flag SVG URL: https://media.api-sports.io/flags/{code}.svg */
    flag: string | null;
}

// ─────────────────────────────────────────────────────────
// LEAGUES
// GET /leagues
// GET /leagues/seasons → number[]
// ─────────────────────────────────────────────────────────

export interface LeagueInfo {
    id: number;
    name: string;
    /** "League" or "Cup" */
    type: string;
    /** Logo URL */
    logo: string;
}

export interface SeasonCoverage {
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

export interface Season {
    year: number;
    start: string; // "YYYY-MM-DD"
    end: string;   // "YYYY-MM-DD"
    current: boolean;
    coverage: SeasonCoverage;
}

export interface LeagueEntry {
    league: LeagueInfo;
    country: Country;
    seasons: Season[];
}

// ─────────────────────────────────────────────────────────
// TEAMS
// GET /teams
// GET /teams/statistics
// GET /teams/seasons → number[]
// GET /teams/countries → Country[]
// ─────────────────────────────────────────────────────────

export interface TeamInfo {
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

export interface Venue {
    id: number;
    name: string;
    address: string | null;
    city: string;
    capacity: number;
    surface: string | null;
    /** Photo URL */
    image: string;
}

export interface TeamEntry {
    team: TeamInfo;
    venue: Venue;
}

// Team Statistics (GET /teams/statistics)

export interface WinDrawLoss {
    home: number;
    away: number;
    total: number;
}

export interface GoalMinutePeriod {
    total: number | null;
    percentage: string | null; // "12.5%"
}

export interface TeamStatistics {
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
            average: { home: string; away: string; total: string };
            minute: Record<string, GoalMinutePeriod>;
            under_over: Record<string, { over: number; under: number }>;
        };
        against: {
            total: WinDrawLoss;
            average: { home: string; away: string; total: string };
            minute: Record<string, GoalMinutePeriod>;
            under_over: Record<string, { over: number; under: number }>;
        };
    };
    biggest: {
        streak: { wins: number; draws: number; loses: number };
        wins: { home: string | null; away: string | null };
        loses: { home: string | null; away: string | null };
        goals: {
            for: { home: number; away: number };
            against: { home: number; away: number };
        };
    };
    clean_sheet: WinDrawLoss;
    failed_to_score: WinDrawLoss;
    penalty: {
        scored: { total: number; percentage: string };
        missed: { total: number; percentage: string };
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

// ─────────────────────────────────────────────────────────
// VENUES
// GET /venues
// ─────────────────────────────────────────────────────────

// Uses the Venue interface defined above

// ─────────────────────────────────────────────────────────
// STANDINGS
// GET /standings
// ─────────────────────────────────────────────────────────

export interface StandingRecord {
    played: number;
    win: number;
    draw: number;
    lose: number;
    goals: {
        for: number;
        against: number;
    };
}

export interface StandingRow {
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
    update: string; // ISO datetime
}

export interface StandingsEntry {
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

// ─────────────────────────────────────────────────────────
// FIXTURES
// GET /fixtures
// GET /fixtures/rounds → string[]
// GET /fixtures/headtohead → Fixture[]
// ─────────────────────────────────────────────────────────

/** Fixture short status codes */
export type FixtureStatusShort =
    | "TBD" | "NS" | "1H" | "HT" | "2H" | "ET" | "BT" | "P"
    | "SUSP" | "INT" | "FT" | "AET" | "PEN" | "PST"
    | "CANC" | "ABD" | "AWD" | "WO" | "LIVE";

/** Fixture long status labels */
export type FixtureStatusLong =
    | "Time to Be Defined" | "Not Started" | "First Half, Kick Off"
    | "Halftime" | "Second Half, 2nd Half Started" | "Extra Time"
    | "Break Time" | "Penalty In Progress" | "Match Suspended"
    | "Match Interrupted" | "Match Finished" | "Match Finished After Extra Time"
    | "Match Finished After Penalty" | "Match Postponed" | "Match Cancelled"
    | "Match Abandoned" | "Technical Loss" | "WalkOver" | "In Progress";

export interface FixtureStatus {
    long: FixtureStatusLong;
    short: FixtureStatusShort;
    /** Minutes elapsed (null if not started) */
    elapsed: number | null;
    /** Added/extra time within a period (e.g., stoppage time) */
    extra: number | null;
}

export interface FixturePeriods {
    first: number | null;  // Unix timestamp of first half start
    second: number | null; // Unix timestamp of second half start
}

export interface FixtureScore {
    halftime: { home: number | null; away: number | null };
    fulltime: { home: number | null; away: number | null };
    extratime: { home: number | null; away: number | null };
    penalty: { home: number | null; away: number | null };
}

export interface FixtureTeam {
    id: number;
    name: string;
    logo: string;
    winner: boolean | null;
}

export interface FixtureGoals {
    home: number | null;
    away: number | null;
}

export interface Fixture {
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

// ─────────────────────────────────────────────────────────
// FIXTURE EVENTS
// GET /fixtures/events
// ─────────────────────────────────────────────────────────

/** Event types: "Goal", "Card", "subst", "Var" */
export type FixtureEventType = "Goal" | "Card" | "subst" | "Var";

/** Goal details */
export type GoalDetail = "Normal Goal" | "Own Goal" | "Penalty" | "Missed Penalty";

/** Card details */
export type CardDetail = "Yellow Card" | "Second Yellow card" | "Red Card";

/** Substitution details */
export type SubstDetail = `Substitution ${1 | 2 | 3 | 4 | 5 | 6}`;

export interface FixtureEvent {
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

// ─────────────────────────────────────────────────────────
// FIXTURE LINEUPS
// GET /fixtures/lineups
// ─────────────────────────────────────────────────────────

export interface LineupPlayer {
    id: number;
    name: string;
    /** Jersey number */
    number: number;
    /** Position: G=Goalkeeper, D=Defender, M=Midfielder, F=Forward */
    pos: "G" | "D" | "M" | "F";
    /** Grid position, e.g. "1:1", "2:3" */
    grid: string | null;
}

export interface LineupColors {
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

export interface FixtureLineup {
    team: {
        id: number;
        name: string;
        logo: string;
        colors: LineupColors | null;
    };
    /** Formation, e.g. "4-3-3" */
    formation: string;
    startXI: Array<{ player: LineupPlayer }>;
    substitutes: Array<{ player: LineupPlayer }>;
    coach: {
        id: number;
        name: string;
        photo: string;
    };
}

// ─────────────────────────────────────────────────────────
// FIXTURE STATISTICS
// GET /fixtures/statistics
// ─────────────────────────────────────────────────────────

export interface StatisticItem {
    /** e.g. "Shots on Goal", "Ball Possession", "Corner Kicks" */
    type: string;
    value: number | string | null;
}

export interface FixtureStatistics {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    statistics: StatisticItem[];
}

/** Known statistic type names */
export type StatisticType =
    | "Shots on Goal" | "Shots off Goal" | "Total Shots" | "Blocked Shots"
    | "Shots insidebox" | "Shots outsidebox" | "Fouls" | "Corner Kicks"
    | "Offsides" | "Ball Possession" | "Yellow Cards" | "Red Cards"
    | "Goalkeeper Saves" | "Total passes" | "Passes accurate" | "Passes %"
    | "expected_goals";

// ─────────────────────────────────────────────────────────
// FIXTURE PLAYERS (per-fixture player stats)
// GET /fixtures/players
// ─────────────────────────────────────────────────────────

export interface FixturePlayerStats {
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

export interface FixturePlayerEntry {
    player: {
        id: number;
        name: string;
        photo: string;
    };
    statistics: FixturePlayerStats[];
}

export interface FixturePlayersEntry {
    team: {
        id: number;
        name: string;
        logo: string;
        update: string;
    };
    players: FixturePlayerEntry[];
}

// ─────────────────────────────────────────────────────────
// INJURIES
// GET /injuries
// ─────────────────────────────────────────────────────────

export interface Injury {
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

// ─────────────────────────────────────────────────────────
// PREDICTIONS
// GET /predictions
// ─────────────────────────────────────────────────────────

export interface PredictionPercent {
    home: string; // e.g. "55%"
    draw: string;
    away: string;
}

export interface PredictionComparison {
    form: { home: string; away: string };
    att: { home: string; away: string };
    def: { home: string; away: string };
    poisson_distribution: { home: string; away: string };
    h2h: { home: string; away: string };
    goals: { home: string; away: string };
    total: { home: string; away: string };
}

export interface Prediction {
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
            last_5: { form: string; att: string; def: string; goals: { for: { total: number; average: string }; against: { total: number; average: string } } };
            league: { form: string; fixtures: any; goals: any; biggest: any; clean_sheet: any; failed_to_score: any };
        };
        away: {
            id: number;
            name: string;
            logo: string;
            last_5: { form: string; att: string; def: string; goals: { for: { total: number; average: string }; against: { total: number; average: string } } };
            league: { form: string; fixtures: any; goals: any; biggest: any; clean_sheet: any; failed_to_score: any };
        };
    };
    comparison: PredictionComparison;
    h2h: Fixture[];
}

// ─────────────────────────────────────────────────────────
// COACHES
// GET /coachs
// ─────────────────────────────────────────────────────────

export interface CoachCareer {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    start: string;      // "YYYY-MM-DD"
    end: string | null;  // null = current
}

export interface Coach {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
        date: string;    // "YYYY-MM-DD"
        place: string | null;
        country: string;
    };
    nationality: string;
    height: string | null;  // "180 cm"
    weight: string | null;  // "75 kg"
    photo: string;
    team: {
        id: number;
        name: string;
        logo: string;
    };
    career: CoachCareer[];
}

// ─────────────────────────────────────────────────────────
// PLAYERS
// GET /players  (paginated, 20 per page)
// GET /players/profiles
// GET /players/seasons → number[]
// GET /players/squads
// GET /players/teams
// GET /players/topscorers
// GET /players/topassists
// GET /players/topyellowcards
// GET /players/topredcards
// ─────────────────────────────────────────────────────────

export interface PlayerInfo {
    id: number;
    name: string;
    firstname: string;
    lastname: string;
    age: number;
    birth: {
        date: string;     // "YYYY-MM-DD"
        place: string | null;
        country: string;
    };
    nationality: string;
    height: string | null;  // "180 cm"
    weight: string | null;  // "75 kg"
    injured: boolean;
    photo: string;
}

export interface PlayerSeasonStats {
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

export interface PlayerEntry {
    player: PlayerInfo;
    statistics: PlayerSeasonStats[];
}

/** Profile variant (from GET /players/profiles) */
export interface PlayerProfile {
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

// Player Squads (GET /players/squads)

export interface SquadPlayer {
    id: number;
    name: string;
    age: number;
    number: number | null;
    position: string; // "Goalkeeper", "Defender", "Midfielder", "Attacker"
    photo: string;
}

export interface SquadEntry {
    team: {
        id: number;
        name: string;
        logo: string;
    };
    players: SquadPlayer[];
}

// Player Teams / Career (GET /players/teams)

export interface PlayerTeamSeason {
    season: number;
    team: {
        id: number;
        name: string;
        logo: string;
    };
}

export interface PlayerTeamEntry {
    player: {
        id: number;
        name: string;
        photo: string;
    };
    teams: PlayerTeamSeason[];
}

// ─────────────────────────────────────────────────────────
// TRANSFERS
// GET /transfers
// ─────────────────────────────────────────────────────────

export interface Transfer {
    date: string; // "YYYY-MM-DD"
    /** Transfer type: e.g. "€20M", "Free", "Loan", "N/A" */
    type: string;
    teams: {
        in: { id: number; name: string; logo: string };
        out: { id: number; name: string; logo: string };
    };
}

export interface TransferEntry {
    player: {
        id: number;
        name: string;
    };
    update: string; // ISO datetime
    transfers: Transfer[];
}

// ─────────────────────────────────────────────────────────
// TROPHIES
// GET /trophies
// ─────────────────────────────────────────────────────────

export interface Trophy {
    league: string;
    country: string;
    season: string;
    /** "Winner" | "Runner-up" | etc. */
    place: string;
}

// ─────────────────────────────────────────────────────────
// SIDELINED
// GET /sidelined
// ─────────────────────────────────────────────────────────

export interface SidelinedEntry {
    /** Injury/suspension type */
    type: string;
    /** Start date "YYYY-MM-DD" */
    start: string;
    /** End date "YYYY-MM-DD" or null if ongoing */
    end: string | null;
}

// ─────────────────────────────────────────────────────────
// ODDS (Pre-match)
// GET /odds
// GET /odds/mapping
// GET /odds/bookmakers
// GET /odds/bets
// ─────────────────────────────────────────────────────────

export interface OddValue {
    value: string;
    odd: string;
    handicap: string | null;
    main: boolean | null;
    suspended: boolean;
}

export interface Bet {
    id: number;
    name: string;
    values: OddValue[];
}

export interface OddsBookmaker {
    id: number;
    name: string;
    bets: Bet[];
}

export interface OddsEntry {
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
    update: string; // ISO datetime
    bookmakers: OddsBookmaker[];
}

// Odds Mapping (GET /odds/mapping)

export interface OddsMapping {
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

// Bookmakers List (GET /odds/bookmakers)

export interface Bookmaker {
    id: number;
    name: string;
}

// Bet Types (GET /odds/bets)

export interface BetType {
    id: number;
    name: string;
}

// ─────────────────────────────────────────────────────────
// ODDS LIVE (In-play)
// GET /odds/live
// GET /odds/live/bets → BetType[]
// ─────────────────────────────────────────────────────────

export interface OddsLiveBet {
    id: number;
    name: string;
    values: OddValue[];
}

export interface OddsLiveBookmaker {
    id: number;
    name: string;
    bets: OddsLiveBet[];
}

export interface OddsLiveEntry {
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
        update: string; // ISO datetime
    };
    bookmakers: OddsLiveBookmaker[];
}

// ─────────────────────────────────────────────────────────
// HELPER UTILITIES
// ─────────────────────────────────────────────────────────

/** Fixture status states that indicate a match is currently live */
export const LIVE_STATUSES: FixtureStatusShort[] = [
    "1H", "HT", "2H", "ET", "BT", "P", "INT",
];

/** Check if a fixture is live */
export function isLive(status: FixtureStatusShort): boolean {
    return LIVE_STATUSES.includes(status);
}

/** Check if a fixture has finished */
export function isFinished(status: FixtureStatusShort): boolean {
    return ["FT", "AET", "PEN"].includes(status);
}

/** Check if a fixture has not started */
export function isNotStarted(status: FixtureStatusShort): boolean {
    return ["TBD", "NS"].includes(status);
}

/** Build media URL for team logo */
export function teamLogoUrl(teamId: number): string {
    return `https://media.api-sports.io/football/teams/${teamId}.png`;
}

/** Build media URL for player photo */
export function playerPhotoUrl(playerId: number): string {
    return `https://media.api-sports.io/football/players/${playerId}.png`;
}

/** Build media URL for league logo */
export function leagueLogoUrl(leagueId: number): string {
    return `https://media.api-sports.io/football/leagues/${leagueId}.png`;
}

/** Build media URL for country flag */
export function countryFlagUrl(countryCode: string): string {
    return `https://media.api-sports.io/flags/${countryCode.toLowerCase()}.svg`;
}

/** Human-readable status label mapping */
export const STATUS_LABELS: Record<FixtureStatusShort, string> = {
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
    LIVE: "Live",
};
