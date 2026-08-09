import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import type { SofaScorePlayer } from '../../types';

const MAN_UTD = 'Manchester United';

interface Props {
  label: string;
  selected: SofaScorePlayer | null;
  onSelect: (p: SofaScorePlayer) => void;
  players: SofaScorePlayer[];
  /** If true, only show Man Utd players */
  unitedOnly?: boolean;
  accentColor?: string;
}

function posLabel(pos: string) {
  switch (pos) {
    case 'F': return 'FWD';
    case 'M': return 'MID';
    case 'D': return 'DEF';
    case 'G': return 'GK';
    default: return pos;
  }
}

export default function LeaguePlayerPicker({ label, selected, onSelect, players, unitedOnly, accentColor = 'var(--color-primary)' }: Props) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = players;
    if (unitedOnly) list = list.filter(p => p.team_name === MAN_UTD);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.player_name.toLowerCase().includes(q) || p.team_name.toLowerCase().includes(q));
    }
    // United first, then alphabetical by team
    list = [...list].sort((a, b) => {
      const aUtd = a.team_name === MAN_UTD ? 0 : 1;
      const bUtd = b.team_name === MAN_UTD ? 0 : 1;
      if (aUtd !== bUtd) return aUtd - bUtd;
      if (a.team_name !== b.team_name) return a.team_name.localeCompare(b.team_name);
      return a.player_name.localeCompare(b.player_name);
    });
    return list.slice(0, 50);
  }, [players, search, unitedOnly]);

  // Group for rendering
  const grouped = useMemo(() => {
    const map = new Map<string, SofaScorePlayer[]>();
    for (const p of filtered) {
      const team = p.team_name;
      if (!map.has(team)) map.set(team, []);
      map.get(team)!.push(p);
    }
    return map;
  }, [filtered]);

  const initials = selected ? selected.player_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : '';

  return (
    <div style={{ flex: 1, minWidth: '200px' }}>
      <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>{label}</div>
      {selected ? (
        <div
          className="card"
          style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}
          onClick={() => { setOpen(true); setSearch(''); }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: '50%', background: accentColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 800, fontSize: '0.85rem', flexShrink: 0,
            border: `2px solid ${accentColor}`,
          }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selected.player_name}</div>
            <div style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ fontWeight: 600 }}>{selected.team_code}</span>
              <span>·</span>
              <span>{posLabel(selected.position)}</span>
              <span>·</span>
              <span>{selected.statistics?.minutesPlayed ?? 0} min</span>
            </div>
          </div>
          <div style={{ fontSize: '0.72rem', color: accentColor, fontWeight: 600 }}>Change</div>
        </div>
      ) : (
        <div
          className="card"
          style={{ padding: '14px', cursor: 'pointer', border: '2px dashed var(--color-border)', background: 'var(--color-bg)', boxShadow: 'none' }}
          onClick={() => setOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)' }}>
            <Search size={16} />
            <span style={{ fontSize: '0.82rem' }}>Select a player…</span>
          </div>
        </div>
      )}

      {open && (
        <div style={{ position: 'relative', zIndex: 50 }}>
          <div
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', top: '6px', left: 0, right: 0,
            background: 'white', borderRadius: '12px',
            border: '1px solid var(--color-border)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.15)',
            zIndex: 50, overflow: 'hidden',
          }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                  autoFocus
                  type="text"
                  className="search-input"
                  placeholder={unitedOnly ? 'Search United players…' : 'Search all EPL players…'}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ paddingLeft: '32px', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
              {[...grouped.entries()].map(([team, teamPlayers]) => (
                <div key={team}>
                  <div style={{
                    padding: '6px 14px', fontSize: '0.65rem', fontWeight: 800,
                    color: team === MAN_UTD ? 'var(--color-primary)' : 'var(--color-text-light)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: team === MAN_UTD ? 'rgba(139,0,0,0.04)' : 'var(--color-bg)',
                    position: 'sticky', top: 0, zIndex: 1,
                  }}>
                    {team}
                  </div>
                  {teamPlayers.map(p => (
                    <div
                      key={p.player_id}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '8px 14px', cursor: 'pointer', transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-bg)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { onSelect(p); setOpen(false); setSearch(''); }}
                    >
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: p.team_name === MAN_UTD ? 'var(--color-primary)' : '#64748B',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700, fontSize: '0.65rem', flexShrink: 0,
                      }}>
                        {p.player_name.split(' ').map(w => w[0]).join('').slice(0, 2)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{p.player_name}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--color-text-light)' }}>
                          {posLabel(p.position)} · #{p.jersey_number || '—'} · {p.statistics?.minutesPlayed ?? 0} min
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>No players found</div>
              )}
            </div>
            <div style={{ padding: '8px 14px', borderTop: '1px solid var(--color-border)' }}>
              <button onClick={() => setOpen(false)} style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
