import { useState, useMemo, useRef } from 'react';
import { useData } from '../hooks/useData';
import { usePlayerPhotos } from '../hooks/usePlayerPhotos';
import { useChartDownload } from '../hooks/useChartDownload';
import type {
  FotMobData, FotMobPlayer, FotMobStatEntry, PlayerStatsData,
  SquadDetailPlayer, SofaScorePlayer
} from '../types';
import { STAT_REGISTRY, STAT_BY_KEY, STAT_CATEGORIES } from '../data/statRegistry';
import { parsePositionCategory } from '../utils/positionMapper';
import { Search, ArrowLeftRight, Download, BarChart3, PieChart, ScatterChart, Grid3X3 } from 'lucide-react';

import SeasonToggle from '../components/ui/SeasonToggle';
import StatPicker from '../components/ui/StatPicker';
import LeaguePlayerPicker from '../components/ui/LeaguePlayerPicker';
import PizzaChart from '../components/charts/PizzaChart';
import BeeswarmPlot from '../components/charts/BeeswarmPlot';
import ScatterPlotChart from '../components/charts/ScatterPlot';
import ZScoreHeatmap from '../components/charts/ZScoreHeatmap';

// ═══════════════════════════════════════════════════════════════
// Existing FotMob comparison stats (unchanged)
// ═══════════════════════════════════════════════════════════════
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
  { key: 'tacklesPer90',               label: 'Tackles per 90' },
  { key: 'interceptionsPer90',          label: 'Interceptions per 90' },
  { key: 'clearancesPer90',             label: 'Clearances per 90' },
  { key: 'recoveriesPer90',             label: 'Recoveries per 90' },
  { key: 'foulsCommittedPer90',         label: 'Fouls Committed p90' },
  { key: 'yellowCards',                 label: 'Yellow Cards' },
  { key: 'redCards',                    label: 'Red Cards' },
];

type CompareMode = 'united' | 'league' | 'analytics';
type VizType = 'pizza' | 'beeswarm' | 'scatter' | 'heatmap';

const MODE_TABS: { key: CompareMode; label: string; icon: string; desc: string }[] = [
  { key: 'united',    label: 'United Squad',    icon: '🔴', desc: 'Head-to-head between Man Utd players' },
  { key: 'league',    label: 'vs League',       icon: '⚽', desc: 'Compare a United player against any EPL player' },
  { key: 'analytics', label: 'League Analytics', icon: '📊', desc: 'League-wide visualizations and insights' },
];

const VIZ_OPTIONS: { key: VizType; label: string; Icon: typeof PieChart; desc: string }[] = [
  { key: 'pizza',    label: 'Pizza Chart',   Icon: PieChart,     desc: 'Percentile profile' },
  { key: 'beeswarm', label: 'Beeswarm',      Icon: BarChart3,    desc: 'League distribution' },
  { key: 'scatter',  label: 'Scatter',        Icon: ScatterChart, desc: 'Two-stat comparison' },
  { key: 'heatmap',  label: 'Heatmap',        Icon: Grid3X3,      desc: 'Squad Z-scores' },
];

function normKey(name: string): string {
  return name.trim().toLowerCase();
}

// ═══════════════════════════════════════════════════════════════
// United Squad PlayerPicker (existing FotMob-based)
// ═══════════════════════════════════════════════════════════════
function UnitedPlayerPicker({ label, selected, onSelect, players }: {
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
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      {selected ? (
        <div className="card" style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={() => { setOpen(true); setSearch(''); }}>
          {selected.photo
            ? <img src={selected.photo} alt="" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.9rem', flexShrink: 0 }}>{initials}</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selected.name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>
              {selected.stats.goals?.primary ?? 0}G · {selected.stats.assists?.primary ?? 0}A · {selected.stats.rating?.primary?.toFixed(2) ?? '—'} rating
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--color-primary)', fontWeight: 600 }}>Change</div>
        </div>
      ) : (
        <div className="card" style={{ padding: '14px', cursor: 'pointer', border: '2px dashed var(--color-border)', background: 'var(--color-bg)', boxShadow: 'none' }} onClick={() => setOpen(true)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
            <Search size={16} />
            <span style={{ fontSize: '0.82rem' }}>Select a player…</span>
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'relative', zIndex: 50 }}>
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{ position: 'absolute', top: '6px', left: 0, right: 0, background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', boxShadow: '0 12px 40px rgba(0,0,0,0.15)', zIndex: 50 }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input autoFocus type="text" className="search-input" placeholder="Search players..." value={search} onChange={e => setSearch(e.target.value)} style={{ paddingLeft: '32px', width: '100%' }} />
              </div>
            </div>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {filtered.map(p => (
                <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 14px', cursor: 'pointer', transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => { onSelect(p); setOpen(false); setSearch(''); }}
                >
                  {p.photo
                    ? <img src={p.photo} alt="" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                    : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.75rem', flexShrink: 0 }}>{p.name.split(' ').map(w => w[0]).join('').slice(0,2)}</div>
                  }
                  <div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.name}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)' }}>{p.stats.goals?.primary ?? 0}G · {p.stats.assists?.primary ?? 0}A · {p.stats.minutesPlayed?.primary ?? 0}min</div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>No players found</div>}
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setOpen(false)} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Main Compare Page
// ═══════════════════════════════════════════════════════════════
export default function Compare() {
  // ── Existing data sources (unchanged) ──
  const { data: squadDetails } = useData<SquadDetailPlayer[]>('squad_details.json');
  const { data: fotmob } = useData<FotMobData>('player_stats_fotmob.json');
  const { data: apiData } = useData<PlayerStatsData>('player_stats.json');

  // ── SofaScore data ──
  const { data: sofaData, loading: sofaLoading } = useData<SofaScorePlayer[]>('sofascore/2526_player_stats.json');

  // ── State ──
  const [season, setSeason] = useState<'2526' | '2627'>('2526');
  const [mode, setMode] = useState<CompareMode>('united');
  const [vizType, setVizType] = useState<VizType>('pizza');
  const [selectedStats, setSelectedStats] = useState<string[]>(['goals', 'expectedGoals', 'assists', 'keyPasses', 'tackles', 'interceptions']);

  // United squad comparison state (existing)
  const [playerA, setPlayerA] = useState<FotMobPlayer | null>(null);
  const [playerB, setPlayerB] = useState<FotMobPlayer | null>(null);

  // League comparison state
  const [leaguePlayerA, setLeaguePlayerA] = useState<SofaScorePlayer | null>(null);
  const [leaguePlayerB, setLeaguePlayerB] = useState<SofaScorePlayer | null>(null);

  // Beeswarm metric picker
  const [beeswarmMetric, setBeeswarmMetric] = useState('goals');

  // Scatter metrics
  const [scatterX, setScatterX] = useState('expectedGoals');
  const [scatterY, setScatterY] = useState('goals');

  const chartRef = useRef<HTMLDivElement>(null);
  const downloadChart = useChartDownload();

  const photoMap = usePlayerPhotos(apiData ?? null);

  // ── FotMob players for United Squad tab ──
  const fotmobStatsMap = useMemo(() => {
    const map: Record<string, FotMobPlayer['stats']> = {};
    if (fotmob?.players) {
      for (const p of fotmob.players) map[normKey(p.name)] = p.stats;
    }
    return map;
  }, [fotmob]);

  const unitedPlayers: FotMobPlayer[] = useMemo(() => {
    if (!squadDetails || !Array.isArray(squadDetails)) return [];
    return squadDetails
      .filter(sp => sp.Player && sp.Position !== 'Coach' && parsePositionCategory(sp.Position) !== 'Coach')
      .map(sp => {
        const key = normKey(sp.Player);
        return {
          name: sp.Player,
          photo: sp.Image || photoMap[key],
          stats: fotmobStatsMap[key] ?? {},
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

  // ── SofaScore players ──
  const sofaPlayers = useMemo(() => {
    if (!sofaData) return [];
    return sofaData.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) > 0);
  }, [sofaData]);

  // Metric dropdown for beeswarm
  const availableMetrics = useMemo(() => {
    return STAT_REGISTRY.filter(s => {
      // Check if at least some players have this stat
      if (sofaPlayers.length === 0) return true;
      const count = sofaPlayers.filter(p => {
        const v = (p.statistics as Record<string, unknown>)?.[s.key];
        return typeof v === 'number' && v > 0;
      }).length;
      return count > 10;
    });
  }, [sofaPlayers]);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* ── Header ── */}
        <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div className="accent-bar" />
            <h1 className="text-heading">Player Comparison</h1>
            <p style={{ color: 'var(--color-text-muted)', marginTop: '6px', fontSize: '0.85rem' }}>
              Advanced analytics powered by SofaScore & FotMob data
            </p>
          </div>
          <SeasonToggle season={season} onChange={setSeason} />
        </div>

        {/* ── Mode Tabs ── */}
        <div style={{
          display: 'flex', gap: '4px', marginBottom: '28px', background: 'var(--color-bg)',
          borderRadius: '12px', padding: '4px', border: '1px solid var(--color-border)',
        }}>
          {MODE_TABS.map(tab => {
            const active = mode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: '10px', border: 'none',
                  cursor: 'pointer', transition: 'all 0.2s ease',
                  background: active ? 'white' : 'transparent',
                  boxShadow: active ? 'var(--shadow-sm)' : 'none',
                  color: active ? 'var(--color-text)' : 'var(--color-text-muted)',
                }}
              >
                <div style={{ fontSize: '1rem', marginBottom: '2px' }}>{tab.icon}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>{tab.label}</div>
                <div style={{ fontSize: '0.62rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{tab.desc}</div>
              </button>
            );
          })}
        </div>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: United Squad (existing FotMob comparison)         */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'united' && (
          <>
            <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '32px', flexWrap: 'wrap' }}>
              <UnitedPlayerPicker label="Player A" selected={playerA} onSelect={setPlayerA} players={unitedPlayers} />
              <div style={{ display: 'flex', alignItems: 'center', paddingTop: '26px', flexShrink: 0 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ArrowLeftRight size={16} color="white" />
                </div>
              </div>
              <UnitedPlayerPicker label="Player B" selected={playerB} onSelect={setPlayerB} players={unitedPlayers} />
            </div>

            {playerA && playerB && (
              <div className="card fade-in" style={{ overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', borderBottom: '2px solid var(--color-border)' }}>
                  {[playerA, playerB].map((p, idx) => (
                    <div key={p.name} style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '10px', flexDirection: idx === 1 ? 'row-reverse' : 'row', ...(idx === 1 ? { gridColumnStart: 3 } : {}) }}>
                      {p.photo
                        ? <img src={p.photo} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: `3px solid ${idx === 0 ? 'var(--color-primary)' : 'var(--color-accent)'}`, flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div style={{ width: 48, height: 48, borderRadius: '50%', background: idx === 0 ? 'var(--color-primary)' : 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: idx === 0 ? 'white' : '#1A1A1A', fontWeight: 800, fontSize: '1rem', flexShrink: 0 }}>{p.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                      }
                      <div style={{ textAlign: idx === 1 ? 'right' : 'left' }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)' }}>{p.stats.goals?.primary ?? 0}G · {p.stats.assists?.primary ?? 0}A · ★{p.stats.rating?.primary?.toFixed(2) ?? '—'}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ gridColumnStart: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.62rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>STAT</div>
                </div>

                {relevantStats.map((s, rowIdx) => {
                  const vA = getVal(playerA, s.key);
                  const vB = getVal(playerB, s.key);
                  const aBetter = vA > vB;
                  const bBetter = vB > vA;
                  const equal = vA === vB;
                  const entry = (playerA.stats[s.key] ?? playerB.stats[s.key]) as FotMobStatEntry | undefined;
                  return (
                    <div key={s.key} style={{ display: 'grid', gridTemplateColumns: '1fr 160px 1fr', background: rowIdx % 2 === 0 ? 'white' : 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>
                      <div style={{ padding: '12px 18px', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: aBetter ? 'var(--color-primary)' : equal ? 'var(--color-text-muted)' : 'var(--color-text-light)' }}>{vA}</span>
                        {aBetter && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: 'var(--color-win)' }}>▲</span>}
                      </div>
                      <div style={{ padding: '12px 6px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{s.label}</span>
                        {entry?.secondaryLabel && <span style={{ fontSize: '0.58rem', color: 'var(--color-text-light)', marginTop: '2px' }}>{entry.secondaryLabel}</span>}
                      </div>
                      <div style={{ padding: '12px 18px', textAlign: 'left' }}>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: bBetter ? '#E6B000' : equal ? 'var(--color-text-muted)' : 'var(--color-text-light)' }}>{vB}</span>
                        {bBetter && <span style={{ marginLeft: '6px', fontSize: '0.6rem', color: 'var(--color-win)' }}>▲</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {(!playerA || !playerB) && (
              <div className="card" style={{ padding: '56px', textAlign: 'center', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)', background: 'transparent', boxShadow: 'none' }}>
                <ArrowLeftRight size={44} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
                <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px', color: 'var(--color-text)' }}>Select two United players to compare</div>
                <div style={{ fontSize: '0.85rem' }}>FotMob 2025/26 season data</div>
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: vs League (SofaScore)                             */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'league' && (
          <>
            {sofaLoading ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                Loading league data…
              </div>
            ) : (
              <>
                {/* Player pickers */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap' }}>
                  <LeaguePlayerPicker
                    label="United Player"
                    selected={leaguePlayerA}
                    onSelect={setLeaguePlayerA}
                    players={sofaPlayers}
                    unitedOnly
                    accentColor="var(--color-primary)"
                  />
                  <div style={{ display: 'flex', alignItems: 'center', paddingTop: '26px', flexShrink: 0 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--color-primary), var(--color-accent))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ArrowLeftRight size={16} color="white" />
                    </div>
                  </div>
                  <LeaguePlayerPicker
                    label="Any EPL Player"
                    selected={leaguePlayerB}
                    onSelect={setLeaguePlayerB}
                    players={sofaPlayers}
                    accentColor="#D4A017"
                  />
                </div>

                {/* Viz type selector & controls */}
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Visualization</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {VIZ_OPTIONS.filter(v => v.key !== 'heatmap').map(viz => {
                      const active = vizType === viz.key;
                      return (
                        <button
                          key={viz.key}
                          onClick={() => setVizType(viz.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '8px',
                            border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: active ? 'rgba(139,0,0,0.04)' : 'white',
                            cursor: 'pointer', transition: 'all 0.15s',
                            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.78rem',
                          }}
                        >
                          <viz.Icon size={14} />
                          {viz.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Beeswarm metric selector */}
                  {vizType === 'beeswarm' && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>METRIC</div>
                      <select
                        value={beeswarmMetric}
                        onChange={e => setBeeswarmMetric(e.target.value)}
                        className="search-input"
                        style={{ fontSize: '0.82rem', padding: '8px 12px', maxWidth: '300px' }}
                      >
                        {STAT_CATEGORIES.map(cat => (
                          <optgroup key={cat.key} label={`${cat.icon} ${cat.label}`}>
                            {availableMetrics.filter(s => s.category === cat.key).map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Scatter axis selectors */}
                  {vizType === 'scatter' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {[{ label: 'X Axis', val: scatterX, set: setScatterX }, { label: 'Y Axis', val: scatterY, set: setScatterY }].map(axis => (
                        <div key={axis.label}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>{axis.label}</div>
                          <select
                            value={axis.val}
                            onChange={e => axis.set(e.target.value)}
                            className="search-input"
                            style={{ fontSize: '0.82rem', padding: '8px 12px', minWidth: '180px' }}
                          >
                            {STAT_CATEGORIES.map(cat => (
                              <optgroup key={cat.key} label={`${cat.icon} ${cat.label}`}>
                                {availableMetrics.filter(s => s.category === cat.key).map(s => (
                                  <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Stat picker (full-width for pizza) */}
                {vizType === 'pizza' && (
                  <div style={{ marginBottom: '24px' }}>
                    <StatPicker selected={selectedStats} onChange={setSelectedStats} max={12} />
                  </div>
                )}

                {/* Chart area */}
                {leaguePlayerA && (
                  <div className="card fade-in" style={{ padding: '20px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                        {VIZ_OPTIONS.find(v => v.key === vizType)?.label} · {leaguePlayerA.player_name}
                        {leaguePlayerB && ` vs ${leaguePlayerB.player_name}`}
                      </div>
                      <button
                        onClick={() => downloadChart(chartRef.current, `rd-analytics-${vizType}`)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '4px',
                          padding: '6px 12px', borderRadius: '8px',
                          border: '1px solid var(--color-border)',
                          background: 'white', cursor: 'pointer',
                          fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)',
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                      >
                        <Download size={12} /> Download
                      </button>
                    </div>
                    <div ref={chartRef}>
                      {vizType === 'pizza' && (
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                          <PizzaChart
                            player={leaguePlayerA}
                            comparePlayer={leaguePlayerB}
                            allPlayers={sofaPlayers}
                            selectedStats={selectedStats}
                          />
                        </div>
                      )}
                      {vizType === 'beeswarm' && (
                        <BeeswarmPlot
                          metric={beeswarmMetric}
                          highlightPlayer={leaguePlayerA}
                          allPlayers={sofaPlayers}
                        />
                      )}
                      {vizType === 'scatter' && (
                        <ScatterPlotChart
                          xMetric={scatterX}
                          yMetric={scatterY}
                          allPlayers={sofaPlayers}
                        />
                      )}
                    </div>
                  </div>
                )}

                {!leaguePlayerA && (
                  <div className="card" style={{ padding: '56px', textAlign: 'center', color: 'var(--color-text-muted)', border: '2px dashed var(--color-border)', background: 'transparent', boxShadow: 'none' }}>
                    <ArrowLeftRight size={44} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '6px', color: 'var(--color-text)' }}>Select a United player to start</div>
                    <div style={{ fontSize: '0.85rem' }}>Compare against any Premier League player using SofaScore data</div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: League Analytics                                   */}
        {/* ═══════════════════════════════════════════════════════ */}
        {mode === 'analytics' && (
          <>
            {sofaLoading ? (
              <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                <div className="spinner" style={{ margin: '0 auto 12px' }} />
                Loading league data…
              </div>
            ) : (
              <>
                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Visualization</div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {VIZ_OPTIONS.map(viz => {
                      const active = vizType === viz.key;
                      return (
                        <button
                          key={viz.key}
                          onClick={() => setVizType(viz.key)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 14px', borderRadius: '8px',
                            border: active ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                            background: active ? 'rgba(139,0,0,0.04)' : 'white',
                            cursor: 'pointer', transition: 'all 0.15s',
                            color: active ? 'var(--color-primary)' : 'var(--color-text-muted)',
                            fontWeight: active ? 700 : 500,
                            fontSize: '0.78rem',
                          }}
                        >
                          <viz.Icon size={14} />
                          {viz.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Beeswarm metric */}
                  {vizType === 'beeswarm' && (
                    <div style={{ marginTop: '12px' }}>
                      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>METRIC</div>
                      <select value={beeswarmMetric} onChange={e => setBeeswarmMetric(e.target.value)} className="search-input" style={{ fontSize: '0.82rem', padding: '8px 12px', maxWidth: '300px' }}>
                        {STAT_CATEGORIES.map(cat => (
                          <optgroup key={cat.key} label={`${cat.icon} ${cat.label}`}>
                            {availableMetrics.filter(s => s.category === cat.key).map(s => (
                              <option key={s.key} value={s.key}>{s.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>HIGHLIGHT PLAYER</div>
                        <LeaguePlayerPicker
                          label=""
                          selected={leaguePlayerA}
                          onSelect={setLeaguePlayerA}
                          players={sofaPlayers}
                        />
                      </div>
                    </div>
                  )}

                  {/* Scatter axes */}
                  {vizType === 'scatter' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      {[{ label: 'X Axis', val: scatterX, set: setScatterX }, { label: 'Y Axis', val: scatterY, set: setScatterY }].map(axis => (
                        <div key={axis.label}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', marginBottom: '6px' }}>{axis.label}</div>
                          <select value={axis.val} onChange={e => axis.set(e.target.value)} className="search-input" style={{ fontSize: '0.82rem', padding: '8px 12px', minWidth: '180px' }}>
                            {STAT_CATEGORIES.map(cat => (
                              <optgroup key={cat.key} label={`${cat.icon} ${cat.label}`}>
                                {availableMetrics.filter(s => s.category === cat.key).map(s => (
                                  <option key={s.key} value={s.key}>{s.label}</option>
                                ))}
                              </optgroup>
                            ))}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Pizza player pickers */}
                  {vizType === 'pizza' && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <LeaguePlayerPicker
                        label="Primary Player"
                        selected={leaguePlayerA}
                        onSelect={setLeaguePlayerA}
                        players={sofaPlayers}
                      />
                      <LeaguePlayerPicker
                        label="Compare (optional)"
                        selected={leaguePlayerB}
                        onSelect={setLeaguePlayerB}
                        players={sofaPlayers}
                      />
                    </div>
                  )}
                </div>

                {/* Stat picker */}
                {(vizType === 'pizza' || vizType === 'heatmap') && (
                  <div style={{ marginBottom: '24px' }}>
                    <StatPicker
                      selected={selectedStats}
                      onChange={setSelectedStats}
                      max={vizType === 'pizza' ? 12 : undefined}
                    />
                  </div>
                )}

                {/* Chart */}
                <div className="card fade-in" style={{ padding: '20px', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                      {VIZ_OPTIONS.find(v => v.key === vizType)?.label}
                      {vizType === 'heatmap' && ' · Manchester United Squad'}
                      {vizType === 'beeswarm' && ` · ${STAT_BY_KEY[beeswarmMetric]?.label || beeswarmMetric}`}
                    </div>
                    <button
                      onClick={() => downloadChart(chartRef.current, `rd-analytics-${vizType}`)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '6px 12px', borderRadius: '8px',
                        border: '1px solid var(--color-border)',
                        background: 'white', cursor: 'pointer',
                        fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)',
                        transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-primary)'; e.currentTarget.style.color = 'var(--color-primary)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                    >
                      <Download size={12} /> Download
                    </button>
                  </div>
                  <div ref={chartRef}>
                    {vizType === 'heatmap' && (
                      <ZScoreHeatmap
                        selectedStats={selectedStats}
                        allPlayers={sofaPlayers}
                      />
                    )}
                    {vizType === 'beeswarm' && leaguePlayerA && (
                      <BeeswarmPlot
                        metric={beeswarmMetric}
                        highlightPlayer={leaguePlayerA}
                        allPlayers={sofaPlayers}
                      />
                    )}
                    {vizType === 'beeswarm' && !leaguePlayerA && (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Select a player to highlight in the distribution
                      </div>
                    )}
                    {vizType === 'scatter' && (
                      <ScatterPlotChart
                        xMetric={scatterX}
                        yMetric={scatterY}
                        allPlayers={sofaPlayers}
                      />
                    )}
                    {vizType === 'pizza' && leaguePlayerA && (
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <PizzaChart
                          player={leaguePlayerA}
                          comparePlayer={leaguePlayerB}
                          allPlayers={sofaPlayers}
                          selectedStats={selectedStats}
                        />
                      </div>
                    )}
                    {vizType === 'pizza' && !leaguePlayerA && (
                      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        Select a player to view their percentile pizza chart
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
