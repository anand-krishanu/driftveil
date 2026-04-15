import { C } from '../../theme'

export function StatusBadge({ status }) {
  const map = {
    NORMAL: { color: C.safe,     bg: C.safeDim },
    WARN:   { color: C.warn,     bg: C.warnDim },
    DRIFT:  { color: C.critical, bg: C.critDim },
  }
  const s = map[status] || map.NORMAL
  return (
    <span style={{
      color: s.color,
      border: `1px solid ${s.color}`,
      background: s.bg,
      padding: '2px 8px',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.08em',
      display: 'inline-block',
    }}>
      {status}
    </span>
  )
}
