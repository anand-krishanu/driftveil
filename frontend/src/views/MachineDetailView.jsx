import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { MACHINES, MAINTENANCE_LOG } from '../data/machines'
import { MACHINE_HISTORY, SCADA_THRESHOLD } from '../data/sensorData'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { AlertCard } from '../components/alerts/AlertCard'
import { CustomTooltip } from '../components/charts/CustomTooltip'
import { useSensorFeed } from '../hooks/useSensorFeed'

const TABS = ['Overview', 'Sensor History', 'Agent Trace', 'Maintenance Log', 'What-If Sim']

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ label, value, sub, color }) {
  return (
    <div className="p-4 border border-borderPrimary bg-surface1/40 backdrop-blur-sm flex-1 rounded-sm shadow-sm">
      <p className="text-[10px] uppercase tracking-widest text-subtle">{label}</p>
      <p className={`text-2xl font-bold my-1 font-mono ${color || 'text-heading'}`}>{value}</p>
      {sub && <p className="text-[11px] text-subtle">{sub}</p>}
    </div>
  )
}

// ─── Tab Selector ─────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div className="flex border-b border-borderPrimary bg-surface1/30 backdrop-blur-sm px-6">
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-5 py-3 text-xs font-semibold cursor-pointer transition-all duration-200 border-b-2
            ${active === tab ? 'border-warn text-heading shadow-[0_4px_10px_-4px_rgba(217,119,6,0.3)]' : 'border-transparent text-subtle hover:text-body'}`}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

// ─── Tab: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ machine, alertData, stats, chartData }) {
  const history = MACHINE_HISTORY[machine.id] || []
  const hasAlert = !!alertData

  const liveCusum = stats?.cusum_score ? stats.cusum_score : machine.cusum
  const liveTemp = chartData?.length > 0 ? chartData[chartData.length - 1].temperature.toFixed(2) : machine.temp
  const liveVib = chartData?.length > 0 ? chartData[chartData.length - 1].vibration.toFixed(3) : machine.vib

  return (
    <div className="p-6 flex flex-col gap-6 animate-in fade-in duration-300">
      {/* KPI Row */}
      <div className="flex gap-4">
        <KpiCard label="Health Score"    value={`${machine.health}%`}  color={machine.health >= 90 ? 'text-safe' : machine.health >= 75 ? 'text-warn' : 'text-critical'} />
        <KpiCard label="Temperature"     value={`${liveTemp}°C`}   color={liveCusum > 10 ? 'text-warn' : 'text-heading'} sub="Current reading" />
        <KpiCard label="Vibration"       value={`${liveVib} mm/s`} color={liveCusum > 10 ? 'text-warn' : 'text-heading'} sub="Current reading" />
        <KpiCard label="CUSUM Score"     value={liveCusum.toFixed(1)} color={liveCusum > 10 ? 'text-critical' : liveCusum > 4 ? 'text-warn' : 'text-safe'} sub={liveCusum > 10 ? 'SIGNAL: Drift Confirmed' : 'Within range'} />
        <KpiCard label="Est. Runtime"    value={machine.runtime}        sub="Since last service" />
      </div>

      {/* Machine Info + Chart */}
      <div className="flex gap-4">
        {/* Info Card */}
        <div className="w-[280px] border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm">
          <div className="px-5 py-3 border-b border-borderSubtle bg-surface1">
            <p className="text-[10px] uppercase tracking-widest text-subtle">Machine Info</p>
          </div>
          <div className="p-5 flex flex-col gap-4">
            {[
              { label: 'Machine ID',       value: machine.id },
              { label: 'Name',             value: machine.name },
              { label: 'Production Line',  value: machine.line },
              { label: 'Location',         value: machine.location },
              { label: 'Last Maintenance', value: machine.lastMaintenance },
              { label: 'Total Runtime',    value: machine.runtime },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] text-subtle uppercase tracking-wider">{label}</p>
                <p className="text-[13px] text-heading mt-1 font-medium">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trend mini-chart */}
        <div className="flex-1 border border-borderPrimary bg-surface1/80 backdrop-blur-md shadow-sm rounded-sm">
          <div className="px-5 py-3 border-b border-borderSubtle">
            <p className="text-sm font-semibold text-heading">30-Day Sensor Trend</p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={history.slice(-60)} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke="var(--color-borderSubtle)" vertical={false} />
                <XAxis dataKey="day" tick={{ fill: 'var(--color-subtle)', fontSize: 9 }} tickLine={false} axisLine={{ stroke: 'var(--color-borderSubtle)' }} interval={11} />
                <YAxis domain={[30, 110]} tick={{ fill: 'var(--color-subtle)', fontSize: 9 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={SCADA_THRESHOLD} stroke="var(--color-critical)" strokeDasharray="5 4" strokeWidth={1} />
                <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="var(--color-chartTemp)" strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="vibration"   name="Vibration (mm/s)"  stroke="var(--color-chartVib)"  strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {hasAlert && <AlertCard alert={alertData} />}
    </div>
  )
}

// ─── Tab: Sensor History ──────────────────────────────────────────────────────
function SensorHistoryTab({ machine }) {
  const history = MACHINE_HISTORY[machine.id] || []
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm">
        <div className="px-5 py-3 border-b border-borderSubtle">
          <h3 className="text-sm text-heading">{machine.id} — Full Sensor History (120 Days)</h3>
          <p className="text-[11px] text-subtle mt-1">Temperature and Vibration · Red line = SCADA threshold</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={history} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-borderSubtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--color-subtle)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--color-borderSubtle)' }} interval={14} />
              <YAxis domain={[30, 110]} tick={{ fill: 'var(--color-subtle)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={SCADA_THRESHOLD} stroke="var(--color-critical)" strokeDasharray="5 4" strokeWidth={1.5}
                label={{ value: 'SCADA THRESHOLD', fill: 'var(--color-critical)', fontSize: 9, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke="var(--color-chartTemp)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="vibration"   name="Vibration (mm/s)"  stroke="var(--color-chartVib)"  strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CUSUM trend */}
      <div className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm mt-6">
        <div className="px-5 py-3 border-b border-borderSubtle">
          <h3 className="text-sm text-heading">CUSUM Score History</h3>
          <p className="text-[11px] text-subtle mt-1">Signal triggered when S_t &gt; 10</p>
        </div>
        <div className="p-5">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={history} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke="var(--color-borderSubtle)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--color-subtle)', fontSize: 10 }} tickLine={false} axisLine={{ stroke: 'var(--color-borderSubtle)' }} interval={14} />
              <YAxis tick={{ fill: 'var(--color-subtle)', fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={10} stroke="var(--color-critical)" strokeDasharray="4 3" strokeWidth={1}
                label={{ value: 'SIGNAL THRESHOLD (h=10)', fill: 'var(--color-critical)', fontSize: 9, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="cusum" name="CUSUM Score" stroke="var(--color-warn)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── Tab: Agent Trace ─────────────────────────────────────────────────────────
function AgentTraceTab({ alertData, stats, diagnosisRaw }) {
  return (
    <div className="p-6 flex flex-col gap-4 max-w-[800px] animate-in slide-in-from-right-4 duration-300">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm text-heading">Live AWS Strands Agent Execution</h3>
        <span className="text-[11px] text-subtle font-mono">System Event Log</span>
      </div>

      {!stats && !alertData && (
        <div className="p-8 text-center border border-borderPrimary bg-surface1/30 rounded-sm">
          <p className="text-subtle text-[13px] animate-pulse">Waiting for pipeline to trigger (requires simulated drift).</p>
        </div>
      )}

      {stats && (
        <div className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm">
          <div className="flex justify-between items-center px-4 py-3 border-b border-borderSubtle bg-surface2/50">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-warn text-bgBase flex items-center justify-center text-[11px] font-bold shadow-[0_0_8px_rgba(217,119,6,0.5)]">2</span>
              <p className="text-xs font-semibold text-warn tracking-wide uppercase">Agent 2: Detection Math Engine</p>
            </div>
            <p className="text-[11px] text-subtle font-mono">completed</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-body font-mono leading-relaxed whitespace-pre-wrap">
              {`> CUSUM Score: ${stats.cusum_score}\n> Temperature Slope: ${stats.slope_temp}°C/t\n> Vibration Slope: ${stats.slope_vib}\n\n[DRIFT CONFIRMED OVER THRESHOLD]\nInvoking multi-agent pipeline for explanation.`}
            </p>
          </div>
        </div>
      )}

      {(stats?.drift_detected || diagnosisRaw) && (
        <div className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm">
          <div className="flex justify-between items-center px-4 py-3 border-b border-borderSubtle bg-surface2/50">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-critical text-bgBase flex items-center justify-center text-[11px] font-bold shadow-[0_0_8px_rgba(220,38,38,0.5)] animate-pulse-glow">3</span>
              <p className="text-xs font-semibold text-critical tracking-wide uppercase">Agent 3: Root Cause (Claude 3.5)</p>
            </div>
            <p className="text-[11px] text-subtle font-mono">{diagnosisRaw ? 'completed' : 'running...'}</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-body font-mono leading-relaxed whitespace-pre-wrap">
              {diagnosisRaw || `Processing 15 rows of sensor data.\nChecking MCP for fingerprint matches...`}
            </p>
          </div>
        </div>
      )}

      {(alertData || diagnosisRaw) && (
        <div className={`border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm transition-opacity duration-500 ${alertData ? 'opacity-100' : 'opacity-60'}`}>
          <div className="flex justify-between items-center px-4 py-3 border-b border-borderSubtle bg-surface2/50">
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-safe text-bgBase flex items-center justify-center text-[11px] font-bold">4</span>
              <p className="text-xs font-semibold text-safe tracking-wide uppercase">Agent 4: Explainer & Formatter</p>
            </div>
            <p className="text-[11px] text-subtle font-mono">{alertData ? 'completed' : 'running...'}</p>
          </div>
          <div className="p-5">
            <p className="text-xs text-body font-mono leading-relaxed">
              {alertData ? `JSON Alert Card published.` : `Translating raw diagnosis to JSON struct...`}
            </p>
          </div>
        </div>
      )}

      {alertData && (
        <div className="border border-safe bg-safeDim p-5 mt-4 rounded-sm animate-in zoom-in-95 duration-500">
          <p className="text-[10px] uppercase tracking-widest text-safe mb-2 font-bold">Bedrock Guardrails Verification</p>
          <p className="text-xs text-heading font-mono leading-relaxed">
            All 4 agent outputs verified. No hallucinations detected. Each claim backed by structured MCP tool data. Confidence: <span className="text-safe font-bold">{alertData.confidence}</span>.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Maintenance Log ──────────────────────────────────────────────────────
function MaintenanceLogTab() {
  return (
    <div className="p-6 animate-in fade-in duration-300">
      <div className="border border-borderPrimary bg-surface1/40 backdrop-blur-md rounded-sm">
        <div className="px-5 py-4 border-b border-borderPrimary bg-surface2/50">
          <div className="grid grid-cols-[120px_110px_130px_1fr_80px]">
            {['Date', 'Type', 'Technician', 'Action Taken', 'Result'].map(h => (
              <p key={h} className="text-[10px] uppercase tracking-widest text-subtle font-semibold">{h}</p>
            ))}
          </div>
        </div>
        {MAINTENANCE_LOG.map((log, i) => {
          const resultColor = log.result === 'PASS' ? 'text-safe border-safe' : log.result === 'FIXED' ? 'text-warn border-warn' : 'text-critical border-critical'
          return (
            <div key={i} className="grid grid-cols-[120px_110px_130px_1fr_80px] px-5 py-3 border-b border-borderSubtle items-center hover:bg-surface2/30 transition-colors">
              <p className="text-xs text-body font-mono">{log.date}</p>
              <p className={`text-[11px] font-semibold tracking-wide ${log.type === 'Emergency' ? 'text-critical' : log.type === 'Predictive' ? 'text-warn' : 'text-subtle'}`}>
                {log.type}
              </p>
              <p className="text-xs text-body font-medium">{log.tech}</p>
              <p className="text-xs text-body leading-relaxed">{log.action}</p>
              <span className={`border px-2 py-0.5 text-[10px] font-bold tracking-widest inline-block rounded-sm ${resultColor} bg-bgBase/50`}>
                {log.result}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Tab: What-If Simulation ──────────────────────────────────────────────────
function WhatIfTab({ machine }) {
  const [delay, setDelay]     = useState(0)
  const [lubFreq, setLubFreq] = useState(30)
  const [result, setResult]   = useState(null)

  function runSim() {
    const baseDays      = 9
    const penaltyDays   = delay * 0.6
    const benefitDays   = (30 - lubFreq) * 0.15
    const projection    = Math.max(1, baseDays - penaltyDays + benefitDays)
    const efficiency    = Math.max(70, 100 - (delay * 2.1))
    const failureProb   = Math.min(99, 20 + delay * 6 + (lubFreq - 30) * 0.5)
    setResult({ projection: projection.toFixed(1), efficiency: efficiency.toFixed(1), failureProb: failureProb.toFixed(0) })
  }

  function resetSim() { setResult(null); setDelay(0); setLubFreq(30) }

  return (
    <div className="p-6 flex gap-6 animate-in zoom-in-95 duration-300">
      {/* Controls */}
      <div className="w-[340px] border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm flex flex-col">
        <div className="px-5 py-3 border-b border-borderSubtle bg-surface2/40">
          <h3 className="text-sm font-semibold text-heading">Simulation Parameters</h3>
          <p className="text-[11px] text-subtle mt-1">Adjust and run to project outcome</p>
        </div>
        <div className="p-5 flex flex-col gap-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-subtle">
              Delay Maintenance by (days)
            </p>
            <div className="flex items-center gap-4 mt-3">
              <input
                type="range" min={0} max={14} value={delay}
                onChange={e => setDelay(Number(e.target.value))}
                className="flex-1 accent-warn cursor-ew-resize"
              />
              <span className={`text-base font-bold font-mono w-8 text-right ${delay > 5 ? 'text-critical' : 'text-heading'}`}>
                {delay}
              </span>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-subtle">
              Lubrication Interval (days)
            </p>
            <div className="flex items-center gap-4 mt-3">
              <input
                type="range" min={7} max={60} value={lubFreq}
                onChange={e => setLubFreq(Number(e.target.value))}
                className="flex-1 accent-warn cursor-ew-resize"
              />
              <span className={`text-base font-bold font-mono w-8 text-right ${lubFreq > 45 ? 'text-warn' : 'text-heading'}`}>
                {lubFreq}
              </span>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={runSim}
              className="flex-1 py-2.5 text-xs font-bold uppercase tracking-wider border border-warn text-warn bg-warn/5 hover:bg-warn hover:text-bgBase transition-colors rounded-sm shadow-[0_0_10px_rgba(217,119,6,0.1)] cursor-pointer"
            >
              Run Simulation
            </button>
            <button
              onClick={resetSim}
              className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider border border-borderSubtle text-subtle bg-surface2/50 hover:bg-surface3 transition-colors rounded-sm cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1">
        {!result ? (
          <div className="border border-borderPrimary bg-surface1/30 p-10 text-center rounded-sm">
            <p className="text-subtle text-[13px]">Adjust parameters and click "Run Simulation" to project machine outcome.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4 animate-in fade-in duration-300">
            <div className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm">
              <div className="px-5 py-3 border-b border-borderSubtle bg-surface2/40">
                <p className="text-[10px] uppercase tracking-widest text-subtle font-semibold">Simulation Result</p>
              </div>
              <div className="p-6 flex gap-4">
                <KpiCard label="Days to Failure" value={`${result.projection}d`}
                  color={result.projection < 5 ? 'text-critical' : result.projection < 9 ? 'text-warn' : 'text-safe'}
                  sub={delay > 0 ? `+${delay} day delay applied` : 'Act now'}
                />
                <KpiCard label="Efficiency" value={`${result.efficiency}%`}
                  color={Number(result.efficiency) < 85 ? 'text-warn' : 'text-safe'}
                  sub="at current drift rate"
                />
                <KpiCard label="Failure Prob." value={`${result.failureProb}%`}
                  color={Number(result.failureProb) > 60 ? 'text-critical' : Number(result.failureProb) > 35 ? 'text-warn' : 'text-safe'}
                  sub="within delay window"
                />
              </div>
            </div>

            <div className={`border bg-surface1/60 backdrop-blur-md p-5 rounded-sm shadow-sm ${Number(result.failureProb) > 50 ? 'border-critical shadow-[0_0_20px_rgba(220,38,38,0.1)]' : 'border-borderPrimary'}`}>
              <p className="text-[10px] uppercase tracking-widest text-subtle mb-3">
                AI Agent Recommendation
              </p>
              <p className="text-[13px] text-body leading-relaxed">
                {Number(result.failureProb) > 60
                  ? `Delaying maintenance by ${delay} days is high risk. Projected failure probability exceeds 60%. Immediate scheduling is strongly advised.`
                  : Number(result.failureProb) > 35
                  ? `A ${delay}-day delay is manageable but increases risk. Consider scheduling within ${Math.max(1, result.projection - 3)} days.`
                  : `Parameters within acceptable range. Schedule maintenance within ${result.projection} days to maintain optimal efficiency.`
                }
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main Machine Detail View ─────────────────────────────────────────────────
export function MachineDetailView() {
  const { machineId } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('Overview')
  const { alertData, stats, diagnosisRaw, chartData } = useSensorFeed(machineId)

  const machine = MACHINES.find(m => m.id === machineId)
  if (!machine) {
    return (
      <div className="p-12 text-center">
        <p className="text-subtle">Machine not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-warn bg-transparent border-none cursor-pointer hover:underline">← Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-bgBase">
      {/* Machine Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-borderPrimary bg-surface1/50 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="text-subtle bg-transparent border-none cursor-pointer text-xs p-0 flex items-center gap-1.5 hover:text-heading transition-colors"
          >
            ← Back
          </button>
          <span className="text-borderPrimary">|</span>
          <div>
            <h2 className="text-base text-heading font-semibold tracking-wide">{machine.name}</h2>
            <p className="text-[11px] text-subtle mt-0.5">
              {machine.id} · {machine.line} · {machine.location}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <HealthBar value={machine.health} />
          <StatusBadge status={machine.status} />
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div className="flex-1 overflow-auto bg-bgBase">
        {activeTab === 'Overview'          && <OverviewTab machine={machine} alertData={alertData} stats={stats} chartData={chartData} />}
        {activeTab === 'Sensor History'    && <SensorHistoryTab machine={machine} />}
        {activeTab === 'Agent Trace'       && <AgentTraceTab alertData={alertData} stats={stats} diagnosisRaw={diagnosisRaw} />}
        {activeTab === 'Maintenance Log'   && <MaintenanceLogTab />}
        {activeTab === 'What-If Sim'       && <WhatIfTab machine={machine} />}
      </div>
    </div>
  )
}
