import { STAT_REGISTRY, STAT_CATEGORIES } from '../../data/statRegistry';

interface Props {
  selected: string[];
  onChange: (keys: string[]) => void;
  /** Max number of stats a user can select */
  max?: number;
}

export default function StatPicker({ selected, onChange, max }: Props) {
  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter(k => k !== key));
    } else {
      if (max && selected.length >= max) return;
      onChange([...selected, key]);
    }
  };

  const selectAllCategory = (catKey: string) => {
    const catStats = STAT_REGISTRY.filter(s => s.category === catKey).map(s => s.key);
    const merged = [...new Set([...selected, ...catStats])];
    onChange(max ? merged.slice(0, max) : merged);
  };

  const clearCategory = (catKey: string) => {
    const catKeys = new Set(STAT_REGISTRY.filter(s => s.category === catKey).map(s => s.key));
    onChange(selected.filter(k => !catKeys.has(k)));
  };

  return (
    <div style={{ background: 'white', borderRadius: '12px', border: '1px solid var(--color-border)', padding: '16px', width: '100%' }}>
      {/* Top summary bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '10px', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Attributes Selection
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-primary)' }}>
            {selected.length} selected{max ? ` (max ${max})` : ''}
          </span>
          <button
            onClick={() => onChange([])}
            style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Clear All
          </button>
        </div>
      </div>

      {/* 3 Categories visible together side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        {STAT_CATEGORIES.map(cat => {
          const statsInCat = STAT_REGISTRY.filter(s => s.category === cat.key);
          const selectedInCat = selected.filter(k => STAT_REGISTRY.find(s => s.key === k)?.category === cat.key);

          return (
            <div
              key={cat.key}
              style={{
                background: 'var(--color-bg)',
                borderRadius: '10px',
                padding: '12px',
                border: `1px solid ${cat.color}30`,
              }}
            >
              {/* Category Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '6px', borderBottom: `2px solid ${cat.color}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '0.82rem', color: cat.color }}>
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span style={{ background: cat.color, color: 'white', fontSize: '0.62rem', padding: '1px 6px', borderRadius: '10px', marginLeft: '4px' }}>
                    {selectedInCat.length}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => selectAllCategory(cat.key)}
                    style={{ fontSize: '0.65rem', fontWeight: 700, color: cat.color, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => clearCategory(cat.key)}
                    style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* All attributes in this category */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {statsInCat.map(stat => {
                  const checked = selected.includes(stat.key);
                  const disabled = !checked && !!max && selected.length >= max;
                  return (
                    <label
                      key={stat.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '4px 6px',
                        borderRadius: '6px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.4 : 1,
                        fontSize: '0.78rem',
                        fontWeight: checked ? 700 : 500,
                        color: checked ? '#0f172a' : 'var(--color-text-muted)',
                        background: checked ? '#ffffff' : 'transparent',
                        boxShadow: checked ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => toggle(stat.key)}
                        style={{ accentColor: cat.color, cursor: 'pointer' }}
                      />
                      <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {stat.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
