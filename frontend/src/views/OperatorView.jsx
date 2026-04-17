import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SensorChart } from '../components/charts/SensorChart'
import { AlertCard } from '../components/alerts/AlertCard'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { useMachines } from '../hooks/useMachines'

function GfPanel({ title, subtitle, controls, children, className = '' }) {
  return (
    <div
      className={`flex flex-col ${className}`}
      style={{ border: '1px solid var(--border)', background: 'var(--bg-panel)' }}
    >
      <div
        className="flex items-center justify-between px-3 py-1.5 shrink-0"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', minHeight: 32 }}
      >
        <div>
          <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 12 }}>{title}</span>
          {subtitle && (
            <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>{subtitle}</span>
          )}
        </div>
        {controls && <div>{controls}</div>}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  )
}

export function OperatorView() {
  const navigate = useNavigate()
  const { machines, isLoading } = useMachines()
  const [activeId, setActiveId] = useState(null)
  const { chartData, isRunning, alertVisible, alertData, startFeed, resetFeed, stats } = useSensorFeed(activeId)
  const BASELINE_TEMP = 60.5

  useEffect(() => {
    if (!activeId && machines.length > 0) {
      setActiveId(machines[0].id)
    }
  }, [activeId, machines])

  const activeStatus = stats?.drift_detected ? 'DRIFT' : (stats?.cusum_score > 4 ? 'WARN' : 'NORMAL')

  const liveMachines = machines.map(m =>
    m.id === activeId && isRunning ? { ...m, status: activeStatus } : m
  )

  const normalCount = liveMachines.filter(m => m.status === 'NORMAL').length
  const driftCount  = liveMachines.filter(m => m.status === 'DRIFT').length
  const warnCount   = liveMachines.filter(m => m.status === 'WARN').length
  const activeMachine = liveMachines.find(m => m.id === activeId) || null
  const latestRow   = chartData.length > 0 ? chartData[chartData.length - 1] : null
  const latestTemp  = latestRow ? Number(latestRow.temperature).toFixed(2) : '--'
  const latestVib   = latestRow ? Number(latestRow.vibration).toFixed(4) : '--'
  const latestCusum = typeof stats?.cusum_score === 'number' ? stats.cusum_score.toFixed(2) : '--'
  const driftSignal = stats?.drift_detected ? 'Detected' : (isRunning ? 'Monitoring' : 'Idle')
  const tempDelta   = latestRow ? (Number(latestRow.temperature) - BASELINE_TEMP).toFixed(2) : null
  const baselineHealth = activeMachine?.health ?? '--'

  return (
    <div className="flex flex-col h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>

      {/* ── KPI Stat Strip ──────────────────────────────────────────────── */}
      <div
        className="grid grid-cols-4 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', height: 72 }}
      >
        {[
          { label: 'Active Nodes',   value: machines.length, unit: 'machines',       color: 'var(--text-heading)', dot: null },
          { label: 'Healthy',        value: normalCount,      unit: 'no drift',       color: 'var(--accent-safe)',   dot: 'safe' },
          { label: 'Warning',        value: warnCount,        unit: 'monitor closely',color: 'var(--accent-warn)',   dot: 'warn' },
          { label: 'Drift Detected', value: driftCount,       unit: 'action needed',  color: 'var(--accent-critical)', dot: 'critical' },
        ].map((kpi, i) => (
          <div
            key={i}
            className="flex flex-col justify-center px-5"
            style={{
              borderRight: i < 3 ? '1px solid var(--border)' : 'none',
              background: i === 3 && driftCount > 0 ? 'var(--accent-critical-dim)' : 'var(--bg-panel)',
            }}
          >
            <div className="flex items-baseline gap-2">
              <span style={{ fontSize: 28, fontWeight: 700, color: kpi.color, fontFamily: 'JetBrains Mono', lineHeight: 1 }}>
                {kpi.value}
              </span>
              {kpi.dot && (
                <span
                  className="w-2 h-2 rounded-full"
                  style={{
                    background: kpi.dot === 'safe' ? 'var(--accent-safe)' : kpi.dot === 'warn' ? 'var(--accent-warn)' : 'var(--accent-critical)',
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-subtle)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {kpi.label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 gap-0">

        {/* Chart Panel */}
        <GfPanel
          className="flex-1"
          title={`${activeId || 'N/A'} — Live Sensor Feed`}
          subtitle="Temperature · Vibration · SCADA Threshold"
          controls={<FeedControls isRunning={isRunning} chartData={chartData} onStart={startFeed} onReset={resetFeed} />}
        >
          <div className="p-4 h-full flex flex-col gap-3">
            {chartData.length > 0 ? (
              <SensorChart data={chartData} height={250} />
            ) : (
              <div
                className="flex-1 flex items-center justify-center"
                style={{ color: 'var(--text-muted)', fontSize: 12, border: '1px dashed var(--border)', background: 'var(--bg-row)' }}
              >
                {isLoading ? 'Loading machines from database...' : 'Click "Start Factory Feed" to begin simulation'}
              </div>
            )}

            <div
              className="grid grid-cols-4 gap-2"
              style={{
                minHeight: 84,
              }}
            >
              {[
                { label: 'Latest Temp', value: latestTemp, unit: 'deg C', color: 'var(--chart-temp)' },
                { label: 'Latest Vib', value: latestVib, unit: 'mm/s', color: 'var(--chart-vib)' },
                { label: 'CUSUM', value: latestCusum, unit: 'score', color: 'var(--accent-warn)' },
                { label: 'Drift State', value: driftSignal, unit: 'agent 2', color: stats?.drift_detected ? 'var(--accent-critical)' : 'var(--accent-safe)' },
              ].map((card) => (
                <div
                  key={card.label}
                  className="px-3 py-2"
                  style={{
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-row-alt)',
                  }}
                >
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {card.label}
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: card.color, fontFamily: 'JetBrains Mono', marginTop: 2 }}>
                    {card.value}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-subtle)', marginTop: 1 }}>{card.unit}</div>
                </div>
              ))}
            </div>

            <div
              className="px-3 py-2"
              style={{
                border: '1px solid var(--border-subtle)',
                background: 'var(--bg-row)',
                fontSize: 11,
                color: 'var(--text-subtle)',
                fontFamily: 'JetBrains Mono',
              }}
            >
              Baseline Temp: {BASELINE_TEMP.toFixed(1)} deg C
              {'  |  '}
              Baseline Health: {baselineHealth}%
              {'  |  '}
              Temp Delta: {tempDelta === null ? '--' : `${tempDelta > 0 ? '+' : ''}${tempDelta}`} deg C
            </div>
          </div>
        </GfPanel>

        {/* Machine List Panel */}
        <div
          className="flex flex-col shrink-0"
          style={{ width: 280, borderLeft: '1px solid var(--border)' }}
        >
          {/* Panel header */}
          <div
            className="px-3 py-1.5 shrink-0"
            style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', minHeight: 32 }}
          >
            <span style={{ color: 'var(--text-heading)', fontWeight: 600, fontSize: 12 }}>Machine List</span>
            <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>Click · Double-click to drill in</span>
          </div>

          {/* Rows */}
          <div className="flex-1 overflow-y-auto">
            {/* Column headers */}
            <div
              className="grid px-3 py-1"
              style={{ gridTemplateColumns: '1fr auto', background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
            >
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Machine</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Status</span>
            </div>

            {liveMachines.map((m, idx) => (
              <div
                key={m.id}
                onClick={() => setActiveId(m.id)}
                onDoubleClick={() => navigate(`/machine/${m.id}`)}
                className="grid px-3 py-2 cursor-pointer transition-colors duration-100"
                style={{
                  gridTemplateColumns: '1fr auto',
                  alignItems: 'center',
                  background: m.id === activeId
                    ? 'rgba(87,148,242,0.1)'
                    : idx % 2 === 0 ? 'var(--bg-row)' : 'var(--bg-row-alt)',
                  borderBottom: '1px solid var(--border-subtle)',
                  borderLeft: m.id === activeId ? '2px solid var(--accent-info)' : '2px solid transparent',
                }}
              >
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text-heading)', fontWeight: 500 }}>{m.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono', marginTop: 1 }}>{m.id} · {m.line}</div>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>

          {/* Alert slot */}
          {alertVisible && alertData && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <AlertCard alert={alertData} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
