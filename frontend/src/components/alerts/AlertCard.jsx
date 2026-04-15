import { C } from '../../theme'
import { Divider } from '../ui/Divider'

export function AlertCard({ alert }) {
  const { eventId, machine, title, confidence, eta, score, sensors, action, fingerprint } = alert
  return (
    <div style={{
      borderTop: `2px solid ${C.critical}`,
      background: C.bgAlert,
      padding: 16,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: C.critical, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Drift Alert
        </span>
        <span style={{ fontSize: 10, color: C.subtle, fontFamily: 'JetBrains Mono' }}>{eventId}</span>
      </div>

      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: C.heading }}>{title}</p>
        <p style={{ fontSize: 11, color: C.body, marginTop: 2 }}>{machine}</p>
      </div>

      <Divider />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px' }}>
        {[
          { label: 'AI Confidence', value: confidence, color: C.heading, mono: true },
          { label: 'Est. Failure',  value: eta,        color: C.critical, mono: true },
          { label: 'Drift Score',   value: score,      color: C.heading,  mono: true },
          { label: 'Sensors',       value: sensors,    color: C.body,     mono: false },
        ].map(({ label, value, color, mono }) => (
          <div key={label}>
            <p style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
            <p style={{
              fontSize: 12, fontWeight: 500, color, marginTop: 2,
              fontFamily: mono ? 'JetBrains Mono, monospace' : 'inherit',
            }}>{value}</p>
          </div>
        ))}
      </div>

      <Divider />

      <div>
        <p style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>
          Prescribed Action
        </p>
        <p style={{ fontSize: 12, color: C.body, lineHeight: 1.6 }}>{action}</p>
      </div>
      <p style={{ fontSize: 11, color: C.subtle }}>{fingerprint}</p>

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button style={{
          flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 500,
          border: `1px solid ${C.critical}`, color: C.critical,
          background: 'transparent', cursor: 'pointer',
        }}>
          Escalate
        </button>
        <button style={{
          flex: 1, padding: '7px 0', fontSize: 11, fontWeight: 500,
          border: `1px solid ${C.border}`, color: C.subtle,
          background: 'transparent', cursor: 'pointer',
        }}>
          Acknowledge
        </button>
      </div>
    </div>
  )
}
