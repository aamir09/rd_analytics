import { useData } from '../hooks/useData';
import type { FixturesData, FotMobData } from '../types';
import { getManUtdResult, getManUtdScore } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function TeamStats() {
  const { data: results } = useData<FixturesData>('results.json');
  const { data: fotmob }  = useData<FotMobData>('player_stats_fotmob.json');

  const matches    = results?.matches ?? [];
  const wins       = matches.filter(m => getManUtdResult(m) === 'W').length;
  const draws      = matches.filter(m => getManUtdResult(m) === 'D').length;
  const losses     = matches.filter(m => getManUtdResult(m) === 'L').length;
  const played     = matches.length;
  const goalsFor   = matches.reduce((a, m) => a + (getManUtdScore(m)?.scored ?? 0), 0);
  const goalsAgainst = matches.reduce((a, m) => a + (getManUtdScore(m)?.conceded ?? 0), 0);
  const cleanSheets  = matches.filter(m => (getManUtdScore(m)?.conceded ?? 1) === 0).length;

  const players = fotmob?.players ?? [];

  const topScorers = players
    .map(p => ({
      name:   p.name.split(' ').at(-1) ?? p.name,
      goals:  p.stats.goals?.primary ?? 0,
      xG:     p.stats.xG?.primary ?? 0,
    }))
    .filter(p => p.goals > 0)
    .sort((a, b) => b.goals - a.goals)
    .slice(0, 8);

  const topAssisters = players
    .map(p => ({
      name:    p.name.split(' ').at(-1) ?? p.name,
      assists: p.stats.assists?.primary ?? 0,
      xA:      p.stats.xA?.primary ?? 0,
    }))
    .filter(p => p.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 8);

  const topRated = players
    .map(p => ({
      name:   p.name.split(' ').at(-1) ?? p.name,
      rating: p.stats.rating?.primary ?? 0,
    }))
    .filter(p => p.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);

  const CHART_COLOR   = '#8B0000';
  const CHART_ACCENT  = '#FFC72C';
  const CHART_NEUTRAL = '#E5E7EB';

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div className="accent-bar" />
          <h1 className="text-heading">Team Statistics</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            {fotmob?.season ?? '2025/26'} season · {played} matches played
          </p>
        </div>

        {/* Match record */}
        <div className="grid-4 fade-in" style={{ marginBottom: '40px' }}>
          {[
            { label: 'Wins',         value: wins,   sub: played ? `${Math.round(wins/played*100)}% win rate` : '', color: 'var(--color-win)' },
            { label: 'Draws',        value: draws,  sub: '',                                                       color: 'var(--color-draw)' },
            { label: 'Losses',       value: losses, sub: '',                                                       color: 'var(--color-loss)' },
            { label: 'Clean Sheets', value: cleanSheets, sub: played ? `${Math.round(cleanSheets/played*100)}% of games` : '', color: 'var(--color-primary)' },
          ].map(s => (
            <div key={s.label} className="card" style={{ padding: '24px', borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: s.color, lineHeight: 1, marginBottom: '4px' }}>{s.value}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
              {s.sub && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }} className="team-grid">
          {/* Goals summary */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px' }}>Goals Summary</h2>
            {[
              { label: 'Goals Scored',     value: goalsFor,                color: 'var(--color-primary)', max: Math.max(goalsFor, 1) },
              { label: 'Goals Conceded',   value: goalsAgainst,            color: 'var(--color-loss)',    max: Math.max(goalsFor, 1) },
              { label: 'Goal Difference',  value: goalsFor - goalsAgainst, color: goalsFor >= goalsAgainst ? 'var(--color-win)' : 'var(--color-loss)', max: null },
              { label: 'Avg Goals / Game', value: played ? (goalsFor / played).toFixed(1) : '—', color: 'var(--color-primary)', max: null },
            ].map(s => (
              <div key={s.label} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{s.label}</span>
                  <span style={{ fontWeight: 700, color: s.color }}>{s.value}</span>
                </div>
                {s.max && <div className="stat-bar-track"><div style={{ height: '100%', width: `${Math.min(100, (Number(s.value)/s.max)*100)}%`, background: s.color, borderRadius: '3px', transition: 'width 0.6s' }} /></div>}
              </div>
            ))}
          </div>

          {/* Results breakdown */}
          <div className="card" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '24px' }}>Results Breakdown</h2>
            {played === 0 ? (
              <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '32px' }}>No matches played yet</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Wins',   value: wins,   color: '#16a34a' },
                  { label: 'Draws',  value: draws,  color: '#ca8a04' },
                  { label: 'Losses', value: losses, color: '#dc2626' },
                ].map(r => (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{r.label}</span>
                      <span style={{ fontWeight: 700, color: r.color }}>{r.value} <span style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>({Math.round(r.value/played*100)}%)</span></span>
                    </div>
                    <div className="stat-bar-track"><div style={{ height: '100%', width: `${(r.value/played)*100}%`, background: r.color, borderRadius: '3px', transition: 'width 0.6s' }} /></div>
                  </div>
                ))}
                <div style={{ display: 'flex', height: '12px', borderRadius: '6px', overflow: 'hidden', marginTop: '8px' }}>
                  {[{v:wins,c:'#16a34a'},{v:draws,c:'#ca8a04'},{v:losses,c:'#dc2626'}].map((s,i) => (
                    <div key={i} style={{ flex: s.v, background: s.c, minWidth: s.v > 0 ? '4px' : 0 }} />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Top scorers */}
        {topScorers.length > 0 && (
          <div className="card fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Top Scorers</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>2025/26 · Source: FotMob</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topScorers} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v, name) => [v, name === 'goals' ? 'Goals' : 'xG']} contentStyle={{ borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
                <Bar dataKey="goals" name="goals" radius={[6,6,0,0]}>
                  {topScorers.map((_, i) => <Cell key={i} fill={i === 0 ? CHART_COLOR : CHART_NEUTRAL} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Top assisters */}
        {topAssisters.length > 0 && (
          <div className="card fade-in" style={{ padding: '28px', marginBottom: '24px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>Top Assisters</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>2025/26 · Source: FotMob</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topAssisters} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip formatter={(v) => [v, 'Assists']} contentStyle={{ borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
                <Bar dataKey="assists" radius={[6,6,0,0]}>
                  {topAssisters.map((_, i) => <Cell key={i} fill={i === 0 ? CHART_ACCENT : CHART_NEUTRAL} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* FotMob ratings */}
        {topRated.length > 0 && (
          <div className="card fade-in" style={{ padding: '28px' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px' }}>FotMob Ratings</h2>
            <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginBottom: '20px' }}>Average rating across all appearances</p>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={topRated} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <YAxis domain={[6, 9]} tick={{ fontSize: 11, fill: '#6B7280' }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v) => [Number(v).toFixed(2), 'Rating']} contentStyle={{ borderRadius: '10px', border: '1px solid var(--color-border)', fontSize: '0.8rem' }} />
                <Bar dataKey="rating" radius={[6,6,0,0]}>
                  {topRated.map((_, i) => <Cell key={i} fill={i === 0 ? '#4f46e5' : CHART_NEUTRAL} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <style>{`@media(max-width:768px){.team-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  );
}
