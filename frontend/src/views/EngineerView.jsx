import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { C } from '../theme'
import { MACHINES } from '../data/machines'
import { SensorChart } from '../components/charts/SensorChart'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { useSensorFeed } from '../hooks/useSensorFeed'

export function EngineerView() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState('MCH-03')
  const { chartData, isRunning, alertVisible, alertData, stats, diagnosisRaw, startFeed, resetFeed } = useSensorFeed(activeId)

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

        {MACHINES.map(m => {
          const liveCusum = m.id === activeId && stats?.cusum_score ? stats.cusum_score : m.cusum
          const liveTemp = m.id === activeId && chartData.length > 0 ? chartData[chartData.length - 1].temperature.toFixed(2) : m.temp
          const liveVib = m.id === activeId && chartData.length > 0 ? chartData[chartData.length - 1].vibration.toFixed(3) : m.vib

          return (
            <div
              key={m.id}
              onClick={() => setActiveId(m.id)}
              onDoubleClick={() => navigate(`/machine/${m.id}`)}
              style={{
                display: 'grid',
                gridTemplateColumns: '90px 1fr 110px 80px 100px 130px 90px',
                padding: '10px 24px',
                borderBottom: `1px solid ${C.borderSub}`,
                alignItems: 'center',
                background: m.id === activeId ? C.bgAlert : 'transparent',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
              onMouseOver={e => { if (m.id !== activeId) e.currentTarget.style.background = C.bgS2 }}
              onMouseOut={e => { if (m.id !== activeId) e.currentTarget.style.background = 'transparent' }}
            >
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: C.heading }}>{m.id}</p>
              <p style={{ fontSize: 12, color: C.body }}>{m.name}</p>
              <HealthBar value={Math.max(0, m.health - (m.id === activeId && stats?.cusum_score > 10 ? 15 : 0))} />
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: m.id === activeId ? C.warn : C.body }}>{liveTemp}</p>
              <p style={{ fontSize: 12, fontFamily: 'JetBrains Mono', color: m.id === activeId ? C.warn : C.body }}>{liveVib}</p>
              <p style={{
                fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 600,
                color: liveCusum > 10 ? C.critical : liveCusum > 4 ? C.warn : C.safe,
              }}>
                {liveCusum.toFixed(1)}{liveCusum > 10 ? ' ↑ SIGNAL' : ''}
              </p>
              <StatusBadge status={m.id === activeId && stats?.drift_detected ? 'DRIFT' : m.status} />
            </div>
          )
        })}
      </div>

      {/* Chart + Agent Trace */}
      <div style={{ display: 'flex' }}>
        <div style={{ flex: 1, borderRight: `1px solid ${C.border}` }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 24px', borderBottom: `1px solid ${C.border}`,
          }}>
            <div>
              <h3 style={{ fontSize: 14, color: C.heading }}>{activeId} — Statistical Drift Analysis</h3>
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

        {(stats?.drift_detected || alertVisible) && (
          <div style={{ width: 360, padding: 16, background: C.bgS1, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto' }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>
              Live AI Reasoning Trace
            </p>
            
            {/* Agent 2 shows when stats arrive */}
            {stats && (
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 10, color: C.warn, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Agent 2: Detection
                  </p>
                </div>
                <p style={{ fontSize: 11, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.6 }}>
                  {`> DRIFT FLAGGED (h > 10)\n> CUSUM: ${stats.cusum_score}\n> Temp Slope: ${stats.slope_temp}°C/t\n> Pipeline handed to Agent 3.`}
                </p>
              </div>
            )}

            {/* Agent 3 shows when polling completes */}
            {diagnosisRaw ? (
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 10, color: C.critical, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Agent 3: Root Cause (Claude 3.5)
                  </p>
                </div>
                <p style={{ fontSize: 10, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {diagnosisRaw}
                </p>
              </div>
            ) : (
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <p style={{ fontSize: 11, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.6 }}>Detecting drift & waiting for Bedrock Agent 3...</p>
              </div>
            )}

            {/* Agent 4 Explainer summary */}
            {alertData && (
              <div style={{ border: `1px solid ${C.border}`, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <p style={{ fontSize: 10, color: C.safe, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Agent 4: Explainer (Formatting)
                  </p>
                </div>
                <p style={{ fontSize: 11, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.6, whiteSpace: 'pre-wrap', color: C.safe }}>
                  Alert JSON Object generated and published to Operator Dashboard successfully.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
