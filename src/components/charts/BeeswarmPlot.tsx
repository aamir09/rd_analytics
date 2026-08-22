import { useMemo, useState } from 'react';
import type { SofaScorePlayer } from '../../types';
import { STAT_BY_KEY } from '../../data/statRegistry';

interface Props {
  metric: string;
  highlightPlayers?: SofaScorePlayer[];
  allPlayers: SofaScorePlayer[];
  width?: number;
  height?: number;
}

const MAN_UTD = 'Manchester United';

export default function BeeswarmPlot({
  metric,
  highlightPlayers = [],
  allPlayers,
  width = 720,
  height = 240,
}: Props) {
  const [hovered, setHovered] = useState<{ player: SofaScorePlayer; value: number } | null>(null);
  const statDef = STAT_BY_KEY[metric];

  const { dots, xScale, min, max } = useMemo(() => {
    // Filter players with >= 450 minutes played and valid metric
    const entries = allPlayers
      .filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) >= 450)
      .map(p => ({
        player: p,
        value: (p.statistics as Record<string, unknown>)?.[metric],
      }))
      .filter((e): e is { player: SofaScorePlayer; value: number } => typeof e.value === 'number' && !isNaN(e.value));

    if (entries.length === 0) return { dots: [], xScale: (_v: number) => 0, min: 0, max: 0 };

    const values = entries.map(e => e.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const margin = 60;
    const xScale = (v: number) => margin + ((v - min) / range) * (width - margin * 2);

    const r = 4.5;
    const dots = entries.map(e => ({
      ...e,
      x: xScale(e.value),
      y: height / 2 - 5,
      r,
    }));

    dots.sort((a, b) => a.x - b.x);

    // Collision simulation
    for (let iter = 0; iter < 12; iter++) {
      for (let i = 0; i < dots.length; i++) {
        for (let j = i + 1; j < dots.length; j++) {
          const dx = dots[j].x - dots[i].x;
          const dy = dots[j].y - dots[i].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = dots[i].r + dots[j].r + 1.2;
          if (dist < minDist && dist > 0) {
            const push = (minDist - dist) / 2;
            const angle = Math.atan2(dy, dx);
            dots[j].y += Math.sin(angle) * push + 0.4;
            dots[i].y -= Math.sin(angle) * push + 0.4;
          }
        }
      }
      for (const d of dots) {
        d.y = Math.max(r + 30, Math.min(height - r - 35, d.y));
      }
    }

    return { dots, xScale, min, max };
  }, [metric, allPlayers, width, height]);

  if (dots.length === 0 || !statDef) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        No data available for {statDef?.label || metric}
      </div>
    );
  }

  const highlightIds = new Set(highlightPlayers.map(p => p.player_id));
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => min + (i / tickCount) * (max - min));

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Axis line */}
        <line x1={50} y1={height - 28} x2={width - 50} y2={height - 28} stroke="#cbd5e1" strokeWidth={1.5} />

        {/* Ticks */}
        {ticks.map((t, i) => {
          const x = xScale(t);
          return (
            <g key={i}>
              <line x1={x} y1={height - 28} x2={x} y2={height - 22} stroke="#94a3b8" strokeWidth={1} />
              <text x={x} y={height - 8} textAnchor="middle" fontSize={9.5} fill="#64748b" fontWeight={500} fontFamily="Inter, system-ui, sans-serif">
                {t % 1 === 0 ? t : t.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* All normal dots */}
        {dots.map((d, i) => {
          const isHighlight = highlightIds.has(d.player.player_id);
          const isHovered = hovered?.player.player_id === d.player.player_id;

          if (isHighlight) return null; // Draw on top

          return (
            <circle
              key={`normal-${i}`}
              cx={d.x}
              cy={d.y}
              r={isHovered ? 7.5 : d.r}
              fill={isHovered ? '#0f172a' : '#cbd5e1'}
              opacity={isHovered ? 1.0 : 0.6}
              stroke={isHovered ? '#ffffff' : 'none'}
              strokeWidth={isHovered ? 2 : 0}
              style={{ cursor: 'pointer', transition: 'r 0.15s, opacity 0.15s' }}
              onMouseEnter={() => setHovered({ player: d.player, value: d.value })}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* Highlighted Target Player Dots */}
        {dots.filter(d => highlightIds.has(d.player.player_id)).map((d, i) => {
          const isHovered = hovered?.player.player_id === d.player.player_id;
          return (
            <g
              key={`highlight-${i}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered({ player: d.player, value: d.value })}
              onMouseLeave={() => setHovered(null)}
            >
              <circle
                cx={d.x}
                cy={d.y}
                r={isHovered ? 10 : 7.5}
                fill="#dc2626"
                stroke="#ffffff"
                strokeWidth={2}
                style={{ transition: 'r 0.15s' }}
              />
              <text 
                x={d.x} 
                y={d.y - (isHovered ? 14 : 11)} 
                textAnchor="middle" 
                fontSize={10} 
                fontWeight={700}
                fill="#0f172a"
                style={{ pointerEvents: 'none' }}
              >
                {d.player.player_name.split(' ').pop()}
              </text>
            </g>
          );
        })}

        {/* Chart Title / Axis Label */}
        <text x={width / 2} y={16} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#334155" fontFamily="Inter, system-ui, sans-serif">
          {statDef.label} — Premier League Distribution
        </text>
      </svg>

      {/* Floating Hover Card for any player dot */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            background: '#ffffff',
            border: '1px solid var(--color-border)',
            borderRadius: '8px',
            padding: '8px 12px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            fontSize: '0.78rem',
            pointerEvents: 'none',
            zIndex: 10,
            animation: 'fadeIn 0.15s ease-out',
          }}
        >
          <div style={{ fontWeight: 800, color: hovered.player.team_name === MAN_UTD ? 'var(--color-primary)' : '#0f172a' }}>
            {hovered.player.player_name}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>
            {hovered.player.team_name} ({hovered.player.team_code}) · {hovered.player.position}
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.78rem', fontWeight: 700, color: '#1e293b' }}>
            {statDef.label}: <span style={{ color: 'var(--color-primary)' }}>{hovered.value}</span>
          </div>
        </div>
      )}
    </div>
  );
}
