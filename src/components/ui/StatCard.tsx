interface StatCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  accent?: boolean;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({ label, value, subtitle, accent, icon, className = '' }: StatCardProps) {
  return (
    <div
      className={`card ${className}`}
      style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}
    >
      {accent && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'var(--color-primary)',
          borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        }} />
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div className="text-label" style={{ marginBottom: '8px' }}>{label}</div>
          <div className="stat-number">{value}</div>
          {subtitle && (
            <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>{subtitle}</div>
          )}
        </div>
        {icon && (
          <div style={{
            width: 44, height: 44,
            borderRadius: '10px',
            background: 'rgba(139,0,0,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-primary)',
            flexShrink: 0,
          }}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}
