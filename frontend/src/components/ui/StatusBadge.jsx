export function StatusBadge({ status }) {
  const map = {
    NORMAL: 'text-safe bg-safeDim border-safe/30',
    WARN:   'text-warn bg-warnDim border-warn/30 shadow-[0_0_8px_rgba(217,119,6,0.2)]',
    DRIFT:  'text-critical bg-criticalDim border-critical/50 shadow-[0_0_12px_rgba(220,38,38,0.3)] animate-pulse-glow',
  }
  const cls = map[status] || map.NORMAL
  return (
    <span className={`border px-2 py-0.5 text-[10px] font-semibold tracking-widest inline-block rounded-sm backdrop-blur-md ${cls}`}>
      {status}
    </span>
  )
}
