import { Link } from 'react-router-dom';
import type { Player } from '../../types';
import { getPrimaryStat, positionLabel } from '../../utils/formatters';

interface PlayerCardProps {
  player: Player;
}

const POSITION_COLORS: Record<string, { bg: string; color: string }> = {
  Goalkeeper: { bg: '#fef3c7', color: '#92400e' },
  Defender:   { bg: '#dbeafe', color: '#1e40af' },
  Midfielder: { bg: '#d1fae5', color: '#065f46' },
  Attacker:   { bg: '#fee2e2', color: '#991b1b' },
};

export default function PlayerCard({ player }: PlayerCardProps) {
  const stat = getPrimaryStat(player.statistics);
  const pos = player.position ?? stat?.games?.position ?? 'Unknown';
  const posStyle = POSITION_COLORS[pos] ?? { bg: '#f3f4f6', color: '#374151' };
  const goals = stat?.goals?.total ?? 0;
  const assists = stat?.goals?.assists ?? stat?.assists ?? 0;
  const apps = stat?.games?.appearences ?? 0;

  return (
    <Link
      to={`/players/${player.id}`}
      style={{ textDecoration: 'none', display: 'block' }}
    >
      <div className="card" style={{ padding: '0', overflow: 'hidden', cursor: 'pointer' }}>
        {/* Photo area */}
        <div style={{
          background: 'linear-gradient(135deg, #f8f8f6 0%, #f0f0ee 100%)',
          padding: '24px 24px 0',
          display: 'flex',
          alignItems: 'flex-end',
          gap: '16px',
          position: 'relative',
          minHeight: '100px',
        }}>
          {/* Shirt number */}
          {player.number && (
            <div style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              fontSize: '2rem',
              fontWeight: 900,
              color: 'rgba(0,0,0,0.08)',
              lineHeight: 1,
            }}>
              {player.number}
            </div>
          )}

          {/* Photo */}
          {player.photo ? (
            <img
              src={player.photo}
              alt={player.name}
              style={{
                width: 72, height: 72,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid white',
                boxShadow: 'var(--shadow-sm)',
                background: '#e5e5e5',
              }}
              onError={e => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div style={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'var(--color-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
              fontWeight: 800,
              fontSize: '1.5rem',
              border: '3px solid white',
              flexShrink: 0,
            }}>
              {player.name.charAt(0)}
            </div>
          )}

          {/* Position badge */}
          <div style={{
            padding: '3px 10px',
            borderRadius: '99px',
            fontSize: '0.7rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            background: posStyle.bg,
            color: posStyle.color,
            marginBottom: '12px',
          }}>
            {positionLabel(pos)}
          </div>
        </div>

        {/* Info area */}
        <div style={{ padding: '16px 20px 20px' }}>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '2px', color: 'var(--color-text)' }}>
            {player.name}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '16px' }}>
            {player.nationality ?? '—'}
          </div>

          {/* Mini stats */}
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid var(--color-border)', paddingTop: '12px' }}>
            {[
              { label: 'Apps', value: apps },
              { label: 'Goals', value: goals },
              { label: 'Assists', value: assists },
            ].map((s, i) => (
              <div key={s.label} style={{
                flex: 1,
                textAlign: 'center',
                borderRight: i < 2 ? '1px solid var(--color-border)' : 'none',
                padding: '0 8px',
              }}>
                <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--color-primary)' }}>{s.value}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
