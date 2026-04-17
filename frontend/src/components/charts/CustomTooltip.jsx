export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: 'var(--bg-header)',
        border: '1px solid var(--border)',
        padding: '8px 12px',
        fontSize: 11,
        fontFamily: 'JetBrains Mono',
        minWidth: 160,
      }}
    >
      <div style={{ color: 'var(--text-muted)', marginBottom: 6, fontSize: 10 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} className="flex justify-between gap-4" style={{ color: p.color, marginBottom: 2 }}>
          <span style={{ color: 'var(--text-subtle)' }}>{p.name}</span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === 'number' ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  )
}
