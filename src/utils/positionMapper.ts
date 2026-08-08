/**
 * positionMapper.ts
 * -----------------
 * Maps raw position strings (from squad_details.json or FotMob)
 * into accurate categories: Goalkeeper, Defender, Midfielder, Attacker, Unknown, or Coach.
 */

import type { SquadDetailPlayer } from '../types';

export type PositionCategory = 'Goalkeeper' | 'Defender' | 'Midfielder' | 'Attacker' | 'Unknown' | 'Coach';

export interface PositionBadgeStyle {
  bg: string;
  color: string;
  label: 'GK' | 'DEF' | 'MID' | 'FWD' | 'UNKNOWN' | 'COACH';
}

export const POSITION_STYLES: Record<PositionCategory, PositionBadgeStyle> = {
  Goalkeeper: { bg: '#fef3c7', color: '#92400e', label: 'GK' },
  Defender:   { bg: '#dbeafe', color: '#1e40af', label: 'DEF' },
  Midfielder: { bg: '#d1fae5', color: '#065f46', label: 'MID' },
  Attacker:   { bg: '#fee2e2', color: '#991b1b', label: 'FWD' },
  Unknown:    { bg: '#f3f4f6', color: '#6b7280', label: 'UNKNOWN' },
  Coach:      { bg: '#e5e7eb', color: '#374151', label: 'COACH' },
};

const DEF_CODES = new Set(['CB', 'LB', 'RB', 'LWB', 'RWB']);
const MID_CODES = new Set(['DM', 'CM', 'AM', 'LM', 'RM']);
const ATT_CODES = new Set(['ST', 'CF', 'RW', 'LW', 'FW']);

export function parsePositionCategory(rawPosition?: string | null): PositionCategory {
  if (!rawPosition) {
    return 'Unknown';
  }

  if (rawPosition.toLowerCase().includes('coach')) {
    return 'Coach';
  }

  const primary = rawPosition.split(',')[0].trim().toUpperCase();

  if (primary === 'GK') return 'Goalkeeper';
  if (DEF_CODES.has(primary)) return 'Defender';
  if (MID_CODES.has(primary)) return 'Midfielder';
  if (ATT_CODES.has(primary)) return 'Attacker';

  if (rawPosition.includes('GK')) return 'Goalkeeper';
  if (rawPosition.includes('ST') || rawPosition.includes('LW') || rawPosition.includes('RW')) return 'Attacker';
  if (rawPosition.includes('CB') || rawPosition.includes('LB') || rawPosition.includes('RB')) return 'Defender';
  if (rawPosition.includes('DM') || rawPosition.includes('CM') || rawPosition.includes('AM')) return 'Midfielder';

  return 'Unknown';
}

export function buildPositionMap(squadDetails: SquadDetailPlayer[] | null): Record<string, PositionCategory> {
  const map: Record<string, PositionCategory> = {};
  if (!squadDetails || !Array.isArray(squadDetails)) return map;

  for (const p of squadDetails) {
    if (p.Player) {
      const key = p.Player.trim().toLowerCase();
      map[key] = parsePositionCategory(p.Position);
    }
  }

  return map;
}
