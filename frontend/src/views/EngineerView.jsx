import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SensorChart } from '../components/charts/SensorChart'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { useMachines } from '../hooks/useMachines'

export function EngineerView() {
  const navigate = useNavigate()
  const { machines } = useMachines()
  const [activeId, setActiveId] = useState(null)
  const { chartData, isRunning, alertVisible, alertData, stats, diagnosisRaw, startFeed, resetFeed } = useSensorFeed(activeId)

  useEffect(() => {
    if (!activeId && machines.length > 0) {
      setActiveId(machines[0].id)
    }
  }, [activeId, machines])

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>

      {/* ── Machine Table Panel ─────────────────────────────────────────── */}
      <div style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-panel)', shrink: 0 }}>
        {/* Table header bar */}
        <div
          className="flex items-center px-4 py-1.5"
          style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>Machine Fleet</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Click row to stream · Double-click to detail view</span>
        </div>

        {/* Column headers */}
        <div
          className="grid px-4 py-1.5"
          style={{
            gridTemplateColumns: '88px 1fr 120px 80px 100px 140px 90px',
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {['Machine ID', 'Name', 'Health', 'Temp °C', 'Vibration', 'CUSUM Score', 'Status'].map(h => (
            <span key={h} style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              {h}
            </span>
          ))}
        </div>

        {/* Data rows */}
        {machines.map((m, idx) => {
          const liveCusum = m.id === activeId && stats?.cusum_score ? stats.cusum_score : m.cusum
          const liveTemp  = m.id === activeId && chartData.length > 0 ? chartData[chartData.length - 1].temperature.toFixed(2) : m.temp
          const liveVib   = m.id === activeId && chartData.length > 0 ? chartData[chartData.length - 1].vibration.toFixed(3) : m.vib
          const isActive  = m.id === activeId
          const cusumColor = liveCusum > 10 ? 'var(--accent-critical)' : liveCusum > 4 ? 'var(--accent-warn)' : 'var(--accent-safe)'

          return (
            <div
              key={m.id}
              onClick={() => setActiveId(m.id)}
              onDoubleClick={() => navigate(`/machine/${m.id}`)}
              className="grid px-4 cursor-pointer transition-colors duration-100"
              style={{
                gridTemplateColumns: '88px 1fr 120px 80px 100px 140px 90px',
                alignItems: 'center',
                paddingTop: 8,
                paddingBottom: 8,
                background: isActive
                  ? 'rgba(87,148,242,0.08)'
                  : idx % 2 === 0 ? 'var(--bg-row)' : 'var(--bg-row-alt)',
                borderBottom: '1px solid var(--border-subtle)',
                borderLeft: isActive ? '2px solid var(--accent-info)' : '2px solid transparent',
              }}
            >
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-heading)' }}>{m.id}</span>
              <span style={{ fontSize: 12, color: 'var(--text-body)', fontWeight: 500 }}>{m.name}</span>
              <div style={{ paddingRight: 12 }}>
                <HealthBar value={Math.max(0, m.health - (isActive && stats?.cusum_score > 10 ? 15 : 0))} />
              </div>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: isActive ? 'var(--accent-warn)' : 'var(--text-body)' }}>
                {liveTemp}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: isActive ? 'var(--accent-info)' : 'var(--text-body)' }}>
                {liveVib}
              </span>
              <div className="flex items-center gap-2">
                <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono', fontWeight: 700, color: cusumColor }}>
                  {liveCusum.toFixed(1)}
                </span>
                {liveCusum > 10 && (
                  <span style={{ fontSize: 10, color: 'var(--accent-critical)', fontWeight: 700, letterSpacing: '0.05em' }}>↑ SIGNAL</span>
                )}
              </div>
              <StatusBadge status={isActive ? (stats?.drift_detected ? 'DRIFT' : (stats?.cusum_score > 4 ? 'WARN' : 'NORMAL')) : m.status} />
            </div>
          )
        })}
      </div>

      {/* ── Chart + AI Trace ────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* Chart */}
        <div className="flex-1 flex flex-col" style={{ borderRight: '1px solid var(--border)' }}>
          <div
            className="flex items-center justify-between px-4 py-1.5 shrink-0"
            style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', minHeight: 32 }}
          >
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>{activeId} — Statistical Drift Analysis</span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>Drift zone visible after T+80 · SCADA threshold never triggered</span>
            </div>
            <FeedControls isRunning={isRunning} chartData={chartData} onStart={startFeed} onReset={resetFeed} />
          </div>
          <div className="flex-1 p-4">
            <SensorChart data={chartData} height={260} />
          </div>
        </div>

        {/* AI Trace Panel — only visible when drift detected */}
        {(stats?.drift_detected || alertVisible) && (
          <div
            className="flex flex-col overflow-y-auto shrink-0"
            style={{
              width: 340,
              background: 'var(--bg-panel)',
              borderLeft: '1px solid var(--border)',
            }}
          >
            {/* Panel header */}
            <div
              className="px-4 py-1.5 shrink-0 flex items-center gap-2"
              style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
            >
              <span
                className="w-2 h-2 rounded-full animate-pulse-glow"
                style={{ background: 'var(--accent-critical)' }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--accent-critical)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                AI Reasoning Trace
              </span>
            </div>

            <div className="flex flex-col gap-0">
              {/* Agent 2 */}
              {stats && (
                <TraceBlock
                  num="2"
                  label="Detection Agent"
                  color="var(--accent-warn)"
                  status="completed"
                  body={`> DRIFT FLAGGED (CUSUM h > 10)\n> Score: ${stats.cusum_score}\n> Temp slope: ${stats.slope_temp}°C/t\n> Vibration slope: ${stats.slope_vib}\n> Handing off to Agent 3.`}
                />
              )}

              {/* Agent 3 */}
              {(stats?.drift_detected || diagnosisRaw) && (
                <TraceBlock
                  num="3"
                  label="Root Cause (Claude 3.5)"
                  color="var(--accent-critical)"
                  status={diagnosisRaw ? 'completed' : 'running'}
                  body={diagnosisRaw || 'Fetching MCP fingerprints...\nQuerying Amazon Bedrock...'}
                  pulse={!diagnosisRaw}
                />
              )}

              {/* Agent 4 */}
              {(alertData || diagnosisRaw) && (
                <TraceBlock
                  num="4"
                  label="Explainer Agent"
                  color="var(--accent-safe)"
                  status={alertData ? 'completed' : 'running'}
                  body={alertData ? 'Alert JSON published to Operator Dashboard.' : 'Formatting diagnosis...'}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TraceBlock({ num, label, color, status, body, pulse }) {
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-subtle)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex items-center justify-center text-[10px] font-bold"
            style={{
              width: 18, height: 18, borderRadius: '50%',
              background: color, color: '#111',
            }}
          >
            {num}
          </span>
          <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: 10, color: status === 'completed' ? 'var(--accent-safe)' : 'var(--accent-warn)',
            fontFamily: 'JetBrains Mono', textTransform: 'uppercase',
          }}
        >
          {status === 'running' ? '● running' : '✓ done'}
        </span>
      </div>
      {/* Body */}
      <pre
        className={pulse ? 'animate-pulse' : ''}
        style={{
          fontSize: 11,
          fontFamily: 'JetBrains Mono',
          color: 'var(--text-body)',
          padding: '10px 16px',
          margin: 0,
          whiteSpace: 'pre-wrap',
          lineHeight: 1.7,
          background: 'var(--bg-row)',
        }}
      >
        {body}
      </pre>
    </div>
  )
}
