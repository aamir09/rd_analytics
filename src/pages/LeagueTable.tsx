import { useData } from '../hooks/useData';
import type { StandingsData } from '../types';
import { parseForm, MAN_UTD_ID_FD } from '../utils/formatters';

export default function LeagueTable() {
  const { data, loading, error } = useData<StandingsData>('standings.json');

  const FORM_COLORS: Record<string, string> = { W: '#16a34a', D: '#ca8a04', L: '#dc2626' };

  return (
    <div className="page-wrapper">
      <div className="container">
        <div className="page-header">
          <div className="accent-bar" />
          <h1 className="text-heading">Premier League Table</h1>
          <p style={{ color: 'var(--color-text-muted)', marginTop: '8px', fontSize: '0.9rem' }}>
            {data ? `Season ${data.season}/${parseInt(data.season) + 1}` : 'Current season standings'}
          </p>
        </div>

        {loading && (
          <div className="card" style={{ padding: '32px' }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
                <div className="skeleton" style={{ width: 28, height: 16, flexShrink: 0 }} />
                <div className="skeleton" style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0 }} />
                <div className="skeleton" style={{ flex: 1, height: 16 }} />
                <div className="skeleton" style={{ width: 200, height: 16 }} />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
            <div style={{ color: 'var(--color-loss)', fontWeight: 600, marginBottom: '8px' }}>Failed to load standings</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>{error}</div>
          </div>
        )}

        {data && (
          <div className="card fade-in" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: 48, textAlign: 'center' }}>#</th>
                    <th>Club</th>
                    <th style={{ textAlign: 'center', width: 48 }}>P</th>
                    <th style={{ textAlign: 'center', width: 48 }}>W</th>
                    <th style={{ textAlign: 'center', width: 48 }}>D</th>
                    <th style={{ textAlign: 'center', width: 48 }}>L</th>
                    <th style={{ textAlign: 'center', width: 56 }}>GF</th>
                    <th style={{ textAlign: 'center', width: 56 }}>GA</th>
                    <th style={{ textAlign: 'center', width: 56 }}>GD</th>
                    <th style={{ textAlign: 'center', width: 56, fontWeight: 800, color: 'var(--color-primary)' }}>PTS</th>
                    <th style={{ minWidth: 100 }}>Form</th>
                  </tr>
                </thead>
                <tbody>
                  {data.table.map(row => {
                    const isUtd = row.team.id === MAN_UTD_ID_FD;
                    const form = parseForm(row.form);
                    return (
                      <tr key={row.team.id} className={isUtd ? 'highlighted' : ''}>
                        <td style={{ textAlign: 'center', fontWeight: 700, color: isUtd ? 'var(--color-primary)' : 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                          {row.position}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {row.team.crest && (
                              <img src={row.team.crest} alt="" style={{ width: 26, height: 26, objectFit: 'contain', flexShrink: 0 }} />
                            )}
                            <span style={{ fontWeight: isUtd ? 700 : 500, color: isUtd ? 'var(--color-primary)' : 'var(--color-text)', fontSize: '0.875rem' }}>
                              {row.team.name}
                            </span>
                            {isUtd && (
                              <span style={{ fontSize: '0.65rem', fontWeight: 700, background: 'var(--color-primary)', color: 'white', padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.04em' }}>YOU</span>
                            )}
                          </div>
                        </td>
                        {[row.playedGames, row.won, row.draw, row.lost, row.goalsFor, row.goalsAgainst].map((v, i) => (
                          <td key={i} style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)' }}>{v}</td>
                        ))}
                        <td style={{ textAlign: 'center', fontSize: '0.875rem', fontWeight: 600, color: row.goalDifference > 0 ? 'var(--color-win)' : row.goalDifference < 0 ? 'var(--color-loss)' : 'var(--color-text-muted)' }}>
                          {row.goalDifference > 0 ? `+${row.goalDifference}` : row.goalDifference}
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 800, fontSize: '0.95rem', color: isUtd ? 'var(--color-primary)' : 'var(--color-text)' }}>
                          {row.points}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '3px' }}>
                            {form.length === 0
                              ? <span style={{ color: 'var(--color-text-light)', fontSize: '0.75rem' }}>—</span>
                              : form.map((f, i) => (
                                <div key={i} style={{ width: 20, height: 20, borderRadius: '50%', background: `${FORM_COLORS[f]}20`, color: FORM_COLORS[f], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 800 }}>{f}</div>
                              ))
                            }
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {data && (
          <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'P — Played', color: 'transparent' },
              { label: 'W — Won', color: 'transparent' },
              { label: 'GD — Goal Difference', color: 'transparent' },
              { label: 'PTS — Points', color: 'transparent' },
            ].map(l => (
              <span key={l.label} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{l.label}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
