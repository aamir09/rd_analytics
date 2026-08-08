/**
 * usePlayerPhotos
 * ---------------
 * Builds a photo lookup map keyed by normalised player name.
 * Reads images directly from public/data/squad_details.json (FotMob squad scraper),
 * with fallback resolution to API-Football player stats via playerNameMap.json.
 */

import { useMemo } from 'react';
import { useData } from './useData';
import type { PlayerStatsData, SquadDetailPlayer } from '../types';
import nameMap from '../data/playerNameMap.json';

type NameMap = Record<string, string>;

function normKey(name: string): string {
  return name.trim().toLowerCase();
}

export function usePlayerPhotos(apiData: PlayerStatsData | null): Record<string, string> {
  const { data: squadDetails } = useData<SquadDetailPlayer[]>('squad_details.json');

  return useMemo(() => {
    const photoMap: Record<string, string> = {};

    // 1. Primary source: official FotMob images from squad_details.json
    if (squadDetails && Array.isArray(squadDetails)) {
      for (const p of squadDetails) {
        if (p.Player && p.Image) {
          photoMap[normKey(p.Player)] = p.Image;
        }
      }
    }

    // 2. Secondary source: API-Football stats photos (using name mapping for fallback)
    if (apiData?.players) {
      const apiPhotoByNorm: Record<string, string> = {};
      for (const p of apiData.players) {
        if (p.photo) {
          apiPhotoByNorm[normKey(p.name)] = p.photo;
        }
      }

      const typedNameMap = nameMap as NameMap;
      for (const [fotmobName, apiName] of Object.entries(typedNameMap)) {
        const photo = apiPhotoByNorm[normKey(apiName)];
        if (photo && !photoMap[normKey(fotmobName)]) {
          photoMap[normKey(fotmobName)] = photo;
        }
      }

      for (const p of apiData.players) {
        if (p.photo) {
          const key = normKey(p.name);
          if (!photoMap[key]) {
            photoMap[key] = p.photo;
          }
        }
      }
    }

    return photoMap;
  }, [squadDetails, apiData]);
}
