

interface Props {
  season: '2526' | '2627';
  onChange: (season: '2526' | '2627') => void;
}

export default function SeasonToggle({ season, onChange }: Props) {
  const options: { key: '2526' | '2627'; label: string; disabled?: boolean }[] = [
    { key: '2526', label: '2025/26' },
    { key: '2627', label: '2026/27', disabled: true },
  ];

  return (
    <div style={{ display: 'inline-flex', background: 'var(--color-bg)', borderRadius: '10px', padding: '3px', border: '1px solid var(--color-border)' }}>
      {options.map(opt => {
        const active = season === opt.key;
        return (
          <button
            key={opt.key}
            onClick={() => !opt.disabled && onChange(opt.key)}
            disabled={opt.disabled}
            style={{
              padding: '6px 16px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              fontWeight: 700,
              border: 'none',
              cursor: opt.disabled ? 'not-allowed' : 'pointer',
              background: active ? 'var(--color-primary)' : 'transparent',
              color: active ? 'white' : opt.disabled ? 'var(--color-text-light)' : 'var(--color-text-muted)',
              transition: 'all 0.2s ease',
              position: 'relative',
              opacity: opt.disabled ? 0.5 : 1,
            }}
          >
            {opt.label}
            {opt.disabled && (
              <span style={{
                position: 'absolute',
                top: '-6px',
                right: '-8px',
                fontSize: '0.55rem',
                fontWeight: 800,
                background: 'var(--color-accent)',
                color: '#1A1A1A',
                padding: '1px 5px',
                borderRadius: '6px',
                letterSpacing: '0.03em',
              }}>
                SOON
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
