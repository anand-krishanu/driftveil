import { C } from '../../theme'
export function FeedControls({ isRunning, chartData, onStart, onReset }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {!isRunning && chartData.length === 0 && (
        <button
          onClick={onStart}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 500,
            border: `1px solid ${C.warn}`, color: C.warn,
            background: 'transparent', cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseOver={e => { e.currentTarget.style.background = C.warn; e.currentTarget.style.color = C.bgBase }}
          onMouseOut={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.warn }}
        >
          Start Factory Feed
        </button>
      )}
      {(isRunning || chartData.length > 0) && (
        <button
          onClick={onReset}
          style={{
            padding: '6px 14px', fontSize: 12, fontWeight: 500,
            border: `1px solid ${C.border}`, color: C.subtle,
            background: 'transparent', cursor: 'pointer',
          }}
        >
          Reset
        </button>
      )}
      {isRunning && (
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.safe }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: C.safe,
            animation: 'pulse 2s infinite',
          }} />
          LIVE
        </span>
      )}
    </div>
  )
}
