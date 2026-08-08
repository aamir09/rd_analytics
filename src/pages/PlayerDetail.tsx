import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { usePlayerPhotos } from '../hooks/usePlayerPhotos';
import type { FotMobData, FotMobPlayer, FotMobStatEntry, PlayerStatsData, SquadDetailPlayer } from '../types';
import { parsePositionCategory, POSITION_STYLES } from '../utils/positionMapper';
import { ArrowLeft, User } from 'lucide-react';

function StatBar({ entry, accent }: { entry: FotMobStatEntry; accent?: boolean }) {
  const v = entry.primary ?? 0;
  const MAX_LOOKUP: Record<string, number> = {
    Goals: 30, Assists: 25, 'Goal + Assists': 50, Rating: 10,
    'Minutes Played': 3800, 'Per 90': 2, 'Expected Goals': 25,
    xG: 2, xGOT: 2, 'Shots on target per 90': 5, 'Shots per 90': 8,
    'Accurate Passes Per 90': 80, 'Big Chances Created': 15, 'Chances Created ': 100,
    'Accurate long balls per 90': 12, 'Expected Assists (xA)': 20, 'xA per 90': 1,
    'xA + xG per 90': 2, 'Succesful dribbles per 90': 5, 'Big Chances Missed': 15,
    'Penalties Awarded': 5, 'Defensive Contributions Per 90': 15, 'Tackles per 90': 10,
    'Interceptions per 90': 6, 'Clearances Per 90': 12, 'Blocks Per 90': 4,
    'Recoveries Per 90': 15, 'Penalties Conceded': 5, 'Possesion Won in Final 3rd Per 90': 5,
    'Clean Sheets': 40, 'Save Percentage': 100, 'Saves Per 90': 6,
    'Goals Prevented': 20, 'Goals Conceded Per 90': 3, 'Fouls Committed Per 90': 5,
    'Yellow Cards': 15, 'Red Cards': 3,
  };
  const max = MAX_LOOKUP[entry.primaryLabel] ?? 100;
  const pct = max > 0 ? Math.min(100, (v / max) * 100) : 0;

  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{entry.primaryLabel}</span>
          {entry.secondaryLabel && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)', marginLeft: '6px' }}>· {entry.secondaryLabel}: {entry.secondary ?? '—'}</span>
          )}
        </div>
        <span style={{ fontSize: '0.9rem', fontWeight: 700, color: accent ? 'var(--color-primary)' : 'var(--color-text)' }}>{v}</span>
      </div>
      <div className="stat-bar-track">
        <div className={`stat-bar-fill ${accent ? 'accent' : ''}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function PlayerDetail() {
  const { name: rawSlug } = useParams<{ name: string }>();
  const playerName = decodeURIComponent(rawSlug ?? '');

  const { data: fotmob, loading } = useData<FotMobData>('player_stats_fotmob.json');
  const { data: apiData } = useData<PlayerStatsData>('player_stats.json');
  const { data: squadDetails } = useData<SquadDetailPlayer[]>('squad_details.json');

  // Build photo map with name-mismatch resolution
  const photoMap = usePlayerPhotos(apiData ?? null);

  const player: FotMobPlayer | undefined = fotmob?.players.find(p =>
    p.name.toLowerCase() === playerName.toLowerCase()
  );

  const squadInfo: SquadDetailPlayer | undefined = (squadDetails ?? []).find(s =>
    s.Player.toLowerCase() === playerName.toLowerCase()
  );

  if (loading) return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: '32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '32px' }}>
          <div className="card skeleton" style={{ height: '400px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px' }} />)}
          </div>
        </div>
      </div>
    </div>
  );

  if (!player) return (
    <div className="page-wrapper">
      <div className="container" style={{ paddingTop: '64px', textAlign: 'center' }}>
        <User size={64} style={{ color: 'var(--color-text-light)', margin: '0 auto 16px' }} />
        <h2>Player not found</h2>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '16px' }}>"{playerName}"</p>
        <Link to="/players" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>← Back to Players</Link>
      </div>
    </div>
  );

  const { stats } = player;
  const photo = squadInfo?.Image ?? player.photo ?? photoMap[player.name.toLowerCase().trim()];
  const initials = player.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase();
  const rating = stats.rating?.primary;
  const ratingColor = rating ? (rating >= 7.5 ? '#16a34a' : rating >= 7.0 ? '#ca8a04' : '#6b7280') : '#6b7280';
  const minutes = stats.minutesPlayed?.primary ?? 0;
  const goals   = stats.goals?.primary ?? 0;
  const assists = stats.assists?.primary ?? 0;

  const posCategory = parsePositionCategory(squadInfo?.Position);
  const posStyle = POSITION_STYLES[posCategory];

  // Group stats for display
  const attackingStats  = ['goals','assists','goalsAndAssists','goalsPer90','xG','xGPer90','xGOT','shotsOnTargetPer90','shotsPer90','bigChancesCreated','bigChancesMissed','chancesCreated','xA','xAPer90','xGAndXAPer90'] as const;
  const creativeStats   = ['accuratePassesPer90','accurateLongBallsPer90','successfulDribblesPer90','penaltiesAwarded'] as const;
  const defensiveStats  = ['defensiveContributionsPer90','tacklesPer90','interceptionsPer90','clearancesPer90','blocksPer90','recoveriesPer90','possWonFinal3rdPer90','penaltiesConceded'] as const;
  const disciplineStats = ['foulsCommittedPer90','yellowCards','redCards'] as const;
  const gkStats         = ['cleanSheets','savePercentage','savesPer90','goalsPrevented','goalsConcededPer90'] as const;

  function renderGroup(keys: readonly string[], label: string, accent?: boolean) {
    const entries = keys.map(k => stats[k]).filter((e): e is FotMobStatEntry => !!e && e.primary != null);
    if (!entries.length) return null;
    return (
      <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '20px', color: 'var(--color-text)', borderBottom: '2px solid var(--color-border)', paddingBottom: '10px' }}>{label}</h2>
        {entries.map((e, i) => <StatBar key={i} entry={e} accent={accent && i < 2} />)}
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        <div style={{ paddingTop: '32px', marginBottom: '24px' }}>
          <Link to="/players" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Back to Players
          </Link>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '32px', alignItems: 'start' }} className="player-detail-grid">
          {/* Profile card */}
          <div className="card" style={{ overflow: 'hidden', position: 'sticky', top: '90px' }}>
            <div style={{ background: 'linear-gradient(135deg, #8B0000, #5a0000)', padding: '40px 24px 32px', textAlign: 'center', position: 'relative' }}>
              {rating && (
                <div style={{ position: 'absolute', top: '14px', right: '14px', background: ratingColor, color: 'white', borderRadius: '8px', padding: '4px 10px', fontSize: '0.8rem', fontWeight: 800 }}>
                  ★ {rating.toFixed(2)}
                </div>
              )}
              {photo
                ? <img src={photo} alt={player.name} style={{ width: 100, height: 100, borderRadius: '50%', objectFit: 'cover', border: '4px solid rgba(255,255,255,0.25)', background: '#eee', margin: '0 auto 16px', display: 'block' }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', border: '4px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '2.2rem', fontWeight: 900, color: 'rgba(255,255,255,0.85)' }}>{initials}</div>
              }
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'white', margin: '0' }}>{player.name}</h1>
              
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '10px', padding: '4px 12px', borderRadius: '99px', background: posStyle.bg, color: posStyle.color, fontSize: '0.7rem', fontWeight: 800 }}>
                <span>{posStyle.label}</span>
                {squadInfo?.Position && <span style={{ opacity: 0.85, fontWeight: 600 }}>({squadInfo.Position})</span>}
              </div>
            </div>

            {/* Quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', borderBottom: '1px solid var(--color-border)' }}>
              {[
                { label: stats.goals?.primaryLabel ?? 'Goals', value: goals },
                { label: stats.assists?.primaryLabel ?? 'Assists', value: assists },
                { label: 'Minutes', value: minutes },
              ].map((s, i) => (
                <div key={i} style={{ padding: '16px 8px', textAlign: 'center', borderRight: i < 2 ? '1px solid var(--color-border)' : 'none' }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--color-primary)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Player Details</div>
              {[
                { label: 'Shirt Number', value: squadInfo?.Shirt ? `#${squadInfo.Shirt}` : null },
                { label: 'Age', value: squadInfo?.Age ? `${squadInfo.Age} yrs` : null },
                { label: 'Country', value: squadInfo?.Country },
                { label: 'Market Value', value: squadInfo?.['Transfer value'] },
                { label: 'xG', value: stats.xG?.primary },
                { label: 'xA', value: stats.xA?.primary },
                { label: 'FotMob Rating', value: rating ? rating.toFixed(2) : null },
              ].filter(s => s.value != null).map(s => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--color-text-muted)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right side stat groups */}
          <div>
            {renderGroup([...attackingStats],  '⚽ Attacking', true)}
            {renderGroup([...creativeStats],   '🎯 Creative & Dribbling')}
            {renderGroup([...defensiveStats],  '🛡️ Defensive')}
            {renderGroup([...disciplineStats], '🟨 Discipline')}
            {renderGroup([...gkStats],         '🧤 Goalkeeper')}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.player-detail-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
