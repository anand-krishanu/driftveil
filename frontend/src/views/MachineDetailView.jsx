import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { AlertCard } from '../components/alerts/AlertCard'
import { CustomTooltip } from '../components/charts/CustomTooltip'
import { useSensorFeed } from '../hooks/useSensorFeed'
import { useMachines } from '../hooks/useMachines'
import { useMachineHistory } from '../hooks/useMachineHistory'

import { ChatPanel } from '../components/chat/ChatPanel'

const TABS = ['Overview', 'Sensor History', 'Agent Trace', 'Maintenance Log', 'What-If Sim', 'Ask AI']
const SCADA_THRESHOLD = 100

const MAINTENANCE_LOG = [
  { date: '27 Feb 2026', type: 'Scheduled',  tech: 'R. Sharma',  action: 'Full lubrication service. Bearing check passed.', result: 'PASS' },
  { date: '12 Jan 2026', type: 'Predictive', tech: 'A. Mehta',   action: 'DriftVeil alert DV-2024-0712. Replaced seal gasket.', result: 'FIXED' },
  { date: '04 Dec 2025', type: 'Emergency',  tech: 'R. Sharma',  action: 'Unplanned stoppage. Motor overheated. Replaced fan belt.', result: 'REPAIRED' },
  { date: '01 Nov 2025', type: 'Scheduled',  tech: 'P. Verma',   action: 'Quarterly inspection. All parameters nominal.', result: 'PASS' },
]

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
function OverviewTab({ machine, history, alertData, stats, chartData }) {
  const liveCusum = stats?.cusum_score ?? machine.cusum
  const liveTemp  = chartData?.length > 0 ? chartData[chartData.length - 1].temperature.toFixed(2) : machine.temp
  const liveVib   = chartData?.length > 0 ? chartData[chartData.length - 1].vibration.toFixed(3) : machine.vib

  return (
    <div className="flex flex-col h-full">
      {/* KPI strip */}
      <div className="grid grid-cols-5 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
        <StatCell label="Health Score" value={`${machine.health}%`} color={machine.health >= 90 ? 'var(--accent-safe)' : machine.health >= 75 ? 'var(--accent-warn)' : 'var(--accent-critical)'} border />
        <StatCell label="Temperature" value={`${liveTemp}°C`} color={liveCusum > 10 ? 'var(--accent-warn)' : 'var(--text-heading)'} sub="Current reading" border />
        <StatCell label="Vibration" value={`${liveVib}`} color={liveCusum > 10 ? 'var(--accent-warn)' : 'var(--text-heading)'} sub="mm/s" border />
        <StatCell label="CUSUM Score" value={liveCusum.toFixed(1)} color={liveCusum > 10 ? 'var(--accent-critical)' : liveCusum > 4 ? 'var(--accent-warn)' : 'var(--accent-safe)'} sub={liveCusum > 10 ? 'DRIFT CONFIRMED' : 'Within range'} border />
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
          <PanelHeader title="30-Day Sensor Trend" sub="Temperature & Vibration · SCADA threshold overlay" />
          <div className="flex-1 p-4">
            <GfChart data={history.slice(-60)} height={240} showCusum={false} />
          </div>
          {alertData && (
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <AlertCard alert={alertData} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sensor History Tab ────────────────────────────────────────────────────────
function SensorHistoryTab({ machine, history }) {
  return (
    <div className="flex flex-col h-full p-0 gap-0">
      <div className="flex-1 flex flex-col" style={{ borderBottom: '1px solid var(--border)' }}>
        <PanelHeader title={`${machine.id} — Full Sensor History (120 Days)`} sub="Temperature and Vibration vs SCADA threshold" />
        <div className="flex-1 p-4">
          <GfChart data={history} height={260} showCusum={false} />
        </div>
      </div>
      <div className="flex flex-col" style={{ height: 220 }}>
        <PanelHeader title="CUSUM Score History" sub="Signal triggered when S_t > 10" />
        <div className="flex-1 p-4">
          <GfChart data={history} height={150} showCusum={true} />
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
      num: '2', label: 'Detection Math Engine', color: 'var(--accent-warn)', status: 'completed',
      body: `> CUSUM Score: ${stats.cusum_score}\n> Temperature Slope: ${stats.slope_temp}°C/t\n> Vibration Slope: ${stats.slope_vib}\n\n[DRIFT CONFIRMED OVER THRESHOLD]\nInvoking multi-agent pipeline.`,
    },
    (stats?.drift_detected || diagnosisRaw) && {
      num: '3', label: 'Root Cause (Claude 3.5)', color: 'var(--accent-critical)', status: diagnosisRaw ? 'completed' : 'running',
      body: diagnosisRaw || 'Processing 15 rows of sensor data.\nChecking MCP for fingerprint matches...',
      pulse: !diagnosisRaw,
    },
    (alertData || diagnosisRaw) && {
      num: '4', label: 'Explainer & Formatter', color: 'var(--accent-safe)', status: alertData ? 'completed' : 'running',
      body: alertData ? 'JSON Alert Card published.' : 'Translating raw diagnosis to JSON struct...',
    },
  ].filter(Boolean)

  return (
    <div className="flex flex-col h-full overflow-y-auto" style={{ background: 'var(--bg-base)' }}>
      <div
        className="px-4 py-2 flex items-center gap-2 shrink-0"
        style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)' }}>Live AWS Strands Agent Execution</span>
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

// ── Maintenance Log Tab ───────────────────────────────────────────────────────
function MaintenanceLogTab() {
  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Column headers */}
      <div
        className="grid px-4 py-2 shrink-0"
        style={{
          gridTemplateColumns: '110px 100px 130px 1fr 70px',
          background: 'var(--bg-header)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        {['Date', 'Type', 'Technician', 'Action Taken', 'Result'].map(h => (
          <span key={h} style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', fontWeight: 600 }}>
            {h}
          </span>
        ))}
      </div>
      {MAINTENANCE_LOG.map((log, i) => {
        const resultColor = log.result === 'PASS' ? 'var(--accent-safe)' : log.result === 'FIXED' ? 'var(--accent-warn)' : 'var(--accent-critical)'
        return (
          <div
            key={i}
            className="grid px-4 py-2.5"
            style={{
              gridTemplateColumns: '110px 100px 130px 1fr 70px',
              alignItems: 'center',
              borderBottom: '1px solid var(--border-subtle)',
              background: i % 2 === 0 ? 'var(--bg-row)' : 'var(--bg-row-alt)',
            }}
          >
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-body)' }}>{log.date}</span>
            <span style={{
              fontSize: 11, fontWeight: 600,
              color: log.type === 'Emergency' ? 'var(--accent-critical)' : log.type === 'Predictive' ? 'var(--accent-warn)' : 'var(--text-subtle)',
            }}>
              {log.type}
            </span>
            <span style={{ fontSize: 12, color: 'var(--text-body)' }}>{log.tech}</span>
            <span style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.5 }}>{log.action}</span>
            <span style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
              color: resultColor, border: `1px solid ${resultColor}`,
              padding: '1px 6px', display: 'inline-block',
            }}>
              {log.result}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── What-If Sim Tab ───────────────────────────────────────────────────────────
function WhatIfTab() {
  const [delay, setDelay] = useState(0)
  const [lubFreq, setLubFreq] = useState(30)
  const [result, setResult] = useState(null)

  function runSim() {
    const projection  = Math.max(1, 9 - delay * 0.6 + (30 - lubFreq) * 0.15)
    const efficiency  = Math.max(70, 100 - delay * 2.1)
    const failureProb = Math.min(99, 20 + delay * 6 + (lubFreq - 30) * 0.5)
    setResult({ projection: projection.toFixed(1), efficiency: efficiency.toFixed(1), failureProb: failureProb.toFixed(0) })
  }

  return (
    <div className="flex h-full">
      {/* Controls */}
      <div
        className="flex flex-col shrink-0"
        style={{ width: 300, borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}
      >
        <PanelHeader title="Simulation Parameters" sub="Adjust and run" />
        <div className="p-5 flex flex-col gap-6">
          {[
            { label: 'Delay Maintenance (days)', min: 0, max: 14, val: delay, set: setDelay, danger: delay > 5 },
            { label: 'Lubrication Interval (days)', min: 7, max: 60, val: lubFreq, set: setLubFreq, danger: lubFreq > 45 },
          ].map(({ label, min, max, val, set, danger }) => (
            <div key={label}>
              <div className="flex justify-between mb-2">
                <span style={{ fontSize: 11, color: 'var(--text-subtle)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</span>
                <span style={{ fontSize: 14, fontFamily: 'JetBrains Mono', fontWeight: 700, color: danger ? 'var(--accent-critical)' : 'var(--text-heading)' }}>{val}</span>
              </div>
              <input
                type="range" min={min} max={max} value={val}
                onChange={e => set(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--accent-info)', cursor: 'ew-resize' }}
              />
            </div>
          ))}
          <div className="flex gap-2 mt-2">
            <button
              onClick={runSim}
              style={{
                flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 600,
                border: '1px solid var(--accent-info)', color: 'var(--accent-info)', background: 'var(--accent-info-dim)', cursor: 'pointer',
              }}
            >
              ▶ Run Simulation
            </button>
            <button
              onClick={() => { setResult(null); setDelay(0); setLubFreq(30) }}
              style={{
                padding: '6px 14px', fontSize: 11,
                border: '1px solid var(--border)', color: 'var(--text-subtle)', background: 'transparent', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 flex flex-col">
        {!result ? (
          <div className="flex items-center justify-center h-full" style={{ color: 'var(--text-muted)', fontSize: 12 }}>
            Adjust parameters and click "Run Simulation" to project outcome.
          </div>
        ) : (
          <div className="flex flex-col gap-0">
            <PanelHeader title="Simulation Result" />
            <div className="grid grid-cols-3" style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { label: 'Days to Failure',  value: `${result.projection}d`, color: result.projection < 5 ? 'var(--accent-critical)' : result.projection < 9 ? 'var(--accent-warn)' : 'var(--accent-safe)' },
                { label: 'Efficiency',       value: `${result.efficiency}%`, color: Number(result.efficiency) < 85 ? 'var(--accent-warn)' : 'var(--accent-safe)' },
                { label: 'Failure Prob.',    value: `${result.failureProb}%`, color: Number(result.failureProb) > 60 ? 'var(--accent-critical)' : Number(result.failureProb) > 35 ? 'var(--accent-warn)' : 'var(--accent-safe)' },
              ].map(({ label, value, color }, i) => (
                <div key={label} style={{ padding: '16px 20px', borderRight: i < 2 ? '1px solid var(--border)' : 'none', background: 'var(--bg-panel)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 700, color, fontFamily: 'JetBrains Mono', marginTop: 4 }}>{value}</div>
                </div>
              ))}
            </div>
            <div
              style={{
                padding: '16px 20px',
                borderLeft: Number(result.failureProb) > 50 ? '3px solid var(--accent-critical)' : '3px solid var(--accent-safe)',
                background: 'var(--bg-row)',
                margin: 0,
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                AI Agent Recommendation
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.7 }}>
                {Number(result.failureProb) > 60
                  ? `Delaying maintenance by ${delay} days is high risk. Failure probability exceeds 60%. Immediate scheduling is strongly advised.`
                  : Number(result.failureProb) > 35
                  ? `A ${delay}-day delay is manageable but increases risk. Schedule within ${Math.max(1, result.projection - 3)} days.`
                  : `Parameters within acceptable range. Schedule maintenance within ${result.projection} days.`
                }
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function MachineDetailView() {
  const { machineId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const { machines, isLoading: machinesLoading } = useMachines()
  const { history } = useMachineHistory(machineId, 200)
  const { alertData, stats, diagnosisRaw, chartData, isRunning, startFeed } = useSensorFeed(machineId)

  const machine = machines.find(m => m.id === machineId)
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
      <div className="flex-1 min-h-0 overflow-auto">
        {activeTab === 'Overview'        && <OverviewTab machine={machine} history={history} alertData={alertData} stats={stats} chartData={chartData} />}
        {activeTab === 'Sensor History'  && <SensorHistoryTab machine={machine} history={history} />}
        {activeTab === 'Agent Trace'     && <AgentTraceTab alertData={alertData} stats={stats} diagnosisRaw={diagnosisRaw} />}
        {activeTab === 'Maintenance Log' && <MaintenanceLogTab />}
        {activeTab === 'What-If Sim'     && <WhatIfTab machine={machine} />}
        {activeTab === 'Ask AI'          && <ChatPanel machineId={machineId} stats={stats} />}
      </div>
    </div>
  )
}
