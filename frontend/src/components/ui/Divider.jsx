export function Divider({ vertical = false }) {
  return (
    <div
      style={{
        background: 'var(--border)',
        flexShrink: 0,
        width: vertical ? 1 : '100%',
        height: vertical ? '100%' : 1,
      }}
    />
  )
}
