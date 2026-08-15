import { useRef, useEffect } from 'react';
import type { SofaScorePlayer } from '../../types';
import { STAT_BY_KEY } from '../../data/statRegistry';

interface Props {
  player?: SofaScorePlayer;
  comparePlayer?: SofaScorePlayer | null;
  comparePlayers?: (SofaScorePlayer | null)[];
  players?: SofaScorePlayer[];
  allPlayers: SofaScorePlayer[];
  selectedStats: string[];
  width?: number;
  height?: number;
}

const PLAYER_PALETTE = [
  { fill: 'rgba(220,38,38,0.16)', stroke: '#DC2626', dot: '#EF4444', text: '#DC2626' },   // Player 1: Red
  { fill: 'rgba(37,99,235,0.16)', stroke: '#2563EB', dot: '#3B82F6', text: '#2563EB' },   // Player 2: Blue
  { fill: 'rgba(212,160,23,0.16)', stroke: '#D4A017', dot: '#F59E0B', text: '#B8860B' },  // Player 3: Gold
  { fill: 'rgba(16,185,129,0.16)', stroke: '#10B981', dot: '#34D399', text: '#059669' },  // Player 4: Emerald
];

export default function PizzaChart({
  player,
  comparePlayer,
  comparePlayers,
  players,
  allPlayers,
  selectedStats,
  width = 660,
  height = 660,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Collect all target players (up to 4)
  const targetPlayers: SofaScorePlayer[] = [];
  if (players && players.length > 0) {
    players.forEach(p => { if (p && !targetPlayers.some(tp => tp.player_id === p.player_id)) targetPlayers.push(p); });
  } else {
    if (player) targetPlayers.push(player);
    if (comparePlayer) targetPlayers.push(comparePlayer);
    if (comparePlayers && comparePlayers.length > 0) {
      comparePlayers.forEach(p => { if (p && !targetPlayers.some(tp => tp.player_id === p.player_id)) targetPlayers.push(p); });
    }
  }

  const activePlayers = targetPlayers.slice(0, 4);
  const primaryPlayer = activePlayers[0];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || selectedStats.length === 0 || !primaryPlayer) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    const pos = primaryPlayer?.position;
    let peers = allPlayers.filter(
      p => pos && p.position === pos && p.statistics && (p.statistics.minutesPlayed ?? 0) >= 180
    );

    if (peers.length === 0) {
      peers = allPlayers.filter(p => p.statistics && (p.statistics.minutesPlayed ?? 0) > 0);
    }

    const getPercentile = (p: SofaScorePlayer, key: string): number => {
      if (!p || !p.statistics) return 50;
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
      return isNaN(finalPct) || !isFinite(finalPct) ? 50 : Math.min(99, Math.max(1, finalPct));
    };

    const cx = width / 2;
    const cy = height / 2;
    // 150px margin on all sides ensures long labels are NEVER cut off
    const maxR = Math.min(cx, cy) - 150;
    const n = selectedStats.length;
    const angleStep = (Math.PI * 2) / n;

    try {
      ctx.clearRect(0, 0, width, height);

      // Background circular rings
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        if (isFinite(r) && r > 0) {
          ctx.beginPath();
          ctx.arc(cx, cy, r, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Radial axis lines
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + i * angleStep;
        const lx = cx + Math.cos(angle) * maxR;
        const ly = cy + Math.sin(angle) * maxR;
        if (isFinite(lx) && isFinite(ly)) {
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(lx, ly);
          ctx.stroke();
        }
      }

      // Ring numbers (25, 50, 75, 100)
      ctx.fillStyle = '#94a3b8';
      ctx.font = '600 9px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      for (let ring = 1; ring <= 4; ring++) {
        const r = (ring / 4) * maxR;
        if (isFinite(r)) {
          ctx.fillText(`${ring * 25}`, cx, cy - r - 3);
        }
      }

      // Render players (polygon radar + vertex dots only)
      for (let pIdx = activePlayers.length - 1; pIdx >= 0; pIdx--) {
        const p = activePlayers[pIdx];
        if (!p) continue;
        const palette = PLAYER_PALETTE[pIdx % PLAYER_PALETTE.length];

        const points: { x: number; y: number }[] = [];

        // Compute polygon vertices at each stat axis
        for (let i = 0; i < n; i++) {
          const key = selectedStats[i];
          const pct = getPercentile(p, key);
          const r = Math.max(6, Math.min(maxR, (pct / 100) * maxR));
          const angle = -Math.PI / 2 + i * angleStep;
          const px = cx + Math.cos(angle) * r;
          const py = cy + Math.sin(angle) * r;
          points.push({ x: px, y: py });
        }

        // Draw filled polygon area + boundary stroke
        if (points.length >= 3) {
          ctx.save();
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.closePath();

          // Semi-transparent polygon fill
          ctx.fillStyle = palette.fill;
          ctx.fill();

          // Bold boundary stroke
          ctx.strokeStyle = palette.stroke;
          ctx.lineWidth = 2.4;
          ctx.stroke();

          // Vertex dots at each stat point
          for (const pt of points) {
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
            ctx.fillStyle = palette.dot;
            ctx.fill();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1.5;
            ctx.stroke();
          }
          ctx.restore();
        }
      }

      // Outer labels & percentiles
      for (let i = 0; i < n; i++) {
        const key = selectedStats[i];
        const statDef = STAT_BY_KEY[key];
        const angle = -Math.PI / 2 + i * angleStep;

        const labelDist = maxR + 24;
        const lx = cx + Math.cos(angle) * labelDist;
        const ly = cy + Math.sin(angle) * labelDist;
        const cosA = Math.cos(angle);

        if (Math.abs(cosA) < 0.2) {
          ctx.textAlign = 'center';
        } else if (cosA > 0) {
          ctx.textAlign = 'left';
        } else {
          ctx.textAlign = 'right';
        }

        ctx.textBaseline = 'middle';

        // Format label text to prevent long text truncation
        let labelText = statDef?.label || key;
        if (labelText.length > 22) {
          labelText = labelText
            .replace('Percentage', '%')
            .replace('Expected Goals', 'xG')
            .replace('Expected Assists', 'xA')
            .replace('Inside The Box', 'Inside Box')
            .replace('Outside The Box', 'Outside Box');
        }

        if (isFinite(lx) && isFinite(ly)) {
          ctx.font = '700 11px Inter, system-ui, sans-serif';
          ctx.fillStyle = '#0f172a';
          ctx.fillText(labelText, lx, ly - 7);

          // Render percentiles for each active player
          const pcts = activePlayers.map(p => Math.round(getPercentile(p, key)));
          ctx.font = '800 10px Inter, system-ui, sans-serif';

          if (activePlayers.length === 1) {
            ctx.fillStyle = PLAYER_PALETTE[0].text;
            ctx.fillText(`${pcts[0]} percentile`, lx, ly + 8);
          } else {
            // Render color-coded percentiles for multiple players
            const valStr = pcts.map((p, idx) => `${p}%`).join(' · ');
            ctx.fillStyle = '#475569';
            ctx.fillText(valStr, lx, ly + 8);
          }
        }
      }

      // Center EPL Badge
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = '800 11px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#0f172a';
      ctx.fillText('EPL', cx, cy - 6);
      ctx.font = '600 8px Inter, system-ui, sans-serif';
      ctx.fillStyle = '#64748b';
      const posLabel = pos === 'F' ? 'FWD' : pos === 'M' ? 'MID' : pos === 'D' ? 'DEF' : pos === 'G' ? 'GK' : 'ALL';
      ctx.fillText(posLabel, cx, cy + 6);
    } catch (err) {
      console.error('Error rendering PizzaChart canvas:', err);
    }
  }, [activePlayers, allPlayers, selectedStats, width, height]);

  if (selectedStats.length === 0 || activePlayers.length === 0) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
        Select players and stats to view the percentile radar chart
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

      {/* Color Legend for all compared players */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
        {activePlayers.map((p, idx) => {
          const palette = PLAYER_PALETTE[idx % PLAYER_PALETTE.length];
          return (
            <div key={p.player_id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.84rem', fontWeight: 700, color: '#0f172a', background: 'white', padding: '6px 12px', borderRadius: '20px', border: `1px solid ${palette.stroke}` }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: palette.stroke, display: 'inline-block' }} />
              {p.player_name} ({p.team_code})
            </div>
          );
        })}
      </div>
    </div>
  );
}
