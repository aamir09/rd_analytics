import { useState } from 'react';
import { useData } from '../hooks/useData';
import type { FixturesData } from '../types';
import MatchCard from '../components/ui/MatchCard';
import { CheckCircle } from 'lucide-react';

export default function Results() {
  const { data, loading, error } = useData<FixturesData>('results.json');
  const [compFilter, setCompFilter] = useState<string>('all');

  const competitions = data
    ? Array.from(new Map(data.matches.map(m => [m.competition.code ?? m.competition.name, m.competition])).values())
    : [];

  const filtered = data?.matches.filter(m =>
    compFilter === 'all' || (m.competition.code ?? m.competition.name) === compFilter
  ) ?? [];

  const wins = filtered.filter(m => {
    const s = m.score?.fullTime;
    if (!s) return false;
    const isHome = m.homeTeam.id === 66;
    return isHome ? (s.home ?? 0) > (s.away ?? 0) : (s.away ?? 0) > (s.home ?? 0);
  }).length;
  const draws = filtered.filter(m => m.score?.winner === 'DRAW').length;
  const losses = filtered.length - wins - draws;

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="accent-bar" />
              <h1 className="text-heading">Results</h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                {filtered.length} matches played
              </p>
            </div>
            {competitions.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button id="results-filter-all" className={`btn btn-ghost ${compFilter === 'all' ? 'active' : ''}`} onClick={() => setCompFilter('all')} style={{ fontSize: '0.8rem', padding: '7px 14px' }}>All</button>
                {competitions.map(c => (
                  <button key={c.code ?? c.name} id={`results-filter-${c.code}`} className={`btn btn-ghost ${compFilter === (c.code ?? c.name) ? 'active' : ''}`} onClick={() => setCompFilter(c.code ?? c.name ?? 'all')} style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {c.emblem && <img src={c.emblem} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />}
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* W/D/L summary */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
            {[
              { label: 'Wins', value: wins, color: 'var(--color-win)', bg: '#f0fdf4' },
              { label: 'Draws', value: draws, color: 'var(--color-draw)', bg: '#fefce8' },
              { label: 'Losses', value: losses, color: 'var(--color-loss)', bg: '#fff1f2' },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '16px 24px', flex: 1, minWidth: 100, borderTop: `3px solid ${s.color}` }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600, marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 6 }).map((_, i) => <div key={i} className="card skeleton" style={{ height: '100px' }} />)}
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ color: 'var(--color-loss)', fontWeight: 600 }}>Could not load results</div>
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
            <CheckCircle size={48} style={{ color: 'var(--color-text-light)', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>No results yet</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Results will appear after matches are played</div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(m => <MatchCard key={m.id} match={m} type="result" />)}
          </div>
        )}
      </div>
    </div>
  );
}
