export function FeedControls({ isRunning, chartData, onStart, onReset }) {
  return (
    <div className="flex items-center gap-2">
      {!isRunning && chartData.length === 0 && (
        <button
          onClick={onStart}
          style={{
            padding: '4px 12px',
            fontSize: 11,
            fontWeight: 600,
            border: '1px solid var(--accent-info)',
            color: 'var(--accent-info)',
            background: 'var(--accent-info-dim)',
            cursor: 'pointer',
            letterSpacing: '0.04em',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--accent-info)'; e.target.style.color = '#111' }}
          onMouseLeave={e => { e.target.style.background = 'var(--accent-info-dim)'; e.target.style.color = 'var(--accent-info)' }}
        >
          ▶ Start Factory Feed
        </button>
      )}
      {(isRunning || chartData.length > 0) && (
        <button
          onClick={onReset}
          style={{
            padding: '4px 12px',
            fontSize: 11,
            border: '1px solid var(--border)',
            color: 'var(--text-subtle)',
            background: 'transparent',
            cursor: 'pointer',
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.target.style.background = 'var(--bg-row-hover)'; e.target.style.color = 'var(--text-body)' }}
          onMouseLeave={e => { e.target.style.background = 'transparent'; e.target.style.color = 'var(--text-subtle)' }}
        >
          ↺ Reset
        </button>
      )}
      {isRunning && (
        <span
          className="flex items-center gap-1.5"
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent-safe)', fontFamily: 'JetBrains Mono', letterSpacing: '0.08em' }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse-glow"
            style={{ background: 'var(--accent-safe)' }}
          />
          LIVE
        </span>
      )}
    </div>
  )
}
