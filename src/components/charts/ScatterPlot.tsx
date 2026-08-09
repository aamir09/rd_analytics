import { useMemo, useState } from 'react';
import type { SofaScorePlayer } from '../../types';
import { STAT_BY_KEY } from '../../data/statRegistry';

interface Props {
  xMetric: string;
  yMetric: string;
  allPlayers: SofaScorePlayer[];
  highlightTeam?: string;
  width?: number;
  height?: number;
}

const MAN_UTD = 'Manchester United';
const MARGIN = { top: 40, right: 30, bottom: 50, left: 60 };

export default function ScatterPlot({
  xMetric,
  yMetric,
  allPlayers,
  highlightTeam = MAN_UTD,
  width = 680,
  height = 480,
}: Props) {
  const [hovered, setHovered] = useState<SofaScorePlayer | null>(null);

  const xDef = STAT_BY_KEY[xMetric];
  const yDef = STAT_BY_KEY[yMetric];

  const { dots, xScale, yScale, xMin, xMax, yMin, yMax, hullPoints } = useMemo(() => {
    const entries = allPlayers
      .filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) >= 450)
      .map(p => ({
        player: p,
        xVal: (p.statistics as Record<string, unknown>)?.[xMetric],
        yVal: (p.statistics as Record<string, unknown>)?.[yMetric],
      }))
      .filter((e): e is { player: SofaScorePlayer; xVal: number; yVal: number } =>
        typeof e.xVal === 'number' && !isNaN(e.xVal) && typeof e.yVal === 'number' && !isNaN(e.yVal)
      );

    if (entries.length === 0)
      return { dots: [], xScale: () => 0, yScale: () => 0, xMin: 0, xMax: 0, yMin: 0, yMax: 0, hullPoints: '' };

    const xVals = entries.map(e => e.xVal);
    const yVals = entries.map(e => e.yVal);
    const xMin = Math.min(...xVals);
    const xMax = Math.max(...xVals);
    const yMin = Math.min(...yVals);
    const yMax = Math.max(...yVals);
    const xRange = xMax - xMin || 1;
    const yRange = yMax - yMin || 1;

    const plotW = width - MARGIN.left - MARGIN.right;
    const plotH = height - MARGIN.top - MARGIN.bottom;

    const xScale = (v: number) => MARGIN.left + ((v - xMin) / xRange) * plotW;
    const yScale = (v: number) => MARGIN.top + plotH - ((v - yMin) / yRange) * plotH;

    const dots = entries.map(e => ({
      player: e.player,
      x: xScale(e.xVal),
      y: yScale(e.yVal),
      xVal: e.xVal,
      yVal: e.yVal,
    }));

    // Convex hull for highlight team
    const teamDots = dots.filter(d => d.player.team_name === highlightTeam);
    let hullPoints = '';
    if (teamDots.length >= 3) {
      const hull = convexHull(teamDots.map(d => [d.x, d.y]));
      hullPoints = hull.map(p => p.join(',')).join(' ');
    }

    return { dots, xScale, yScale, xMin, xMax, yMin, yMax, hullPoints };
  }, [xMetric, yMetric, allPlayers, highlightTeam, width, height]);

  if (dots.length === 0 || !xDef || !yDef) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Select two stats for the scatter plot
      </div>
    );
  }

  const plotW = width - MARGIN.left - MARGIN.right;
  const plotH = height - MARGIN.top - MARGIN.bottom;
  const xTicks = 6;
  const yTicks = 6;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto' }}>
        {/* Grid lines */}
        {Array.from({ length: xTicks + 1 }, (_, i) => {
          const v = xMin + (i / xTicks) * (xMax - xMin);
          const x = xScale(v);
          return (
            <g key={`x${i}`}>
              <line x1={x} y1={MARGIN.top} x2={x} y2={height - MARGIN.bottom} stroke="#f1f5f9" strokeWidth={1} />
              <text x={x} y={height - MARGIN.bottom + 18} textAnchor="middle" fontSize={9} fill="#94a3b8" fontFamily="Inter, system-ui, sans-serif">
                {v % 1 === 0 ? v : v.toFixed(1)}
              </text>
            </g>
          );
        })}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const v = yMin + (i / yTicks) * (yMax - yMin);
          const y = yScale(v);
          return (
            <g key={`y${i}`}>
              <line x1={MARGIN.left} y1={y} x2={width - MARGIN.right} y2={y} stroke="#f1f5f9" strokeWidth={1} />
              <text x={MARGIN.left - 8} y={y + 3} textAnchor="end" fontSize={9} fill="#94a3b8" fontFamily="Inter, system-ui, sans-serif">
                {v % 1 === 0 ? v : v.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* Convex hull polygon for Manchester United */}
        {hullPoints && (
          <polygon
            points={hullPoints}
            fill="rgba(220,38,38,0.08)"
            stroke="rgba(220,38,38,0.35)"
            strokeWidth={1.5}
            strokeDasharray="4 2"
          />
        )}

        {/* Non-United dots first */}
        {dots.filter(d => d.player.team_name !== highlightTeam).map((d, i) => {
          const isHov = hovered?.player_id === d.player.player_id;
          return (
            <circle
              key={`nonutd-${i}`}
              cx={d.x}
              cy={d.y}
              r={isHov ? 7.5 : 4}
              fill={isHov ? '#0f172a' : '#94a3b8'}
              opacity={isHov ? 1.0 : 0.45}
              stroke={isHov ? '#ffffff' : 'none'}
              strokeWidth={isHov ? 2 : 0}
              style={{ cursor: 'pointer', transition: 'r 0.15s, opacity 0.15s' }}
              onMouseEnter={() => setHovered(d.player)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}

        {/* United dots on top */}
        {dots.filter(d => d.player.team_name === highlightTeam).map((d, i) => {
          const isHov = hovered?.player_id === d.player.player_id;
          return (
            <g
              key={`utd-${i}`}
              onMouseEnter={() => setHovered(d.player)}
              onMouseLeave={() => setHovered(null)}
              style={{ cursor: 'pointer' }}
            >
              <circle
                cx={d.x}
                cy={d.y}
                r={isHov ? 8.5 : 5.5}
                fill="#DC2626"
                opacity={isHov ? 1.0 : 0.9}
                stroke={isHov ? '#0f172a' : '#991B1B'}
                strokeWidth={isHov ? 2.5 : 1}
                style={{ transition: 'r 0.15s' }}
              />
            </g>
          );
        })}

        {/* Axis labels */}
        <text x={MARGIN.left + plotW / 2} y={height - 6} textAnchor="middle" fontSize={11} fontWeight={700} fill="#334155" fontFamily="Inter, system-ui, sans-serif">
          {xDef.label}
        </text>
        <text
          x={14}
          y={MARGIN.top + plotH / 2}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill="#334155"
          fontFamily="Inter, system-ui, sans-serif"
          transform={`rotate(-90 14 ${MARGIN.top + plotH / 2})`}
        >
          {yDef.label}
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
          <div style={{ fontWeight: 800, color: hovered.team_name === MAN_UTD ? 'var(--color-primary)' : '#0f172a' }}>
            {hovered.player_name}
          </div>
          <div style={{ color: 'var(--color-text-muted)', fontSize: '0.68rem', fontWeight: 600 }}>
            {hovered.team_name} ({hovered.team_code}) · {hovered.position}
          </div>
          <div style={{ marginTop: '4px', fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>{xDef.label}:</span>{' '}
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {(hovered.statistics as Record<string, unknown>)?.[xMetric] as number ?? '—'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem' }}>
            <span style={{ fontWeight: 600 }}>{yDef.label}:</span>{' '}
            <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>
              {(hovered.statistics as Record<string, unknown>)?.[yMetric] as number ?? '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple convex hull (Graham scan)
function convexHull(points: number[][]): number[][] {
  if (points.length < 3) return points;
  const pts = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);

  const cross = (o: number[], a: number[], b: number[]) =>
    (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);

  const lower: number[][] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }

  const upper: number[][] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}
