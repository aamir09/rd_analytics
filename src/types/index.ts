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
  Image: string | null;
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

export interface TwitterAuthor {
  name: string;
  screen_name: string;
  avatar: string;
}

export interface Tweet {
  id: string;
  created_at: string;
  text: string;
  views?: string;
  favorites?: number;
  retweets?: number;
  media_url?: string;
  author: TwitterAuthor;
}

export interface TwitterHandleData {
  screen_name: string;
  tweets: Tweet[];
}

export interface TwitterData {
  fetchedAt: string;
  handles: TwitterHandleData[];
}

// -- SofaScore Types (League-wide EPL data, Compare page only) ----------------

export interface SofaScoreStatistics {
  rating?: number | null;
  totalRating?: number | null;
  countRating?: number | null;
  goals?: number | null;
  bigChancesCreated?: number | null;
  bigChancesMissed?: number | null;
  assists?: number | null;
  expectedAssists?: number | null;
  goalsAssistsSum?: number | null;
  accuratePasses?: number | null;
  inaccuratePasses?: number | null;
  totalPasses?: number | null;
  accuratePassesPercentage?: number | null;
  accurateOwnHalfPasses?: number | null;
  accurateOppositionHalfPasses?: number | null;
  accurateFinalThirdPasses?: number | null;
  keyPasses?: number | null;
  successfulDribbles?: number | null;
  successfulDribblesPercentage?: number | null;
  tackles?: number | null;
  interceptions?: number | null;
  yellowCards?: number | null;
  directRedCards?: number | null;
  redCards?: number | null;
  accurateCrosses?: number | null;
  accurateCrossesPercentage?: number | null;
  totalShots?: number | null;
  shotsOnTarget?: number | null;
  shotsOffTarget?: number | null;
  groundDuelsWon?: number | null;
  groundDuelsWonPercentage?: number | null;
  aerialDuelsWon?: number | null;
  aerialDuelsWonPercentage?: number | null;
  totalDuelsWon?: number | null;
  totalDuelsWonPercentage?: number | null;
  minutesPlayed?: number | null;
  goalConversionPercentage?: number | null;
  penaltiesTaken?: number | null;
  penaltyGoals?: number | null;
  penaltyWon?: number | null;
  penaltyConceded?: number | null;
  shotFromSetPiece?: number | null;
  freeKickGoal?: number | null;
  goalsFromInsideTheBox?: number | null;
  goalsFromOutsideTheBox?: number | null;
  shotsFromInsideTheBox?: number | null;
  shotsFromOutsideTheBox?: number | null;
  headedGoals?: number | null;
  leftFootGoals?: number | null;
  rightFootGoals?: number | null;
  accurateLongBalls?: number | null;
  accurateLongBallsPercentage?: number | null;
  clearances?: number | null;
  errorLeadToGoal?: number | null;
  errorLeadToShot?: number | null;
  dispossessed?: number | null;
  possessionLost?: number | null;
  possessionWonAttThird?: number | null;
  totalChippedPasses?: number | null;
  accurateChippedPasses?: number | null;
  touches?: number | null;
  wasFouled?: number | null;
  fouls?: number | null;
  hitWoodwork?: number | null;
  ownGoals?: number | null;
  dribbledPast?: number | null;
  offsides?: number | null;
  blockedShots?: number | null;
  passToAssist?: number | null;
  saves?: number | null;
  kilometersCovered?: number | null;
  numberOfSprints?: number | null;
  topSpeed?: number | null;
  cleanSheet?: number | null;
  matchesStarted?: number | null;
  totalAttemptAssist?: number | null;
  totalContest?: number | null;
  totalCross?: number | null;
  duelLost?: number | null;
  aerialLost?: number | null;
  totalLongBalls?: number | null;
  goalsConceded?: number | null;
  tacklesWon?: number | null;
  tacklesWonPercentage?: number | null;
  scoringFrequency?: number | null;
  expectedGoals?: number | null;
  ballRecovery?: number | null;
  outfielderBlocks?: number | null;
  appearances?: number | null;
  [key: string]: number | string | object | null | undefined;
}

export interface SofaScorePlayer {
  player_id: number;
  player_name: string;
  team_name: string;
  team_code: string;
  position: string;
  jersey_number?: string;
  statistics: SofaScoreStatistics | null;
}
