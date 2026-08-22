import { useMemo } from 'react';
import type { SofaScorePlayer } from '../../types';
import { STAT_BY_KEY } from '../../data/statRegistry';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from 'recharts';

interface Props {
  players: SofaScorePlayer[];
  allPlayers: SofaScorePlayer[];
  selectedStats: string[];
  layout?: 'vertical' | 'horizontal';
}

const PLAYER_COLORS = [
  '#0284c7', // Cyan Blue
  '#f43f5e', // Rose Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
];

export default function PercentileBarChart({ players, allPlayers, selectedStats, layout = 'vertical' }: Props) {
  const activePlayers = players.filter(Boolean).slice(0, 4);

  const data = useMemo(() => {
    if (activePlayers.length === 0 || allPlayers.length === 0 || selectedStats.length === 0) return [];

    const getPercentile = (p: SofaScorePlayer, key: string): number => {
      const pos = p.position;
      let peers = allPlayers.filter(
        peer => pos && peer.position === pos && peer.statistics && (peer.statistics.minutesPlayed ?? 0) >= 180
      );
      if (peers.length === 0) {
        peers = allPlayers.filter(peer => peer.statistics && (peer.statistics.minutesPlayed ?? 0) > 0);
      }

      const val = (p.statistics as Record<string, unknown>)?.[key];
      if (val == null || typeof val !== 'number' || isNaN(val)) return 50;

      const values = peers
        .map(peer => (peer.statistics as Record<string, unknown>)?.[key])
        .filter((v): v is number => typeof v === 'number' && !isNaN(v))
        .sort((a, b) => a - b);
      if (values.length === 0) return 50;

      const rank = values.filter(v => v <= val).length;
      const statDef = STAT_BY_KEY[key];
      const pct = (rank / values.length) * 100;
      const finalPct = statDef?.higherIsBetter === false ? 100 - pct : pct;
      return isNaN(finalPct) || !isFinite(finalPct) ? 50 : Math.round(Math.min(99, Math.max(1, finalPct)));
    };

    return selectedStats.map(statKey => {
      const statDef = STAT_BY_KEY[statKey];
      const row: any = {
        name: statDef?.label || statKey
      };
      
      activePlayers.forEach((p, idx) => {
        row[`Player${idx}`] = getPercentile(p, statKey);
      });
      return row;
    });
  }, [activePlayers, allPlayers, selectedStats]);

  if (activePlayers.length === 0) {
    return <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '20px' }}>No players selected for comparison.</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ background: '#ffffff', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#0f172a', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <p style={{ fontWeight: 700, margin: '0 0 8px 0', borderBottom: '1px solid #e2e8f0', paddingBottom: '6px' }}>{label} Percentile</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0', fontSize: '0.85rem' }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: entry.color }} />
              <span style={{ fontWeight: 600 }}>{activePlayers[index]?.player_name}:</span>
              <span>{entry.value}%</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const renderLegend = () => {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }}>
        {activePlayers.map((p, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', fontWeight: 700, color: '#334155' }}>
            <span style={{ width: 12, height: 12, borderRadius: '4px', background: PLAYER_COLORS[idx] }} />
            {p.player_name}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={{ width: '100%', height: 400 }}>
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout={layout}
          margin={layout === 'vertical' ? { top: 20, right: 30, left: 100, bottom: 5 } : { top: 20, right: 10, left: -15, bottom: 50 }}
          barGap={layout === 'vertical' ? 4 : 2}
          barSize={layout === 'vertical' ? 12 : 10}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={layout === 'vertical'} stroke="#e2e8f0" />
          
          {layout === 'vertical' ? (
            <>
              <XAxis type="number" domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} />
              <YAxis dataKey="name" type="category" stroke="#cbd5e1" tick={{ fontSize: 11, fill: '#475569' }} width={120} />
            </>
          ) : (
            <>
              <XAxis dataKey="name" type="category" stroke="#cbd5e1" tick={{ fontSize: 9.5, fill: '#475569' }} angle={-35} textAnchor="end" height={60} interval={0} />
              <YAxis type="number" domain={[0, 100]} stroke="#cbd5e1" tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(val) => `${val}%`} width={45} />
            </>
          )}

          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
          <Legend content={renderLegend} />
          
          {activePlayers.map((_, idx) => (
            <Bar key={idx} dataKey={`Player${idx}`} fill={PLAYER_COLORS[idx]} radius={layout === 'vertical' ? [0, 4, 4, 0] : [4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={PLAYER_COLORS[idx]} />
              ))}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
