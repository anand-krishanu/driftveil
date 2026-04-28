import { Divider } from '../ui/Divider'

export function AlertCard({ alert, onEscalate, onAcknowledge }) {
  const { eventId, machine, title, confidence, eta, score, sensors, action, fingerprint } = alert
  return (
    <div
      style={{
        background: 'var(--bg-alert)',
        borderTop: '2px solid var(--accent-critical)',
        padding: '12px 14px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="animate-pulse-glow"
            style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-critical)', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            ⚠ DRIFT ALERT
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>{eventId}</span>
      </div>

      {/* Title */}
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 2 }}>{title}</div>
      <div style={{ fontSize: 11, color: 'var(--text-subtle)', marginBottom: 10 }}>{machine}</div>

      {/* Metrics grid */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-3">
        {[
          { label: 'AI Confidence', value: confidence, color: 'var(--text-heading)', mono: true },
          { label: 'Est. Failure',  value: eta,        color: 'var(--accent-critical)', mono: true },
          { label: 'Drift Score',   value: score,      color: 'var(--accent-warn)', mono: true },
          { label: 'Sensors',       value: sensors,    color: 'var(--text-body)',  mono: false },
        ].map(({ label, value, color, mono }) => (
          <div key={label}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 2 }}>
              {label}
            </div>
            <div style={{ fontSize: 11, color, fontFamily: mono ? 'JetBrains Mono' : 'inherit', fontWeight: 600 }}>
              {value}
            </div>
          </div>
        ))}
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />

      {/* Action */}
      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        Prescribed Action
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 8 }}>{action}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>{fingerprint}</div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={onEscalate}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: 11,
            fontWeight: 600,
            border: '1px solid var(--accent-critical)',
            color: 'var(--accent-critical)',
            background: 'transparent',
            cursor: 'pointer',
            letterSpacing: '0.04em',
          }}
        >
          Escalate
        </button>
        <button
          onClick={onAcknowledge}
          style={{
            flex: 1,
            padding: '5px 0',
            fontSize: 11,
            border: '1px solid var(--border)',
            color: 'var(--text-subtle)',
            background: 'transparent',
            cursor: 'pointer',
          }}
        >
          Acknowledge
        </button>
      </div>
    </div>
  )
}
