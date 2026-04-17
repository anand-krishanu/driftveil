export function HealthBar({ value }) {
  const color = value >= 90 ? 'var(--accent-safe)' : value >= 70 ? 'var(--accent-warn)' : 'var(--accent-critical)'
  return (
    <div className="flex items-center gap-2">
      <div style={{ width: 60, height: 4, background: 'var(--border)', position: 'relative', flexShrink: 0 }}>
        <div style={{ width: `${value}%`, height: '100%', background: color, transition: 'width 0.4s ease' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', tabularNums: true, minWidth: 28 }}>
        {value}%
      </span>
    </div>
  )
}
