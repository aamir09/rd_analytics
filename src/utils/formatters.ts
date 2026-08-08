import { format, parseISO, formatDistanceToNow } from 'date-fns';
import type { Match, FormResult, PlayerStatistic } from '../types';

export const MAN_UTD_ID_FD = 66;

/** Format ISO date string to "Sat, 10 Aug" */
export function formatMatchDate(utcDate: string): string {
  try {
    return format(parseISO(utcDate), 'EEE, d MMM');
  } catch {
    return utcDate;
  }
}

/** Format ISO date to time "20:00" */
export function formatMatchTime(utcDate: string): string {
  try {
    const d = parseISO(utcDate);
    // Convert UTC to local time
    return format(d, 'HH:mm');
  } catch {
    return '';
  }
}

/** Format ISO date to "10 Aug 2025" */
export function formatFullDate(utcDate: string): string {
  try {
    return format(parseISO(utcDate), 'd MMM yyyy');
  } catch {
    return utcDate;
  }
}

/** "2 days ago" */
export function timeAgo(utcDate: string): string {
  try {
    return formatDistanceToNow(parseISO(utcDate), { addSuffix: true });
  } catch {
    return '';
  }
}

/** "in 3 days" */
export function timeUntil(utcDate: string): string {
  try {
    return formatDistanceToNow(parseISO(utcDate), { addSuffix: true });
  } catch {
    return '';
  }
}

/** Parse form string "W,W,D,L,W" → ['W','W','D','L','W'] */
export function parseForm(form?: string | null): FormResult[] {
  if (!form) return [];
  return form.split(',').filter(Boolean).slice(0, 5) as FormResult[];
}

/** Get scoreline for a finished match */
export function getScoreline(match: Match): string {
  const s = match.score?.fullTime;
  if (!s || s.home === null) return '- : -';
  return `${s.home} : ${s.away}`;
}

/** Did Man United win/draw/lose? */
export function getManUtdResult(match: Match): FormResult | null {
  const { winner } = match.score ?? {};
  if (!winner) return null;
  const isHome = match.homeTeam.id === MAN_UTD_ID_FD;
  if (winner === 'DRAW') return 'D';
  if ((winner === 'HOME_TEAM' && isHome) || (winner === 'AWAY_TEAM' && !isHome)) return 'W';
  return 'L';
}

/** Get Man United score from a match */
export function getManUtdScore(match: Match): { scored: number; conceded: number } | null {
  const ft = match.score?.fullTime;
  if (ft?.home === null || ft?.away === null || ft === undefined) return null;
  const isHome = match.homeTeam.id === MAN_UTD_ID_FD;
  return isHome
    ? { scored: ft.home!, conceded: ft.away! }
    : { scored: ft.away!, conceded: ft.home! };
}

/** Get opponent team from a match */
export function getOpponent(match: Match) {
  return match.homeTeam.id === MAN_UTD_ID_FD ? match.awayTeam : match.homeTeam;
}

/** Is Man United home? */
export function isHome(match: Match): boolean {
  return match.homeTeam.id === MAN_UTD_ID_FD;
}

/** Format player age */
export function formatAge(dob?: string): string {
  if (!dob) return '—';
  try {
    const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    return `${age} yrs`;
  } catch {
    return '—';
  }
}

/** Format height from "181 cm" to just return as-is */
export function formatHeight(h?: string): string {
  return h ?? '—';
}

/** Get primary stat block (Premier League first, fallback to first) */
export function getPrimaryStat(statistics: PlayerStatistic[]): PlayerStatistic | undefined {
  return statistics.find(s => s.competition.name?.includes('Premier League')) ?? statistics[0];
}

/** Compute per-90 value */
export function per90(value: number | undefined, minutes: number | undefined): string {
  if (!value || !minutes || minutes === 0) return '0.00';
  return ((value / minutes) * 90).toFixed(2);
}

/** Clamp a value 0..max and return percentage */
export function toPercent(value: number, max: number): number {
  if (max === 0) return 0;
  return Math.min(100, Math.round((value / max) * 100));
}

/** Format number with fallback */
export function fmt(v?: number | null, fallback = '—'): string {
  if (v === null || v === undefined) return fallback;
  return v.toString();
}

/** Position display name */
export function positionLabel(pos?: string): string {
  const map: Record<string, string> = {
    Goalkeeper: 'GK',
    Defender: 'DEF',
    Midfielder: 'MID',
    Attacker: 'FWD',
    'Centre-Back': 'CB',
    'Left-Back': 'LB',
    'Right-Back': 'RB',
    'Defensive Midfield': 'DM',
    'Central Midfield': 'CM',
    'Attacking Midfield': 'AM',
    'Left Winger': 'LW',
    'Right Winger': 'RW',
    'Centre-Forward': 'CF',
  };
  return map[pos ?? ''] ?? pos ?? '—';
}
