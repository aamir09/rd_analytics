import { Link } from 'react-router-dom';
import { TrendingUp, ExternalLink } from 'lucide-react';
import { useData } from '../../hooks/useData';
import type { LastUpdatedData } from '../../types';
import { formatFullDate } from '../../utils/formatters';

export default function Footer() {
  const { data: updated } = useData<LastUpdatedData>('last_updated.json');

  return (
    <footer style={{
      background: 'var(--color-text)',
      color: 'rgba(255,255,255,0.7)',
      padding: '48px 0 32px',
      marginTop: '64px',
    }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: '8px',
                background: 'var(--color-primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <TrendingUp size={16} color="white" />
              </div>
              <div style={{ color: 'white', fontWeight: 800, fontSize: '0.95rem' }}>Red Devils Analytics</div>
            </div>
            <p style={{ fontSize: '0.8rem', lineHeight: 1.7, margin: 0 }}>
              A modern Manchester United analytics platform. Data updated daily via GitHub Actions.
            </p>
            {updated && (
              <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>
                Last updated: {formatFullDate(updated.updatedAt)}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Pages</div>
            {[
              { to: '/', label: 'Home' },
              { to: '/table', label: 'League Table' },
              { to: '/fixtures', label: 'Fixtures' },
              { to: '/results', label: 'Results' },
              { to: '/players', label: 'Players' },
              { to: '/team', label: 'Team Stats' },
              { to: '/compare', label: 'Compare Players' },
            ].map(l => (
              <Link key={l.to} to={l.to} style={{
                display: 'block',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                marginBottom: '8px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >{l.label}</Link>
            ))}
          </div>

          {/* Data Sources */}
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: '0.85rem', marginBottom: '16px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Data Sources</div>
            {[
              { label: 'football-data.org', url: 'https://football-data.org' },
              { label: 'API-Football', url: 'https://api-football.com' },
            ].map(s => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer" style={{
                display: 'block',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                marginBottom: '8px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = 'white')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}
              >{s.label}</a>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '0.8rem' }}>
            © 2025 Red Devils Analytics. Fan project — not affiliated with Manchester United FC.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <a href="https://github.com" target="_blank" rel="noreferrer" style={{ color: 'rgba(255,255,255,0.5)' }}>
              <ExternalLink size={18} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
