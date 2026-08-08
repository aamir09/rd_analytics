import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { usePlayerPhotos } from '../hooks/usePlayerPhotos';
import type { FotMobData, PlayerStatsData, SquadDetailPlayer, FotMobPlayer } from '../types';
import FotMobPlayerCard from '../components/ui/FotMobPlayerCard';
import { parsePositionCategory } from '../utils/positionMapper';
import { Search, Users } from 'lucide-react';

const POSITIONS = ['All', 'Goalkeepers', 'Defenders', 'Midfielders', 'Attackers'];

function normKey(name: string): string {
  return name.trim().toLowerCase();
}

export default function Players() {
  const { data: squadDetails, loading: squadLoading, error: squadError } = useData<SquadDetailPlayer[]>('squad_details.json');
  const { data: fotmob, loading: fotmobLoading } = useData<FotMobData>('player_stats_fotmob.json');
  const { data: apiData } = useData<PlayerStatsData>('player_stats.json');

  const [search, setSearch]       = useState('');
  const [posFilter, setPosFilter] = useState('All');

  const photoMap = usePlayerPhotos(apiData ?? null);

  // Map of FotMob player stats by normalised name
  const fotmobStatsMap = useMemo(() => {
    const map: Record<string, FotMobPlayer['stats']> = {};
    if (fotmob?.players) {
      for (const p of fotmob.players) {
        map[normKey(p.name)] = p.stats;
      }
    }
    return map;
  }, [fotmob]);

  // Master list of players generated exclusively from squad_details.json (excluding Coaches)
  const players = useMemo(() => {
    if (!squadDetails || !Array.isArray(squadDetails)) return [];

    return squadDetails
      .filter(sp => sp.Player && sp.Position !== 'Coach' && parsePositionCategory(sp.Position) !== 'Coach')
      .map(sp => {
        const key = normKey(sp.Player);
        const stats = fotmobStatsMap[key] ?? {};
        const photo = sp.Image || photoMap[key];
        const posCat = parsePositionCategory(sp.Position);

        return {
          name: sp.Player,
          photo: photo || undefined,
          stats: stats,
          positionCategory: posCat,
          rawPosition: sp.Position || undefined,
          shirtNumber: sp.Shirt ?? null,
        };
      });
  }, [squadDetails, fotmobStatsMap, photoMap]);

  const filtered = players.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());

    let matchesPos = true;
    if (posFilter === 'Goalkeepers') matchesPos = p.positionCategory === 'Goalkeeper';
    else if (posFilter === 'Defenders') matchesPos = p.positionCategory === 'Defender';
    else if (posFilter === 'Midfielders') matchesPos = p.positionCategory === 'Midfielder';
    else if (posFilter === 'Attackers') matchesPos = p.positionCategory === 'Attacker';

    return matchesSearch && matchesPos;
  });

  const loading = squadLoading || fotmobLoading;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div className="accent-bar" />
          <h1 className="text-heading">Players</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            2025/26 Season Squad · {filtered.length} player{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Search + filter */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input
              id="player-search"
              type="text"
              className="search-input"
              placeholder="Search players..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {POSITIONS.map(pos => (
              <button
                key={pos}
                id={`pos-filter-${pos.toLowerCase()}`}
                className={`btn btn-ghost ${posFilter === pos ? 'active' : ''}`}
                onClick={() => setPosFilter(pos)}
                style={{ fontSize: '0.8rem', padding: '7px 14px' }}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="grid-4">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="card skeleton" style={{ height: '220px' }} />)}
          </div>
        )}

        {squadError && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <Users size={40} style={{ color: 'var(--color-text-light)', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Could not load squad data</div>
          </div>
        )}

        {!loading && !squadError && filtered.length === 0 && (
          <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
            <Users size={48} style={{ color: 'var(--color-text-light)', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>No players found</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Try adjusting your search or filter</div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="grid-4 fade-in">
            {filtered.map((p, i) => (
              <FotMobPlayerCard
                key={p.name}
                player={p}
                index={i}
                positionCategory={p.positionCategory}
                rawPosition={p.rawPosition}
                shirtNumber={p.shirtNumber}
              />
            ))}
          </div>
        )}

        {squadDetails && (
          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
            Official Squad List · 2025/26 Season ({players.length} Players)
          </div>
        )}
      </div>
    </div>
  );
}
