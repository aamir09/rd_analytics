// ── API Data Types ──────────────────────────────────────────────────────────

export interface Team {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
}

export interface Competition {
  id?: number;
  name: string;
  code?: string;
  emblem?: string;
  logo?: string;
}

export interface Score {
  winner?: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
  duration?: string;
  fullTime?: { home: number | null; away: number | null };
  halfTime?: { home: number | null; away: number | null };
}

export interface Match {
  id: number;
  utcDate: string;
  status: string;
  matchday?: number;
  stage?: string;
  competition: Competition;
  homeTeam: Team;
  awayTeam: Team;
  score: Score;
  referees?: string[];
}

export interface Standing {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form?: string;
}

export interface SquadPlayer {
  id: number;
  name: string;
  position?: string;
  dateOfBirth?: string;
  nationality?: string;
  shirtNumber?: number;
}

export interface Coach {
  id?: number;
  name?: string;
  nationality?: string;
}

export interface TeamInfo {
  id: number;
  name: string;
  shortName?: string;
  tla?: string;
  crest?: string;
  address?: string;
  website?: string;
  founded?: number;
  clubColors?: string;
  venue?: string;
  coach?: Coach;
}

export interface PlayerStatGames {
  appearences?: number;
  lineups?: number;
  minutes?: number;
  number?: number;
  position?: string;
  rating?: string;
  captain?: boolean;
}

export interface PlayerStatGoals {
  total?: number;
  conceded?: number;
  assists?: number;
  saves?: number;
}

export interface PlayerStatCards {
  yellow?: number;
  yellowred?: number;
  red?: number;
}

export interface PlayerStatShots {
  total?: number;
  on?: number;
}

export interface PlayerStatPasses {
  total?: number;
  key?: number;
  accuracy?: number;
}

export interface PlayerStatTackles {
  total?: number;
  blocks?: number;
  interceptions?: number;
}

export interface PlayerStatDribbles {
  attempts?: number;
  success?: number;
  past?: number;
}

export interface PlayerStatistic {
  competition: Competition;
  games: PlayerStatGames;
  goals: PlayerStatGoals;
  assists?: number;
  shots: PlayerStatShots;
  passes: PlayerStatPasses;
  tackles: PlayerStatTackles;
  duels?: { total?: number; won?: number };
  dribbles: PlayerStatDribbles;
  fouls?: { drawn?: number; committed?: number };
  cards: PlayerStatCards;
  penalty?: { won?: number; committed?: number; scored?: number; missed?: number; saved?: number };
}

export interface Player {
  id: number;
  name: string;
  firstname?: string;
  lastname?: string;
  age?: number;
  nationality?: string;
  height?: string;
  weight?: string;
  photo?: string;
  position?: string;
  number?: number;
  statistics: PlayerStatistic[];
}

export interface Injury {
  player: {
    id: number;
    name: string;
    photo?: string;
    type?: string;
    reason?: string;
  };
  fixture: {
    id?: number;
    date?: string;
    timezone?: string;
  };
}

// ── JSON data file shapes ───────────────────────────────────────────────────

export interface StandingsData {
  season: string;
  fetchedAt: string;
  table: Standing[];
}

export interface FixturesData {
  fetchedAt: string;
  teamId: number;
  matches: Match[];
}

export interface SquadData {
  fetchedAt: string;
  team: TeamInfo;
  squad: SquadPlayer[];
}

export interface PlayerStatsData {
  season: number;
  fetchedAt: string;
  players: Player[];
}

export interface InjuriesData {
  season: number;
  fetchedAt: string;
  injuries: Injury[];
}

export interface LastUpdatedData {
  updatedAt: string;
  files: Record<string, boolean>;
}

// ── UI helpers ──────────────────────────────────────────────────────────────

export type FormResult = 'W' | 'D' | 'L';

export type Position = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker';

export const MAN_UTD_ID_FD = 66;  // football-data.org
export const MAN_UTD_ID_AF = 33;  // API-Football

// -- FotMob Types (2025/26 scraped data) ------------------------------------

export interface FotMobStatEntry {
  primary:        number | null;
  secondary:      number | null;
  primaryLabel:   string;
  secondaryLabel: string;
}

export interface FotMobPlayerStats {
  goals?:                       FotMobStatEntry;
  assists?:                     FotMobStatEntry;
  goalsAndAssists?:             FotMobStatEntry;
  rating?:                      FotMobStatEntry;
  minutesPlayed?:               FotMobStatEntry;
  goalsPer90?:                  FotMobStatEntry;
  xG?:                          FotMobStatEntry;
  xGPer90?:                     FotMobStatEntry;
  xGOT?:                        FotMobStatEntry;
  shotsOnTargetPer90?:          FotMobStatEntry;
  shotsPer90?:                  FotMobStatEntry;
  accuratePassesPer90?:         FotMobStatEntry;
  bigChancesCreated?:           FotMobStatEntry;
  chancesCreated?:              FotMobStatEntry;
  accurateLongBallsPer90?:      FotMobStatEntry;
  xA?:                          FotMobStatEntry;
  xAPer90?:                     FotMobStatEntry;
  xGAndXAPer90?:                FotMobStatEntry;
  successfulDribblesPer90?:     FotMobStatEntry;
  bigChancesMissed?:            FotMobStatEntry;
  penaltiesAwarded?:            FotMobStatEntry;
  defensiveContributionsPer90?: FotMobStatEntry;
  tacklesPer90?:                FotMobStatEntry;
  interceptionsPer90?:          FotMobStatEntry;
  clearancesPer90?:             FotMobStatEntry;
  blocksPer90?:                 FotMobStatEntry;
  recoveriesPer90?:             FotMobStatEntry;
  penaltiesConceded?:           FotMobStatEntry;
  possWonFinal3rdPer90?:        FotMobStatEntry;
  cleanSheets?:                 FotMobStatEntry;
  savePercentage?:              FotMobStatEntry;
  savesPer90?:                  FotMobStatEntry;
  goalsPrevented?:              FotMobStatEntry;
  goalsConcededPer90?:          FotMobStatEntry;
  foulsCommittedPer90?:         FotMobStatEntry;
  yellowCards?:                 FotMobStatEntry;
  redCards?:                    FotMobStatEntry;
  [key: string]:                FotMobStatEntry | undefined;
}

export interface FotMobPlayer {
  name:   string;
  photo?: string;
  stats:  FotMobPlayerStats;
}

export interface FotMobData {
  season:    string;
  fetchedAt: string;
  source:    string;
  players:   FotMobPlayer[];
}

export interface SquadDetailPlayer {
  Player: string;
  Shirt: number | null;
  Age: number | null;
  Position: string | null;
  Country: string | null;
  Height: string | null;
  'Transfer value': string | null;
}

// -- News Types ---------------------------------------------------------------
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  link: string;
  published_date: string;
  source: string;
  media_url?: string;
  topics: string[];
}

export interface NewsData {
  fetchedAt: string;
  articles: NewsArticle[];
}
