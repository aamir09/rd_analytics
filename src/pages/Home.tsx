import { Link } from 'react-router-dom';
import { useData } from '../hooks/useData';
import { usePlayerPhotos } from '../hooks/usePlayerPhotos';
import type { StandingsData, FixturesData, PlayerStatsData, FotMobData, SquadDetailPlayer } from '../types';
import { getManUtdResult, formatMatchDate, formatMatchTime, MAN_UTD_ID_FD, timeUntil } from '../utils/formatters';
import StatCard from '../components/ui/StatCard';
import MatchCard from '../components/ui/MatchCard';
import { Trophy, Target, Users, TrendingUp, ArrowRight, Clock } from 'lucide-react';

export default function Home() {
  const { data: standings } = useData<StandingsData>('standings.json');
  const { data: results } = useData<FixturesData>('results.json');
  const { data: fixtures } = useData<FixturesData>('fixtures.json');
  const { data: fotmob } = useData<FotMobData>('player_stats_fotmob.json');
  const { data: apiData } = useData<PlayerStatsData>('player_stats.json');
  const { data: squadDetails } = useData<SquadDetailPlayer[]>('squad_details.json');

  const photoMap = usePlayerPhotos(apiData ?? null);

  const squadCount = squadDetails?.filter(s => s.Player && s.Position !== 'Coach').length ?? 33;
  const utd = standings?.table.find(t => t.team.id === MAN_UTD_ID_FD);
  const recentResults = results?.matches.slice(0, 5) ?? [];
  const nextMatch = fixtures?.matches[0];
  const form = recentResults.map(m => getManUtdResult(m)).filter(Boolean);

  // Top Scorers from FotMob 2025/26 dataset
  const topScorers = (fotmob?.players ?? [])
    .map(p => ({
      name: p.name,
      goals: p.stats.goals?.primary ?? 0,
      assists: p.stats.assists?.primary ?? 0,
      photo: p.photo ?? photoMap[p.name.trim().toLowerCase()],
      slug: encodeURIComponent(p.name),
    }))
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 5);

  const FORM_COLORS: Record<string, string> = { W: '#16a34a', D: '#ca8a04', L: '#dc2626' };
  const ordinal = (n: number) => `${n}${['st','nd','rd'][n-1] ?? 'th'}`;

  return (
    <div className="page-wrapper">
      <div style={{ background: 'linear-gradient(135deg, #8B0000 0%, #5a0000 100%)', color: 'white', padding: '64px 0 100px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-100px', right: '-100px', width: '500px', height: '500px', borderRadius: '50%', background: 'rgba(255,255,255,0.03)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-150px', left: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'rgba(255,199,44,0.05)', pointerEvents: 'none' }} />
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '40px', alignItems: 'center' }} className="hero-grid">
            <div style={{ maxWidth: '560px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,199,44,0.15)', border: '1px solid rgba(255,199,44,0.3)', borderRadius: '99px', padding: '6px 14px', marginBottom: '24px' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFC72C' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#FFC72C', letterSpacing: '0.06em' }}>LIVE 2025/26 SEASON DATA</span>
              </div>
              <h1 style={{ fontSize: 'clamp(2.2rem,5vw,3.5rem)', fontWeight: 900, letterSpacing: '-0.03em', lineHeight: 1.05, color: 'white', margin: '0 0 16px' }}>
                Red Devils<br /><span style={{ color: '#FFC72C' }}>Analytics</span>
              </h1>
              <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.68)', marginBottom: '32px', lineHeight: 1.7 }}>
                Deep statistics, player insights, and match analysis for Manchester United.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/players" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: '#FFC72C', color: '#1A1A1A', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}>
                  View Players <ArrowRight size={16} />
                </Link>
                <Link to="/table" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 22px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.18)', textDecoration: 'none' }}>
                  League Table
                </Link>
              </div>
            </div>
            {nextMatch && (
              <div style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.13)', borderRadius: '20px', padding: '24px 28px', minWidth: '260px' }} className="hero-card">
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '16px' }}>⚽ Next Match</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
                  {nextMatch.homeTeam.crest && <img src={nextMatch.homeTeam.crest} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />}
                  <div style={{ fontWeight: 800, color: 'rgba(255,255,255,0.3)' }}>VS</div>
                  {nextMatch.awayTeam.crest && <img src={nextMatch.awayTeam.crest} alt="" style={{ width: 48, height: 48, objectFit: 'contain' }} />}
                </div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'white', marginBottom: '4px', textAlign: 'center' }}>
                  {(nextMatch.homeTeam.shortName ?? nextMatch.homeTeam.name)} vs {(nextMatch.awayTeam.shortName ?? nextMatch.awayTeam.name)}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: '8px' }}>
                  {formatMatchDate(nextMatch.utcDate)} · {formatMatchTime(nextMatch.utcDate)}
                </div>
                <div style={{ textAlign: 'center', fontSize: '0.82rem', fontWeight: 700, color: '#FFC72C', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                  <Clock size={13} /> {timeUntil(nextMatch.utcDate)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-32px', position: 'relative', zIndex: 10 }}>
        <div className="grid-4 fade-in" style={{ marginBottom: '48px' }}>
          <StatCard label="League Position" value={utd ? ordinal(utd.position) : '—'} subtitle={utd ? `${utd.points} points` : 'Loading...'} accent icon={<Trophy size={20} />} />
          <StatCard label="Record" value={utd ? `${utd.won}W ${utd.draw}D ${utd.lost}L` : '—'} subtitle={utd ? `${utd.playedGames} played` : ''} icon={<TrendingUp size={20} />} />
          <StatCard label="Goals For" value={utd?.goalsFor ?? '—'} subtitle={utd ? `${utd.goalsAgainst} against · GD ${utd.goalDifference > 0 ? '+' : ''}${utd.goalDifference}` : ''} icon={<Target size={20} />} />
          <StatCard label="Squad Players" value={squadCount} subtitle="2025/26 Season" icon={<Users size={20} />} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '32px', alignItems: 'start' }} className="home-grid">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
              <div><div className="accent-bar" /><h2 className="text-subheading" style={{ margin: 0 }}>Recent Results</h2></div>
              <Link to="/results" style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)', textDecoration: 'none' }}>All results <ArrowRight size={14} /></Link>
            </div>
            {form.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginRight: '4px' }}>Form:</span>
                {form.map((f, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: `${FORM_COLORS[f!]}18`, color: FORM_COLORS[f!], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 800, border: `1.5px solid ${FORM_COLORS[f!]}40` }}>{f}</div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentResults.length === 0
                ? <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--color-text-muted)' }}>No results yet</div>
                : recentResults.map(m => <MatchCard key={m.id} match={m} type="result" />)}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {topScorers.length > 0 && (
              <div className="card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <div className="accent-bar" />
                    <h3 className="text-subheading" style={{ margin: 0 }}>Top Scorers</h3>
                    <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>2025/26 Season</div>
                  </div>
                  <Link to="/players" style={{ fontSize: '0.8rem', color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'none' }}>View all</Link>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {topScorers.map((p, i) => (
                    <Link key={p.name} to={`/players/${p.slug}`} style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                      <div style={{ width: 22, color: 'var(--color-text-light)', fontSize: '0.82rem', fontWeight: 700 }}>{i + 1}</div>
                      {p.photo
                        ? <img src={p.photo} alt={p.name} style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', background: '#eee', flexShrink: 0 }} onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                        : <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0 }}>{p.name[0]}</div>}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{p.assists} assist{p.assists !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ fontWeight: 900, fontSize: '1.1rem', color: 'var(--color-primary)', flexShrink: 0 }}>{p.goals}</div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {utd && (
              <div className="card" style={{ padding: '24px', background: 'var(--color-primary)', color: 'white', overflow: 'hidden', position: 'relative' }}>
                <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '140px', height: '140px', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
                <div style={{ fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Premier League</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: '#FFC72C' }}>{utd.position}</div>
                  <div style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{ordinal(utd.position)}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '6px', marginBottom: '16px' }}>
                  {[['PTS', utd.points], ['W', utd.won], ['D', utd.draw], ['L', utd.lost]].map(([l, v]) => (
                    <div key={String(l)} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.09)', borderRadius: '8px', padding: '8px 4px' }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white' }}>{v}</div>
                      <div style={{ fontSize: '0.64rem', color: 'rgba(255,255,255,0.45)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{l}</div>
                    </div>
                  ))}
                </div>
                <Link to="/table" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 700, color: '#FFC72C', textDecoration: 'none' }}>
                  Full table <ArrowRight size={13} />
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@media(max-width:1024px){.hero-grid,.home-grid{grid-template-columns:1fr!important}.hero-card{display:none!important}}`}</style>
    </div>
  );
}
