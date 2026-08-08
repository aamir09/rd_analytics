import type { Match } from '../../types';
import {
  formatMatchDate,
  formatMatchTime,
  getScoreline,
  getManUtdResult,
  MAN_UTD_ID_FD,
} from '../../utils/formatters';

interface MatchCardProps {
  match: Match;
  type: 'fixture' | 'result';
}

const RESULT_COLORS = {
  W: { border: 'var(--color-win)', bg: '#f0fdf4', text: 'var(--color-win)', label: 'WIN' },
  D: { border: 'var(--color-draw)', bg: '#fefce8', text: 'var(--color-draw)', label: 'DRAW' },
  L: { border: 'var(--color-loss)', bg: '#fff1f2', text: 'var(--color-loss)', label: 'LOSS' },
};

export default function MatchCard({ match, type }: MatchCardProps) {
  const home = match.homeTeam;
  const away = match.awayTeam;
  const utdResult = type === 'result' ? getManUtdResult(match) : null;
  const resultStyle = utdResult ? RESULT_COLORS[utdResult] : null;
  const score = type === 'result' ? getScoreline(match) : null;

  return (
    <div className="card" style={{
      padding: '16px 20px',
      borderLeft: resultStyle ? `4px solid ${resultStyle.border}` : '4px solid var(--color-border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {match.competition.emblem && (
            <img src={match.competition.emblem} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
          )}
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {match.competition.name}
          </span>
          {match.matchday && (
            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-light)' }}>· MD{match.matchday}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {resultStyle && (
            <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800, background: resultStyle.bg, color: resultStyle.text, letterSpacing: '0.06em' }}>
              {resultStyle.label}
            </span>
          )}
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>
            {formatMatchDate(match.utcDate)} · {formatMatchTime(match.utcDate)}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
          {home.crest && <img src={home.crest} alt={home.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />}
          <div>
            <div style={{ fontWeight: home.id === MAN_UTD_ID_FD ? 700 : 500, fontSize: '0.9rem', color: home.id === MAN_UTD_ID_FD ? 'var(--color-primary)' : 'var(--color-text)' }}>
              {home.shortName ?? home.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Home</div>
          </div>
        </div>

        <div style={{ textAlign: 'center', minWidth: '80px' }}>
          {score
            ? <div style={{ fontWeight: 900, fontSize: '1.4rem', letterSpacing: '-0.04em', color: 'var(--color-text)' }}>{score}</div>
            : <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>VS</div>
          }
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'flex-end', flexDirection: 'row-reverse' }}>
          {away.crest && <img src={away.crest} alt={away.name} style={{ width: 32, height: 32, objectFit: 'contain' }} />}
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: away.id === MAN_UTD_ID_FD ? 700 : 500, fontSize: '0.9rem', color: away.id === MAN_UTD_ID_FD ? 'var(--color-primary)' : 'var(--color-text)' }}>
              {away.shortName ?? away.name}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Away</div>
          </div>
        </div>
      </div>
    </div>
  );
}
