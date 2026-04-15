import { C } from '../../theme'

export function HealthBar({ value }) {
  const color = value >= 90 ? C.safe : value >= 75 ? C.warn : C.critical
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ height: 3, width: 56, background: C.border, flexShrink: 0 }}>
        <div style={{ width: `${value}%`, background: color, height: '100%' }} />
      </div>
      <span style={{ color: C.heading, fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>{value}%</span>
    </div>
  )
}
