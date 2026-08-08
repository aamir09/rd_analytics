import { useState } from 'react';
import { useData } from '../hooks/useData';
import type { FixturesData } from '../types';
import MatchCard from '../components/ui/MatchCard';
import { Calendar, Award, Trophy } from 'lucide-react';

export default function Fixtures() {
  const { data, loading, error } = useData<FixturesData>('fixtures.json');
  const [compFilter, setCompFilter] = useState<string>('all');

  const filtered = data?.matches.filter(m =>
    compFilter === 'all' || (m.competition.code ?? m.competition.name) === compFilter
  ) ?? [];

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div className="accent-bar" />
              <h1 className="text-heading">Upcoming Fixtures</h1>
              <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
                2026/27 Season · {filtered.length} upcoming matches
              </p>
            </div>

            {/* Competition filter buttons */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                id="filter-all"
                className={`btn btn-ghost ${compFilter === 'all' ? 'active' : ''}`}
                onClick={() => setCompFilter('all')}
                style={{ fontSize: '0.8rem', padding: '7px 14px' }}
              >
                All
              </button>

              <button
                id="filter-PL"
                className={`btn btn-ghost ${compFilter === 'PL' ? 'active' : ''}`}
                onClick={() => setCompFilter('PL')}
                style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Trophy size={14} /> Premier League
              </button>

              <button
                id="filter-CL"
                className={`btn btn-ghost ${compFilter === 'CL' ? 'active' : ''}`}
                onClick={() => setCompFilter('CL')}
                style={{ fontSize: '0.8rem', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Award size={14} /> Champions League
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card skeleton" style={{ height: '100px' }} />
            ))}
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <Calendar size={40} style={{ color: 'var(--color-text-light)', margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, color: 'var(--color-text-muted)' }}>Could not load fixtures</div>
          </div>
        )}

        {/* Champions League empty state / provisional notice */}
        {!loading && !error && compFilter === 'CL' && filtered.length === 0 && (
          <div className="card fade-in" style={{ padding: '48px 32px', textAlign: 'center', background: 'linear-gradient(135deg, rgba(26,54,93,0.04), rgba(26,54,93,0.01))', border: '1px solid rgba(26,54,93,0.18)' }}>
            <Award size={56} style={{ color: '#1E3A8A', margin: '0 auto 16px' }} />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px', color: 'var(--color-text)' }}>
              UEFA Champions League 2026/27
            </h2>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.92rem', maxWidth: '520px', margin: '0 auto 20px', lineHeight: 1.6 }}>
              Manchester United return to the <strong>UEFA Champions League</strong>! The 36-team League Phase draw takes place in late August 2026. Matchday fixtures will update automatically once scheduled.
            </p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg)', padding: '8px 16px', borderRadius: '99px', border: '1px solid var(--color-border)', fontSize: '0.78rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#16a34a' }} /> Auto-sync enabled via GitHub Actions
            </div>
          </div>
        )}

        {/* General empty state */}
        {!loading && !error && compFilter !== 'CL' && filtered.length === 0 && (
          <div className="card" style={{ padding: '64px', textAlign: 'center' }}>
            <Calendar size={48} style={{ color: 'var(--color-text-light)', margin: '0 auto 16px' }} />
            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '8px' }}>No fixtures found</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Check back soon for upcoming matches</div>
          </div>
        )}

        {filtered.length > 0 && (
          <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(m => <MatchCard key={m.id} match={m} type="fixture" />)}
          </div>
        )}
      </div>
    </div>
  );
}
