import { C } from '../../theme'

export function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: C.bgS1,
      border: `1px solid ${C.border}`,
      padding: '8px 12px',
      fontSize: 12,
    }}>
      <p style={{ color: C.subtle, marginBottom: 4 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color, margin: '2px 0' }}>
          {p.name}:{' '}
          <span style={{ color: C.heading, fontFamily: 'JetBrains Mono, monospace' }}>
            {p.value}
          </span>
        </p>
      ))}
    </div>
  )
}
