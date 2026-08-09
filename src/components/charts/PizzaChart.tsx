import { useRef, useEffect } from 'react';
import type { SofaScorePlayer } from '../../types';
import { STAT_BY_KEY } from '../../data/statRegistry';

interface Props {
  player: SofaScorePlayer;
  comparePlayer?: SofaScorePlayer | null;
  allPlayers: SofaScorePlayer[];
  selectedStats: string[];
  width?: number;
  height?: number;
}

const PLAYER_A_COLOR = '#DC2626'; // Manchester United Red
const PLAYER_B_COLOR = '#2563EB'; // Vibrant Blue for comparison

export default function PizzaChart({
  player,
  comparePlayer,
  allPlayers,
  selectedStats,
  width = 580,
  height = 580,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || selectedStats.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Filter league players by same position + min 450 minutes
    const pos = player.position;
    const peers = allPlayers.filter(
      p => p.position === pos && p.statistics && (p.statistics.minutesPlayed ?? 0) >= 450
    );

    // Calculate percentile for a stat
    const getPercentile = (p: SofaScorePlayer, key: string): number => {
      const val = (p.statistics as Record<string, unknown>)?.[key];
      if (val == null || typeof val !== 'number') return 0;
      const values = peers
        .map(peer => (peer.statistics as Record<string, unknown>)?.[key])
        .filter((v): v is number => typeof v === 'number')
        .sort((a, b) => a - b);
      if (values.length === 0) return 0;
      const rank = values.filter(v => v <= val).length;
      const statDef = STAT_BY_KEY[key];
      const pct = (rank / values.length) * 100;
      return statDef?.higherIsBetter === false ? 100 - pct : pct;
    };

    const cx = width / 2;
    const cy = height / 2;
    // Generous margin to prevent label truncation
    const maxR = Math.min(cx, cy) - 105;
    const n = selectedStats.length;
    const angleStep = (Math.PI * 2) / n;

    ctx.clearRect(0, 0, width, height);

    // Background circular grid
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 0.8;
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * maxR;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Radial axis lines
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
      const angle = -Math.PI / 2 + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
      ctx.stroke();
    }

    // Ring label numbers
    ctx.fillStyle = '#94a3b8';
    ctx.font = '500 9px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';
    for (let ring = 1; ring <= 4; ring++) {
      const r = (ring / 4) * maxR;
      ctx.fillText(`${ring * 25}`, cx, cy - r - 2);
    }

    // Function to draw player pizza slices in their assigned color
    const drawPlayerSlices = (p: SofaScorePlayer, color: string, fillAlpha: number, strokeAlpha: number) => {
      for (let i = 0; i < n; i++) {
        const key = selectedStats[i];
        const pct = getPercentile(p, key);
        const r = Math.max((pct / 100) * maxR, 4);
        const startAngle = -Math.PI / 2 + i * angleStep;
        const endAngle = startAngle + angleStep;

        // Draw filled arc slice
        ctx.globalAlpha = fillAlpha;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();

        // Draw slice border line
        ctx.globalAlpha = strokeAlpha;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    };

    // Draw compare player first if present (behind main player)
    if (comparePlayer) {
      drawPlayerSlices(comparePlayer, PLAYER_B_COLOR, 0.35, 0.85);
    }

    // Draw main player
    drawPlayerSlices(player, PLAYER_A_COLOR, comparePlayer ? 0.45 : 0.65, 0.95);

    ctx.globalAlpha = 1.0;

    // Draw labels & values on the outer ring with padding
    for (let i = 0; i < n; i++) {
      const key = selectedStats[i];
      const statDef = STAT_BY_KEY[key];
      const sliceCenterAngle = -Math.PI / 2 + i * angleStep + angleStep / 2;

      const labelDist = maxR + 25;
      const lx = cx + Math.cos(sliceCenterAngle) * labelDist;
      const ly = cy + Math.sin(sliceCenterAngle) * labelDist;

      // Determine text-align based on angle
      const cosA = Math.cos(sliceCenterAngle);

      if (Math.abs(cosA) < 0.2) {
        ctx.textAlign = 'center';
      } else if (cosA > 0) {
        ctx.textAlign = 'left';
      } else {
        ctx.textAlign = 'right';
      }

      ctx.textBaseline = 'middle';

      // Stat label
      ctx.font = '600 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#1e293b';
      const labelText = statDef?.label || key;
      ctx.fillText(labelText, lx, ly - (comparePlayer ? 8 : 6));

      // Percentile value string(s)
      const pctA = Math.round(getPercentile(player, key));
      if (comparePlayer) {
        const pctB = Math.round(getPercentile(comparePlayer, key));
        ctx.font = '700 10px Inter, system-ui, sans-serif';
        // Player A pct in red, Player B pct in blue
        const textY = ly + 8;
        if (ctx.textAlign === 'center') {
          ctx.fillStyle = PLAYER_A_COLOR;
          ctx.fillText(`${pctA}%`, lx - 14, textY);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('vs', lx, textY);
          ctx.fillStyle = PLAYER_B_COLOR;
          ctx.fillText(`${pctB}%`, lx + 14, textY);
        } else if (ctx.textAlign === 'right') {
          ctx.fillStyle = PLAYER_B_COLOR;
          ctx.fillText(`${pctB}%`, lx, textY);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(' vs ', lx - 24, textY);
          ctx.fillStyle = PLAYER_A_COLOR;
          ctx.fillText(`${pctA}%`, lx - 42, textY);
        } else {
          ctx.fillStyle = PLAYER_A_COLOR;
          ctx.fillText(`${pctA}%`, lx, textY);
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(' vs ', lx + 24, textY);
          ctx.fillStyle = PLAYER_B_COLOR;
          ctx.fillText(`${pctB}%`, lx + 42, textY);
        }
      } else {
        ctx.font = '700 10px Inter, system-ui, sans-serif';
        ctx.fillStyle = PLAYER_A_COLOR;
        ctx.fillText(`${pctA} percentile`, lx, ly + 8);
      }
    }

    // Center Badge
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, 32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.font = '800 10px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText('EPL', cx, cy - 6);
    ctx.font = '600 8px Inter, system-ui, sans-serif';
    ctx.fillStyle = '#64748b';
    ctx.fillText(pos === 'F' ? 'FWD' : pos === 'M' ? 'MID' : pos === 'D' ? 'DEF' : 'GK', cx, cy + 6);
  }, [player, comparePlayer, allPlayers, selectedStats, width, height]);

  if (selectedStats.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Select at least one stat to show the pizza chart
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
      <canvas
        ref={canvasRef}
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          height: 'auto',
          aspectRatio: `${width}/${height}`,
        }}
      />
      {/* Clear Color Legend for Players */}
      <div style={{ display: 'flex', gap: '20px', marginTop: '12px', justifyContent: 'center', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
          <span style={{ width: 12, height: 12, borderRadius: '3px', background: PLAYER_A_COLOR, display: 'inline-block' }} />
          {player.player_name} ({player.team_code})
        </div>
        {comparePlayer && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
            <span style={{ width: 12, height: 12, borderRadius: '3px', background: PLAYER_B_COLOR, display: 'inline-block' }} />
            {comparePlayer.player_name} ({comparePlayer.team_code})
          </div>
        )}
      </div>
    </div>
  );
}
