import { useState, useMemo } from 'react';
import { useData } from '../hooks/useData';
import { usePlayerPhotos } from '../hooks/usePlayerPhotos';
import type { FotMobData, FotMobPlayer, FotMobStatEntry, PlayerStatsData, SquadDetailPlayer } from '../types';
import { parsePositionCategory } from '../utils/positionMapper';
import { Search, ArrowLeftRight } from 'lucide-react';

const COMPARE_STATS: { key: string; label: string }[] = [
  { key: 'goals',                       label: 'Goals' },
  { key: 'assists',                     label: 'Assists' },
  { key: 'goalsAndAssists',             label: 'Goals + Assists' },
  { key: 'rating',                      label: 'FotMob Rating' },
  { key: 'minutesPlayed',               label: 'Minutes Played' },
  { key: 'xG',                          label: 'Expected Goals (xG)' },
  { key: 'xA',                          label: 'Expected Assists (xA)' },
  { key: 'xGAndXAPer90',               label: 'xG + xA per 90' },
  { key: 'goalsPer90',                  label: 'Goals per 90' },
  { key: 'shotsOnTargetPer90',          label: 'Shots on Target p90' },
  { key: 'shotsPer90',                  label: 'Shots per 90' },
  { key: 'bigChancesCreated',           label: 'Big Chances Created' },
  { key: 'chancesCreated',              label: 'Chances Created' },
  { key: 'accuratePassesPer90',         label: 'Accurate Passes p90' },
  { key: 'successfulDribblesPer90',     label: 'Successful Dribbles p90' },
  { key: 'defensiveContributionsPer90', label: 'Defensive Contributions p90' },
  { key: 'tacklesPer90',                label: 'Tackles per 90' },
  { key: 'interceptionsPer90',          label: 'Interceptions per 90' },
  { key: 'clearancesPer90',             label: 'Clearances per 90' },
  { key: 'recoveriesPer90',             label: 'Recoveries per 90' },
  { key: 'foulsCommittedPer90',         label: 'Fouls Committed p90' },
  { key: 'yellowCards',                 label: 'Yellow Cards' },
  { key: 'redCards',                    label: 'Red Cards' },
];

function normKey(name: string): string {
  return name.trim().toLowerCase();
}

function PlayerPicker({ label, selected, onSelect, players }: {
  label: string;
  selected: FotMobPlayer | null;
  onSelect: (p: FotMobPlayer) => void;
  players: FotMobPlayer[];
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen]     = useState(false);
  const filtered = players.filter(p => p.name.toLowerCase().includes(search.toLowerCase())).slice(0, 10);
  const initials = selected ? selected.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      {selected ? (
        <div className="card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }} onClick={() => { setOpen(true); setSearch(''); }}>
          {selected.photo
            ? <img src={selected.photo} alt="" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>{initials}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{selected.name}</div>
            <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
              {selected.stats.goals?.primary ?? 0}G · {selected.stats.assists?.primary ?? 0}A · {selected.stats.rating?.primary?.toFixed(2) ?? '—'} rating
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-primary)', fontWeight: 600 }}>Change</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '16px', cursor: 'pointer', border: '2px dashed var(--color-border)', background: 'var(--color-bg)' }} onClick={() => setOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--color-text-muted)' }}>
            <Search size={18} />
            <span style={{ fontSize: '0.875rem' }}>Select a player...</span>
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'relative', zIndex: 50 }}>
          <div style={{ position: 'absolute', top: '8px', left: 0, right: 0, background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)', zIndex: 50 }}>
            <div style={{ padding: '12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input autoFocus type="text" className="search-input" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px' }} />
              </div>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filtered.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onSelect(p); setOpen(false); setSearch(''); }}
                >
                  {p.photo
                    ? <img src={p.photo} alt="" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>{p.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                  }
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{p.stats.goals?.primary ?? 0}G · {p.stats.assists?.primary ?? 0}A · {p.stats.minutesPlayed?.primary ?? 0}min</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>No players found</div>}
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setOpen(false)} style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Compare() {
  const { data: squadDetails } = useData<SquadDetailPlayer[]>('squad_details.json');
  const { data: fotmob } = useData<FotMobData>('player_stats_fotmob.json');
  const { data: apiData } = useData<PlayerStatsData>('player_stats.json');

  const [playerA, setPlayerA] = useState<FotMobPlayer | null>(null);
  const [playerB, setPlayerB] = useState<FotMobPlayer | null>(null);

  const photoMap = usePlayerPhotos(apiData ?? null);

  const fotmobStatsMap = useMemo(() => {
    const map: Record<string, FotMobPlayer['stats']> = {};
    if (fotmob?.players) {
      for (const p of fotmob.players) {
        map[normKey(p.name)] = p.stats;
      }
    }
    return map;
  }, [fotmob]);

  const players: FotMobPlayer[] = useMemo(() => {
    if (!squadDetails || !Array.isArray(squadDetails)) return [];
    return squadDetails
      .filter(sp => sp.Player && sp.Position !== 'Coach' && parsePositionCategory(sp.Position) !== 'Coach')
      .map(sp => {
        const key = normKey(sp.Player);
        const stats = fotmobStatsMap[key] ?? {};
        const photo = sp.Image || photoMap[key];

        return {
          name: sp.Player,
          photo: photo || undefined,
          stats: stats,
        };
      });
  }, [squadDetails, fotmobStatsMap, photoMap]);

  const getVal = (player: FotMobPlayer | null, key: string): number => {
    if (!player) return 0;
    const entry = player.stats[key] as FotMobStatEntry | undefined;
    return entry?.primary ?? 0;
  };

  const relevantStats = playerA && playerB
    ? COMPARE_STATS.filter(s => getVal(playerA, s.key) > 0 || getVal(playerB, s.key) > 0)
    : COMPARE_STATS;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div className="accent-bar" />
          <h1 className="text-heading">Player Comparison</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            2025/26 season · Compare two players side by side
          </p>
        </div>

        {/* Pickers */}
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '40px', flexWrap: 'wrap' }}>
          <PlayerPicker label="Player A" selected={playerA} onSelect={setPlayerA} players={players} />
          <div style={{ display: 'flex', alignItems: 'center', paddingTop: '28px', flexShrink: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ArrowLeftRight size={16} color="white" />
            </div>
          </div>
          <PlayerPicker label="Player B" selected={playerB} onSelect={setPlayerB} players={players} />
        </div>

        {/* Comparison table */}
        {playerA && playerB && (
          <div className="card fade-in" style={{ overflow: 'hidden' }}>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', borderBottom: '2px solid var(--color-border)' }}>
              {[playerA, playerB].map((p, idx) => (
                <div key={p.name} style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '12px', flexDirection: idx === 1 ? 'row-reverse' : 'row', ...(idx === 1 ? { gridColumnStart: 3 } : {}) }}>
                  {p.photo
                    ? <img src={p.photo} alt="" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${idx === 0 ? 'var(--color-primary)' : 'var(--color-accent)'}`, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div style={{ width: 52, height: 52, borderRadius: '50%', background: idx === 0 ? 'var(--color-primary)' : 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? 'white' : '#1A1A1A', fontWeight: 800, fontSize: '1.1rem', flexShrink: 0 }}>{p.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  }
                  <div style={{ textAlign: idx === 1 ? 'right' : 'left' }}>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{p.stats.goals?.primary ?? 0}G · {p.stats.assists?.primary ?? 0}A · ★{p.stats.rating?.primary?.toFixed(2) ?? '—'}</div>
                  </div>
                </div>
              ))}
              <div style={{ gridColumnStart: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STAT</div>
            </div>

            {/* Rows */}
            {relevantStats.map((s, rowIdx) => {
              const vA = getVal(playerA, s.key);
              const vB = getVal(playerB, s.key);
              const aBetter = vA > vB;
              const bBetter = vB > vA;
              const equal   = vA === vB;
              const entry   = (playerA.stats[s.key] ?? playerB.stats[s.key]) as FotMobStatEntry | undefined;
              return (
                <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', background: rowIdx % 2 === 0 ? 'white' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                  <div style={{ padding: '14px 20px', textAlign: 'right' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: aBetter ? 'var(--color-primary)' : equal ? 'var(--color-text-muted)' : 'var(--color-text-light)' }}>{vA}</span>
                    {aBetter && <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--color-win)' }}>▲</span>}
                  </div>
                  <div style={{ padding: '14px 8px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{s.label}</span>
                    {entry?.secondaryLabel && <span style={{ fontSize: '0.6rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{entry.secondaryLabel}</span>}
                  </div>
                  <div style={{ padding: '14px 20px', textAlign: 'left' }}>
                    <span style={{ fontSize: '1rem', fontWeight: 800, color: bBetter ? '#E6B000' : equal ? 'var(--color-text-muted)' : 'var(--color-text-light)' }}>{vB}</span>
                    {bBetter && <span style={{ marginLeft: '6px', fontSize: '0.65rem', color: 'var(--color-win)' }}>▲</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(!playerA || !playerB) && (
          <div className="card" style={{ padding: '64px', textAlign: 'center', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)', background: 'transparent', boxShadow: 'none' }}>
            <ArrowLeftRight size={48} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px', color: 'var(--color-text)' }}>Select two players to compare</div>
            <div style={{ fontSize: '0.9rem' }}>2025/26 season squad data</div>
          </div>
        )}
      </div>
    </div>
  );
}
