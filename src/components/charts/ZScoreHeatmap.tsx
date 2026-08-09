import { useMemo } from 'react';
import type { SofaScorePlayer } from '../../types';
import { STAT_BY_KEY } from '../../data/statRegistry';

interface Props {
  teamName?: string;
  selectedStats: string[];
  allPlayers: SofaScorePlayer[];
  width?: number;
}

const MAN_UTD = 'Manchester United';

export default function ZScoreHeatmap({ teamName = MAN_UTD, selectedStats, allPlayers, width = 700 }: Props) {
  const { rows } = useMemo(() => {
    if (selectedStats.length === 0) return { rows: [], cols: [] };

    // League-wide stats for Z-score calculation
    const validPlayers = allPlayers.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) >= 450);

    // Calculate mean and std for each stat
    const statInfo: Record<string, { mean: number; std: number }> = {};
    for (const key of selectedStats) {
      const values = validPlayers
        .map(p => (p.statistics as Record<string, unknown>)?.[key])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v));

      if (values.length === 0) {
        statInfo[key] = { mean: 0, std: 1 };
        continue;
      }
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + (b - mean) ** 2, 0) / values.length;
      statInfo[key] = { mean, std: Math.sqrt(variance) || 1 };
    }

    // Team players
    const teamPlayers = validPlayers
      .filter(p => p.team_name === teamName)
      .sort((a, b) => a.player_name.localeCompare(b.player_name));

    const rows = teamPlayers.map(p => {
      const cells: { key: string; raw: number; zScore: number }[] = [];
      for (const key of selectedStats) {
        const raw = ((p.statistics as Record<string, unknown>)?.[key] as number) ?? 0;
        const { mean, std } = statInfo[key];
        const z = (raw - mean) / std;
        cells.push({ key, raw, zScore: z });
      }
      return { player: p, cells };
    });

    const cols = selectedStats.map(key => STAT_BY_KEY[key]?.label || key);

    return { rows, cols };
  }, [teamName, selectedStats, allPlayers]);

  if (selectedStats.length === 0 || rows.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        {selectedStats.length === 0 ? 'Select stats to generate the heatmap' : `No players found for ${teamName}`}
      </div>
    );
  }

  const cellW = Math.max(60, Math.min(90, (width - 140) / selectedStats.length));

  const nameW = 130;
  const totalW = nameW + cellW * selectedStats.length;

  // Z-score to color
  const zColor = (z: number, higherIsBetter: boolean): string => {
    const effectiveZ = higherIsBetter ? z : -z;
    const clamped = Math.max(-3, Math.min(3, effectiveZ));
    if (clamped >= 0) {
      // Green gradient
      const t = clamped / 3;
      const r = Math.round(240 - t * 180);
      const g = Math.round(240 - t * 40);
      const b = Math.round(240 - t * 180);
      return `rgb(${r},${g},${b})`;
    } else {
      // Red gradient
      const t = -clamped / 3;
      const r = Math.round(240 - t * 20);
      const g = Math.round(240 - t * 160);
      const b = Math.round(240 - t * 160);
      return `rgb(${r},${g},${b})`;
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: `${totalW}px` }}>
        {/* Header */}
        <div style={{ display: 'flex', position: 'sticky', top: 0, zIndex: 2, background: 'white' }}>
          <div style={{ width: `${nameW}px`, flexShrink: 0, padding: '8px 10px', fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', borderBottom: '2px solid var(--color-border)' }}>
            Player
          </div>
          {selectedStats.map((key) => {
            const def = STAT_BY_KEY[key];
            return (
              <div key={key} style={{
                width: `${cellW}px`, flexShrink: 0, padding: '6px 4px',
                fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-text-muted)',
                textAlign: 'center', borderBottom: '2px solid var(--color-border)',
                lineHeight: 1.2,
              }}>
                <div>{def?.label || key}</div>
              </div>
            );
          })}
        </div>

        {/* Rows */}
        {rows.map((row, rowIdx) => (
          <div key={row.player.player_id} style={{
            display: 'flex',
            borderBottom: '1px solid var(--color-border)',
            background: rowIdx % 2 === 0 ? 'white' : '#fafafa',
          }}>
            <div style={{
              width: `${nameW}px`, flexShrink: 0, padding: '8px 10px',
              fontSize: '0.78rem', fontWeight: 600, color: 'var(--color-text)',
              display: 'flex', alignItems: 'center', gap: '6px',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: '50%', background: 'var(--color-primary)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '0.55rem', fontWeight: 800, flexShrink: 0,
              }}>
                {row.player.player_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
              </span>
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {row.player.player_name.split(' ').pop()}
              </span>
            </div>
            {row.cells.map(cell => {
              const def = STAT_BY_KEY[cell.key];
              const bg = zColor(cell.zScore, def?.higherIsBetter !== false);
              return (
                <div key={cell.key} style={{
                  width: `${cellW}px`, flexShrink: 0, padding: '6px 4px',
                  textAlign: 'center', background: bg,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1A1A1A' }}>
                    {cell.raw % 1 === 0 ? cell.raw : cell.raw.toFixed(1)}
                  </span>
                  <span style={{ fontSize: '0.55rem', color: '#6b7280' }}>
                    {cell.zScore >= 0 ? '+' : ''}{cell.zScore.toFixed(1)}σ
                  </span>
                </div>
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Below avg</span>
          <div style={{ display: 'flex', borderRadius: '4px', overflow: 'hidden' }}>
            {[-2, -1, 0, 1, 2].map(z => (
              <div key={z} style={{ width: 24, height: 12, background: zColor(z, true) }} />
            ))}
          </div>
          <span style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)' }}>Above avg</span>
        </div>
      </div>
    </div>
  );
}
