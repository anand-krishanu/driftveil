export function StatusBadge({ status }) {
  const styles = {
    NORMAL: { color: 'var(--accent-safe)',    border: 'rgba(115,191,105,0.4)', bg: 'var(--accent-safe-dim)'    },
    WARN:   { color: 'var(--accent-warn)',    border: 'rgba(255,153,0,0.4)',   bg: 'var(--accent-warn-dim)'    },
    DRIFT:  { color: 'var(--accent-critical)', border: 'rgba(242,73,92,0.5)', bg: 'var(--accent-critical-dim)' },
  }
  const s = styles[status] || styles.NORMAL
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-widest"
      style={{ color: s.color, border: `1px solid ${s.border}`, background: s.bg }}
    >
      <span className="w-1 h-1 rounded-full" style={{ background: s.color }} />
      {status}
    </span>
  )
}
