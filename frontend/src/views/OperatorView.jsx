import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../theme'
import { MACHINES } from '../data/machines'
import { SensorChart } from '../components/charts/SensorChart'
import { AlertCard } from '../components/alerts/AlertCard'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useSensorFeed } from '../hooks/useSensorFeed'

export function OperatorView() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState('MCH-03')
  const { chartData, isRunning, alertVisible, alertData, startFeed, resetFeed } = useSensorFeed(activeId)

  const normalCount = MACHINES.filter(m => m.status === 'NORMAL').length
  const driftCount  = MACHINES.filter(m => m.status === 'DRIFT').length
  const warnCount   = MACHINES.filter(m => m.status === 'WARN').length

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', borderBottom: `1px solid ${C.border}` }}>
        {[
          { label: 'Active Nodes',   value: MACHINES.length, sub: 'Monitoring',      color: C.heading  },
          { label: 'Healthy',        value: normalCount,      sub: 'No drift',        color: C.safe     },
          { label: 'Warning',        value: warnCount,        sub: 'Monitor closely', color: C.warn     },
          { label: 'Drift Detected', value: driftCount,       sub: 'Action needed',  color: C.critical },
        ].map((kpi, i) => (
          <div key={i} style={{
            padding: '16px 24px',
            borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
          }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>{kpi.label}</p>
            <p style={{ fontSize: 32, fontWeight: 700, color: kpi.color, margin: '4px 0 2px', fontVariantNumeric: 'tabular-nums' }}>{kpi.value}</p>
            <p style={{ fontSize: 11, color: C.subtle }}>{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
        {/* Chart Panel */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${C.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <h3 style={{ fontSize: 14, color: C.heading }}>{activeId} — Live Sensor Feed</h3>
              <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>
                Temperature · Vibration · SCADA Threshold
              </p>
            </div>
            <FeedControls isRunning={isRunning} chartData={chartData} onStart={startFeed} onReset={resetFeed} />
          </div>
          <div style={{ padding: 16, flex: 1 }}>
            <SensorChart data={chartData} height={340} />
            {chartData.length === 0 && (
              <p style={{ textAlign: 'center', color: C.muted, fontSize: 12, marginTop: 12 }}>
                Click "Start Factory Feed" to begin simulation
              </p>
            )}
          </div>
        </div>

        {/* Right Panel: Machine List + Alert */}
        <div style={{ width: 300, display: 'flex', flexDirection: 'column', background: C.bgS1 }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>
              Line Overview — Click to Drill In
            </p>
          </div>
          {MACHINES.map(m => (
            <div
              key={m.id}
              onClick={() => setActiveId(m.id)}
              onDoubleClick={() => navigate(`/machine/${m.id}`)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 16px', borderBottom: `1px solid ${C.borderSub}`,
                background: m.id === activeId ? C.bgAlert : 'transparent',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseOver={e => { if (m.id !== activeId) e.currentTarget.style.background = C.bgS2 }}
              onMouseOut={e => { if (m.id !== activeId) e.currentTarget.style.background = 'transparent' }}
            >
              <div>
                <p style={{ fontSize: 13, color: C.heading, fontWeight: 500 }}>{m.name}</p>
                <p style={{ fontSize: 10, color: C.subtle, marginTop: 1 }}>{m.id} · {m.line}</p>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))}
          {alertVisible && alertData && <AlertCard alert={alertData} />}
        </div>
      </div>
    </div>
  )
}
