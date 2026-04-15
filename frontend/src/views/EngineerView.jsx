import { useNavigate } from 'react-router-dom'
import { C } from '../theme'
import { MACHINES, AGENT_TRACE } from '../data/machines'
import { SensorChart } from '../components/charts/SensorChart'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { useSensorFeed } from '../hooks/useSensorFeed'

export function EngineerView() {
  const navigate = useNavigate()
  const { chartData, isRunning, alertVisible, startFeed, resetFeed } = useSensorFeed()

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Dense Machine Table */}
      <div style={{ borderBottom: `1px solid ${C.border}` }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '90px 1fr 110px 80px 100px 130px 90px',
          padding: '8px 24px',
          borderBottom: `1px solid ${C.border}`,
          background: C.bgS2,
        }}>
          {['Machine ID', 'Name', 'Health', 'Temp (°C)', 'Vibration', 'CUSUM Score', 'Status'].map(h => (
            <p key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle }}>{h}</p>
          ))}
        </div>

        {MACHINES.map(m => (
          <div
            key={m.id}
            onClick={() => navigate(`/machine/${m.id}`)}
            style={{
              display: 'grid',
              gridTemplateColumns: '90px 1fr 110px 80px 100px 130px 90px',
              padding: '10px 24px',
              borderBottom: `1px solid ${C.borderSub}`,
              alignItems: 'center',
              background: m.id === 'MCH-03' ? C.bgAlert : 'transparent',
              cursor: 'pointer', transition: 'background 0.1s',
            }}
            onMouseOver={e => { if (m.id !== 'MCH-03') e.currentTarget.style.background = C.bgS2 }}
            onMouseOut={e => { if (m.id !== 'MCH-03') e.currentTarget.style.background = 'transparent' }}
          >
            <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: C.heading }}>{m.id}</p>
            <p style={{ fontSize: 12, color: C.body }}>{m.name}</p>
            <HealthBar value={m.health} />
            <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: m.id === 'MCH-03' ? C.warn : C.body }}>{m.temp}</p>
            <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: m.id === 'MCH-03' ? C.warn : C.body }}>{m.vib}</p>
            <p style={{
              fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600,
              color: m.cusum > 10 ? C.critical : m.cusum > 4 ? C.warn : C.safe,
            }}>
              {m.cusum.toFixed(1)}{m.cusum > 10 ? ' ↑ SIGNAL' : ''}
            </p>
            <StatusBadge status={m.status} />
          </div>
        ))}
      </div>

      {/* Chart + Agent Trace */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <h3 style={{ fontSize: 14, color: C.heading }}>MCH-03 — Statistical Drift Analysis</h3>
              <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
                Drift zone visible after T+80 · SCADA threshold never triggered
              </p>
            </div>
            <FeedControls isRunning={isRunning} chartData={chartData} onStart={startFeed} onReset={resetFeed} />
          </div>
          <div style={{ padding: 16 }}>
            <SensorChart data={chartData} height={280} />
          </div>
        </div>

        {alertVisible && (
          <div style={{ width: 360, padding: 16, background: C.bgS1, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>
              Agent Reasoning Trace
            </p>
            {AGENT_TRACE.map((step, i) => (
              <div key={i} style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 10, color: C.warn, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    {step.agent}
                  </p>
                  <p style={{ fontSize: 10, color: C.subtle, fontFamily: 'JetBrains Mono' }}>{step.time}</p>
                </div>
                <p style={{ fontSize: 11, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.6 }}>{step.output}</p>
              </div>
            ))}
            <div style={{ border: `1px solid ${C.border}`, padding: 12, marginTop: 'auto' }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle, marginBottom: 4 }}>
                Cross-Machine Correlation
              </p>
              <p style={{ fontSize: 11, color: C.body }}>
                MCH-06 showing early warning correlation. Shared hydraulic loop suspected.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
