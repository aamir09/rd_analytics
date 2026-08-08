import { Link } from 'react-router-dom';
import type { FotMobPlayer } from '../../types';
import type { PositionCategory } from '../../utils/positionMapper';
import { POSITION_STYLES } from '../../utils/positionMapper';

interface Props {
  player: FotMobPlayer;
  index: number;
  positionCategory?: PositionCategory;
  rawPosition?: string;
  shirtNumber?: number | null;
}

export default function FotMobPlayerCard({
  player,
  index,
  positionCategory = 'Midfielder',
  rawPosition,
  shirtNumber,
}: Props) {
  const { stats } = player;
  const goals    = stats.goals?.primary ?? 0;
  const assists  = stats.assists?.primary ?? 0;
  const rating   = stats.rating?.primary;
  const minutes  = stats.minutesPlayed?.primary ?? 0;
  const xG       = stats.xG?.primary;

  const slug = encodeURIComponent(player.name);
  const initials = player.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const posStyle = POSITION_STYLES[positionCategory] ?? POSITION_STYLES['Midfielder'];

  const ratingColor = rating
    ? rating >= 7.5 ? '#16a34a' : rating >= 7.0 ? '#ca8a04' : rating >= 6.5 ? '#6b7280' : '#dc2626'
    : '#6b7280';

  return (
    <Link to={`/players/${slug}`} style={{ textDecoration: 'none' }}>
      <div
        className="card fade-in"
        style={{ overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s', animationDelay: `${index * 0.04}s` }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; (e.currentTarget as HTMLDivElement).style.boxShadow = '0 12px 32px rgba(139,0,0,0.14)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = ''; (e.currentTarget as HTMLDivElement).style.boxShadow = ''; }}
      >
        {/* Card header */}
        <div style={{ background: 'linear-gradient(135deg, #8B0000, #5a0000)', padding: '20px 16px 28px', textAlign: 'center', position: 'relative' }}>
          {/* Shirt number badge (top left) */}
          {shirtNumber != null && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: 'rgba(255,199,44,0.2)', border: '1px solid rgba(255,199,44,0.4)', color: '#FFC72C', borderRadius: '6px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 900 }}>
              #{shirtNumber}
            </div>
          )}

          {/* Rating badge (top right) */}
          {rating ? (
            <div style={{ position: 'absolute', top: '10px', right: '10px', background: ratingColor, color: 'white', borderRadius: '6px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800 }}>
              ★ {rating.toFixed(2)}
            </div>
          ) : null}

          {/* Photo or initials */}
          {player.photo
            ? <img src={player.photo} alt={player.name} style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid rgba(255,255,255,0.25)', background: '#eee', display: 'block', margin: '0 auto 10px' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
            : <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '3px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', fontSize: '1.4rem', fontWeight: 900, color: 'rgba(255,255,255,0.9)', letterSpacing: '-1px' }}>{initials}</div>
          }
          <div style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem', lineHeight: 1.2 }}>{player.name}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '6px', padding: '2px 10px', borderRadius: '99px', background: posStyle.bg, color: posStyle.color, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.06em' }}>
            <span>{posStyle.label}</span>
            {rawPosition && <span style={{ opacity: 0.8, fontWeight: 600 }}>({rawPosition.split(',')[0].trim()})</span>}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', borderTop: '1px solid var(--color-border)' }}>
          {[
            { label: stats.goals?.primaryLabel ?? 'Goals', value: goals },
            { label: stats.assists?.primaryLabel ?? 'Assists', value: assists },
            { label: xG != null ? 'xG' : 'Minutes', value: xG != null ? xG : minutes > 1000 ? `${Math.round(minutes / 90)}` : minutes },
          ].map((s, i) => (
            <div key={i} style={{ padding: '12px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1 }}>{s.value ?? '—'}</div>
              <div style={{ fontSize: '0.62rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Link>
  );
}
