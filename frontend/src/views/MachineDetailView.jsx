import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { AlertCard } from '../components/alerts/AlertCard'
import { CustomTooltip } from '../components/charts/CustomTooltip'
import { SensorChart } from '../components/charts/SensorChart'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { useMachines } from '../hooks/useMachines'
import { useMachineHistory } from '../hooks/useMachineHistory'

import { ChatPanel } from '../components/chat/ChatPanel'

const TABS = ['Agent Trace', 'Ask AI']
const SCADA_THRESHOLD = 100



// ── Shared panel header ──────────────────────────────────────────────────────
function PanelHeader({ title, sub }) {
  return (
    <div
      className="flex items-center gap-3 px-4 py-1.5 shrink-0"
      style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', minHeight: 32 }}
    >
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

// ── Stat cell for overview KPI row ───────────────────────────────────────────
function StatCell({ label, value, color, sub, border }) {
  return (
    <div
      className="flex flex-col justify-center px-5"
      style={{
        borderRight: border ? '1px solid var(--border)' : 'none',
        background: 'var(--bg-panel)',
        minHeight: 68,
      }}
    >
      <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700, fontFamily: 'JetBrains Mono', color: color || 'var(--text-heading)', lineHeight: 1.2, marginTop: 2 }}>
        {value}
      </span>
      {sub && <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{sub}</span>}
    </div>
  )
}

// ── Shared chart container ────────────────────────────────────────────────────
function GfChart({ data, height, showCusum }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 16, bottom: 4, left: 0 }}>
        <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
        <XAxis dataKey="label" tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={{ stroke: 'var(--border)' }} interval={14} />
        <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={32} />
        <Tooltip content={<CustomTooltip />} />
        {!showCusum && (
          <ReferenceLine y={SCADA_THRESHOLD} stroke="var(--accent-critical)" strokeDasharray="6 3" strokeWidth={1}
            label={{ value: 'SCADA', fill: 'var(--accent-critical)', fontSize: 9, fontFamily: 'JetBrains Mono', position: 'insideTopRight' }}
          />
        )}
        {showCusum
          ? <Line type="monotone" dataKey="cusum" name="CUSUM Score" stroke="var(--accent-warn)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
          : <>
              <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="var(--chart-temp)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="vibration" name="Vibration (mm/s)" stroke="var(--chart-vib)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </>
        }
      </LineChart>
    </ResponsiveContainer>
  )
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ machine, history, alertData, stats, chartData, onEscalate, onAcknowledge }) {
  const liveCusum = stats?.cusum_score ?? machine.cusum ?? 0
  const lastPoint = chartData?.length > 0 ? chartData[chartData.length - 1] : null
  const liveTemp  = lastPoint?.temperature != null ? Number(lastPoint.temperature).toFixed(2) : (machine.temp ?? '--')
  const liveVib   = lastPoint?.vibration   != null ? Number(lastPoint.vibration).toFixed(3)   : (machine.vib  ?? '--')
  const cusumDisplay = typeof liveCusum === 'number' ? liveCusum.toFixed(1) : '--'

  return (
    <div className="flex flex-col h-full">
      {/* KPI strip */}
      <div className="grid grid-cols-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <StatCell label="Health Score" value={`${machine.health}%`} color={machine.health >= 90 ? 'var(--accent-safe)' : machine.health >= 75 ? 'var(--accent-warn)' : 'var(--accent-critical)'} border />
        <StatCell label="Temperature" value={`${liveTemp}°C`} color={liveCusum > 10 ? 'var(--accent-warn)' : 'var(--text-heading)'} sub="Current reading" border />
        <StatCell label="Vibration" value={`${liveVib}`} color={liveCusum > 10 ? 'var(--accent-warn)' : 'var(--text-heading)'} sub="mm/s" border />
        <StatCell label="CUSUM Score" value={cusumDisplay} color={liveCusum > 10 ? 'var(--accent-critical)' : liveCusum > 4 ? 'var(--accent-warn)' : 'var(--accent-safe)'} sub={liveCusum > 10 ? 'DRIFT CONFIRMED' : 'Within range'} border />
        <StatCell label="Est. Runtime" value={machine.runtime} sub="Since last service" />
      </div>

      {/* Content */}
      <div className="flex flex-1 min-h-0">
        {/* Info panel */}
        <div className="flex flex-col shrink-0" style={{ width: 220, borderRight: '1px solid var(--border)' }}>
          <PanelHeader title="Machine Info" />
          <div className="flex flex-col p-0 overflow-y-auto">
            {[
              ['Machine ID',       machine.id],
              ['Name',             machine.name],
              ['Production Line',  machine.line],
              ['Location',         machine.location],
              ['Last Maintenance', machine.lastMaintenance],
              ['Total Runtime',    machine.runtime],
            ].map(([label, value], i) => (
              <div
                key={label}
                style={{
                  padding: '8px 16px',
                  borderBottom: '1px solid var(--border-subtle)',
                  background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                <div style={{ fontSize: 12, color: 'var(--text-heading)', fontWeight: 500, marginTop: 2 }}>{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="flex flex-col flex-1 min-w-0">
          <PanelHeader title="Live High-Frequency Telemetry Stream" sub="Temperature & Vibration · SCADA threshold overlay" />
          <div className="flex-1 p-4">
            <SensorChart data={chartData?.length > 0 ? chartData : history.slice(-60)} height={340} />
          </div>
          {alertData && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <AlertCard alert={alertData} onEscalate={onEscalate} onAcknowledge={onAcknowledge} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}



// ── Agent Trace Tab ───────────────────────────────────────────────────────────
function AgentTraceTab({ alertData, stats, diagnosisRaw }) {
  if (!stats && !alertData) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
        Waiting for pipeline to trigger — requires simulated drift.
      </div>
    )
  }

  const blocks = [
    stats && {
      num: '1', label: 'Statistical Drift Detection', color: 'var(--accent-warn)', status: 'completed',
      body: `> CUSUM Score: ${stats.cusum_score?.toFixed(2) ?? '--'}\n> Temperature Slope: ${stats.slope_temp?.toFixed(2) ?? '--'}°C/t\n> Vibration Slope: ${stats.slope_vib?.toFixed(4) ?? '--'}\n\n[DRIFT CONFIRMED OVER THRESHOLD]\nTriggering AI Root Cause Analysis.`,
    },
    (stats?.drift_detected || diagnosisRaw) && {
      num: '2', label: 'Root Cause Analysis (AI)', color: 'var(--accent-critical)', status: diagnosisRaw ? 'completed' : 'running',
      body: diagnosisRaw || 'Cross-referencing telemetry with known failure signatures...\nAnalyzing historical maintenance logs...',
      pulse: !diagnosisRaw,
    },
    (alertData || diagnosisRaw) && {
      num: '3', label: 'SOP & Mitigation Protocol', color: 'var(--accent-safe)', status: alertData ? 'completed' : 'running',
      body: alertData ? `> Prescribed Action: ${alertData.action}\n> Impact: Failure estimated in ${alertData.eta}\n> Confidence: ${alertData.confidence}` : 'Generating mitigation protocols based on equipment manuals...',
    },
  ].filter(Boolean)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div
        className="px-4 py-2 flex items-center gap-2 shrink-0"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>Live AI Diagnostic Trace</span>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>System Event Log</span>
      </div>
      {blocks.map((b, i) => (
        <div key={i} style={{ borderBottom: '1px solid var(--border)' }}>
          <div
            className="flex items-center justify-between px-4 py-2"
            style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border-subtle)' }}
          >
            <div className="flex items-center gap-2">
              <span
                style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: b.color, color: '#111',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, fontWeight: 700, flexShrink: 0,
                }}
              >
                {b.num}
              </span>
              <span style={{ fontSize: 11, fontWeight: 700, color: b.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {b.label}
              </span>
            </div>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: b.status === 'completed' ? 'var(--accent-safe)' : 'var(--accent-warn)' }}>
              {b.status === 'running' ? '● running' : '✓ done'}
            </span>
          </div>
          <pre
            className={b.pulse ? 'animate-pulse' : ''}
            style={{
              margin: 0, padding: '10px 16px',
              fontSize: 11, fontFamily: 'JetBrains Mono',
              whiteSpace: 'pre-wrap', lineHeight: 1.7,
              color: 'var(--text-body)',
              background: 'var(--bg-row)',
            }}
          >
            {b.body}
          </pre>
        </div>
      ))}
    </div>
  )
}



// ── Main Component ─────────────────────────────────────────────────────────────
export function MachineDetailView() {
  const { machineId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Agent Trace')
  const { machines, isLoading: machinesLoading } = useMachines()
  const { history } = useMachineHistory(machineId, 200)
  const { 
    activeMachineId, setActiveMachineId,
    alertData, stats, diagnosisRaw, chartData, isRunning, startFeed, clearAlert
  } = useSensorFeed()

  useEffect(() => {
    if (machineId && activeMachineId !== machineId) {
      setActiveMachineId(machineId)
    }
  }, [machineId, activeMachineId, setActiveMachineId])

  const machine = machines.find(m => m.id === machineId)

  const handleEscalate = () => {
    window.alert(`🚨 Alert escalated for ${machine?.name ?? machineId}. Maintenance team has been notified.`)
    clearAlert()
  }

  const handleAcknowledge = () => {
    clearAlert()
  }
  if (machinesLoading) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Loading machine from database...
      </div>
    )
  }

  if (!machine) {
    return (
      <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Machine not found. <button onClick={() => navigate('/')} style={{ marginLeft: 8, color: 'var(--accent-info)', background: 'none', border: 'none', cursor: 'pointer' }}>← Back</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>

      {/* Page header */}
      <div
        className="flex items-center justify-between px-4 py-2 shrink-0"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)', height: 44 }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            style={{ background: 'none', border: 'none', color: 'var(--text-subtle)', cursor: 'pointer', fontSize: 12, padding: 0 }}
          >
            ← Back
          </button>
          <span style={{ color: 'var(--border)' }}>|</span>
          <div>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{machine.name}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8, fontFamily: 'JetBrains Mono' }}>
              {machine.id} · {machine.line} · {machine.location}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {!isRunning && (
            <button 
              onClick={startFeed} 
              style={{ background: 'var(--accent-info)', color: '#fff', border: 'none', padding: '6px 12px', fontSize: 11, fontWeight: 600, borderRadius: 4, cursor: 'pointer' }}
            >
              ▶ Start Feed
            </button>
          )}
          <HealthBar value={machine.health - (stats?.cusum_score > 10 ? 15 : 0)} />
          <StatusBadge status={stats?.drift_detected ? 'DRIFT' : (stats?.cusum_score > 4 ? 'WARN' : machine.status)} />
        </div>
      </div>

      {/* Split Pane Layout */}
      <div className="flex flex-1 min-h-0">
        
        {/* LEFT PANE: Always visible Dashboard (Chart + Info) */}
        <div className="flex flex-col flex-1 min-w-0" style={{ borderRight: '1px solid var(--border)' }}>
          <OverviewTab machine={machine} history={history} alertData={alertData} stats={stats} chartData={chartData} onEscalate={handleEscalate} onAcknowledge={handleAcknowledge} />
        </div>

        {/* RIGHT PANE: AI Tools */}
        <div className="flex flex-col shrink-0" style={{ width: 440, background: 'var(--bg-panel)' }}>
          {/* Tab bar */}
          <div
            className="flex shrink-0"
            style={{ background: 'var(--bg-header)', borderBottom: '2px solid var(--border)' }}
          >
            {TABS.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 500,
                  border: 'none',
                  borderBottom: activeTab === tab ? '2px solid var(--accent-info)' : '2px solid transparent',
                  background: activeTab === tab ? 'rgba(87,148,242,0.08)' : 'transparent',
                  color: activeTab === tab ? 'var(--text-heading)' : 'var(--text-subtle)',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                  marginBottom: -2,
                  position: 'relative'
                }}
              >
                {tab}
                {tab === 'Ask AI' && stats?.cusum_score > 4 && (
                  <span style={{position:'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-info)'}} />
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
            {activeTab === 'Agent Trace'     && <AgentTraceTab alertData={alertData} stats={stats} diagnosisRaw={diagnosisRaw} />}
            {activeTab === 'Ask AI'          && <ChatPanel machineId={machineId} stats={stats} />}
          </div>
        </div>
      </div>
    </div>
  )
}
