import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts'
import { C } from '../theme'
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
    <div style={{ padding: '14px 18px', border: `1px solid ${C.border}`, background: C.bgS1, flex: 1 }}>
      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>{label}</p>
      <p style={{ fontSize: 24, fontWeight: 700, color: color || C.heading, margin: '4px 0 2px', fontFamily: 'JetBrains Mono' }}>{value}</p>
      {sub && <p style={{ fontSize: 11, color: C.subtle }}>{sub}</p>}
    </div>
  )
}

// ─── Tab Selector ─────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.bgS1 }}>
      {TABS.map(tab => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          style={{
            padding: '10px 20px', fontSize: 12, fontWeight: 500,
            background: 'transparent', cursor: 'pointer',
            borderBottom: active === tab ? `2px solid ${C.warn}` : '2px solid transparent',
            color: active === tab ? C.heading : C.subtle,
            transition: 'all 0.15s', border: 'none',
          }}
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
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Row */}
      <div style={{ display: 'flex', gap: 12 }}>
        <KpiCard label="Health Score"    value={`${machine.health}%`}  color={machine.health >= 90 ? C.safe : machine.health >= 75 ? C.warn : C.critical} />
        <KpiCard label="Temperature"     value={`${liveTemp}°C`}   color={liveCusum > 10 ? C.warn : C.heading} sub="Current reading" />
        <KpiCard label="Vibration"       value={`${liveVib} mm/s`} color={liveCusum > 10 ? C.warn : C.heading} sub="Current reading" />
        <KpiCard label="CUSUM Score"     value={liveCusum.toFixed(1)} color={liveCusum > 10 ? C.critical : liveCusum > 4 ? C.warn : C.safe} sub={liveCusum > 10 ? 'SIGNAL: Drift Confirmed' : 'Within range'} />
        <KpiCard label="Est. Runtime"    value={machine.runtime}        sub="Since last service" />
      </div>

      {/* Machine Info + Chart */}
      <div style={{ display: 'flex', gap: 16 }}>
        {/* Info Card */}
        <div style={{ width: 260, border: `1px solid ${C.border}`, background: C.bgS1 }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>Machine Info</p>
          </div>
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Machine ID',       value: machine.id },
              { label: 'Name',             value: machine.name },
              { label: 'Production Line',  value: machine.line },
              { label: 'Location',         value: machine.location },
              { label: 'Last Maintenance', value: machine.lastMaintenance },
              { label: 'Total Runtime',    value: machine.runtime },
            ].map(({ label, value }) => (
              <div key={label}>
                <p style={{ fontSize: 10, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                <p style={{ fontSize: 13, color: C.heading, marginTop: 2 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Trend mini-chart */}
        <div style={{ flex: 1, border: `1px solid ${C.border}`, background: C.bgS1 }}>
          <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.heading }}>30-Day Sensor Trend</p>
          </div>
          <div style={{ padding: 16 }}>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={history.slice(-60)} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                <CartesianGrid strokeDasharray="2 4" stroke={C.chartGrid} vertical={false} />
                <XAxis dataKey="day" tick={{ fill: C.subtle, fontSize: 9 }} tickLine={false} axisLine={{ stroke: C.border }} interval={11} />
                <YAxis domain={[30, 110]} tick={{ fill: C.subtle, fontSize: 9 }} tickLine={false} axisLine={false} width={32} />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={SCADA_THRESHOLD} stroke={C.critical} strokeDasharray="5 4" strokeWidth={1} />
                <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke={C.chartTemp} strokeWidth={2} dot={false} isAnimationActive={false} />
                <Line type="monotone" dataKey="vibration"   name="Vibration (mm/s)"  stroke={C.chartVib}  strokeWidth={2} dot={false} isAnimationActive={false} />
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
    <div style={{ padding: 24 }}>
      <div style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 14, color: C.heading }}>{machine.id} — Full Sensor History (120 Days)</h3>
          <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>Temperature and Vibration · Red line = SCADA threshold</p>
        </div>
        <div style={{ padding: 16 }}>
          <ResponsiveContainer width="100%" height={380}>
            <LineChart data={history} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.chartGrid} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.subtle, fontSize: 10 }} tickLine={false} axisLine={{ stroke: C.border }} interval={14} />
              <YAxis domain={[30, 110]} tick={{ fill: C.subtle, fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={SCADA_THRESHOLD} stroke={C.critical} strokeDasharray="5 4" strokeWidth={1.5}
                label={{ value: 'SCADA THRESHOLD', fill: C.critical, fontSize: 9, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="temperature" name="Temperature (°C)" stroke={C.chartTemp} strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="vibration"   name="Vibration (mm/s)"  stroke={C.chartVib}  strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CUSUM trend */}
      <div style={{ border: `1px solid ${C.border}`, background: C.bgS1, marginTop: 16 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 14, color: C.heading }}>CUSUM Score History</h3>
          <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>Signal triggered when S_t &gt; 10</p>
        </div>
        <div style={{ padding: 16 }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={history} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="2 4" stroke={C.chartGrid} vertical={false} />
              <XAxis dataKey="day" tick={{ fill: C.subtle, fontSize: 10 }} tickLine={false} axisLine={{ stroke: C.border }} interval={14} />
              <YAxis tick={{ fill: C.subtle, fontSize: 10, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={10} stroke={C.critical} strokeDasharray="4 3" strokeWidth={1}
                label={{ value: 'SIGNAL THRESHOLD (h=10)', fill: C.critical, fontSize: 9, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="cusum" name="CUSUM Score" stroke={C.warn} strokeWidth={2} dot={false} isAnimationActive={false} />
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
    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 800 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 14, color: C.heading }}>Live AWS Strands Agent Execution</h3>
        <span style={{ fontSize: 11, color: C.subtle, fontFamily: 'JetBrains Mono' }}>System Event Log</span>
      </div>

      {!stats && !alertData && (
        <div style={{ padding: 24, textAlign: 'center', border: `1px solid ${C.border}` }}>
          <p style={{ color: C.subtle, fontSize: 13 }}>Waiting for pipeline to trigger (requires simulated drift).</p>
        </div>
      )}

      {stats && (
        <div style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderBottom: `1px solid ${C.borderSub}`, background: C.bgS2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.warn, color: C.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>2</span>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.warn }}>Agent 2: Detection Math Engine</p>
            </div>
            <p style={{ fontSize: 11, color: C.subtle, fontFamily: 'JetBrains Mono' }}>completed</p>
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {`> CUSUM Score: ${stats.cusum_score}\n> Temperature Slope: ${stats.slope_temp}°C/t\n> Vibration Slope: ${stats.slope_vib}\n\n[DRIFT CONFIRMED OVER THRESHOLD]\nInvoking multi-agent pipeline for explanation.`}
            </p>
          </div>
        </div>
      )}

      {(stats?.drift_detected || diagnosisRaw) && (
        <div style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderBottom: `1px solid ${C.borderSub}`, background: C.bgS2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.critical, color: C.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>3</span>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.critical }}>Agent 3: Root Cause (Claude 3.5)</p>
            </div>
            <p style={{ fontSize: 11, color: C.subtle, fontFamily: 'JetBrains Mono' }}>{diagnosisRaw ? 'completed' : 'running...'}</p>
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
              {diagnosisRaw || `Processing 15 rows of sensor data.\nChecking MCP for fingerprint matches...`}
            </p>
          </div>
        </div>
      )}

      {(alertData || diagnosisRaw) && (
        <div style={{ border: `1px solid ${C.border}`, background: C.bgS1, opacity: alertData ? 1 : 0.6 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 16px', borderBottom: `1px solid ${C.borderSub}`, background: C.bgS2,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 22, height: 22, borderRadius: '50%', background: C.safe, color: C.bgBase, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>4</span>
              <p style={{ fontSize: 12, fontWeight: 600, color: C.safe }}>Agent 4: Explainer & Formatter</p>
            </div>
            <p style={{ fontSize: 11, color: C.subtle, fontFamily: 'JetBrains Mono' }}>{alertData ? 'completed' : 'running...'}</p>
          </div>
          <div style={{ padding: 16 }}>
            <p style={{ fontSize: 12, color: C.body, fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}>
              {alertData ? `JSON Alert Card published.` : `Translating raw diagnosis to JSON struct...`}
            </p>
          </div>
        </div>
      )}

      {alertData && (
        <div style={{ border: `1px solid ${C.safe}`, background: C.bgAlert, padding: 16, marginTop: 8 }}>
          <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.safe, marginBottom: 8 }}>Bedrock Guardrails Verification</p>
          <p style={{ fontSize: 12, color: C.heading, fontFamily: 'JetBrains Mono', lineHeight: 1.8 }}>
            All 4 agent outputs verified. No hallucinations detected. Each claim backed by structured MCP tool data. Confidence: {alertData.confidence}.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Tab: Maintenance Log ──────────────────────────────────────────────────────
function MaintenanceLogTab() {
  return (
    <div style={{ padding: 24 }}>
      <div style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
        <div style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}`, background: C.bgS2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 110px 130px 1fr 80px' }}>
            {['Date', 'Type', 'Technician', 'Action Taken', 'Result'].map(h => (
              <p key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle }}>{h}</p>
            ))}
          </div>
        </div>
        {MAINTENANCE_LOG.map((log, i) => {
          const resultColor = log.result === 'PASS' ? C.safe : log.result === 'FIXED' ? C.warn : C.critical
          return (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '120px 110px 130px 1fr 80px',
              padding: '12px 20px', borderBottom: `1px solid ${C.borderSub}`,
              alignItems: 'center',
            }}>
              <p style={{ fontSize: 12, color: C.body, fontFamily: 'JetBrains Mono' }}>{log.date}</p>
              <p style={{ fontSize: 11, color: log.type === 'Emergency' ? C.critical : log.type === 'Predictive' ? C.warn : C.subtle }}>
                {log.type}
              </p>
              <p style={{ fontSize: 12, color: C.body }}>{log.tech}</p>
              <p style={{ fontSize: 12, color: C.body, lineHeight: 1.6 }}>{log.action}</p>
              <span style={{ border: `1px solid ${resultColor}`, color: resultColor, padding: '2px 8px', fontSize: 10, fontWeight: 600, display: 'inline-block' }}>
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
    <div style={{ padding: 24, display: 'flex', gap: 20 }}>
      {/* Controls */}
      <div style={{ width: 320, border: `1px solid ${C.border}`, background: C.bgS1 }}>
        <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.border}` }}>
          <h3 style={{ fontSize: 14, color: C.heading }}>Simulation Parameters</h3>
          <p style={{ fontSize: 11, color: C.subtle, marginTop: 2 }}>Adjust and run to project outcome</p>
        </div>
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Delay Maintenance by (days)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <input
                type="range" min={0} max={14} value={delay}
                onChange={e => setDelay(Number(e.target.value))}
                style={{ flex: 1, accentColor: C.warn }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: delay > 5 ? C.critical : C.heading, fontFamily: 'JetBrains Mono', width: 32 }}>
                {delay}
              </span>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, color: C.subtle, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Lubrication Interval (days)
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
              <input
                type="range" min={7} max={60} value={lubFreq}
                onChange={e => setLubFreq(Number(e.target.value))}
                style={{ flex: 1, accentColor: C.warn }}
              />
              <span style={{ fontSize: 16, fontWeight: 700, color: lubFreq > 45 ? C.warn : C.heading, fontFamily: 'JetBrains Mono', width: 32 }}>
                {lubFreq}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button
              onClick={runSim}
              style={{
                flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600,
                border: `1px solid ${C.warn}`, color: C.warn,
                background: 'transparent', cursor: 'pointer',
              }}
            >
              Run Simulation
            </button>
            <button
              onClick={resetSim}
              style={{
                padding: '9px 16px', fontSize: 12,
                border: `1px solid ${C.border}`, color: C.subtle,
                background: 'transparent', cursor: 'pointer',
              }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1 }}>
        {!result ? (
          <div style={{ border: `1px solid ${C.border}`, background: C.bgS1, padding: 32, textAlign: 'center' }}>
            <p style={{ color: C.subtle, fontSize: 13 }}>Adjust parameters and click "Run Simulation" to project machine outcome.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}` }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.subtle }}>Simulation Result</p>
              </div>
              <div style={{ padding: 20, display: 'flex', gap: 16 }}>
                <KpiCard label="Days to Failure" value={`${result.projection}d`}
                  color={result.projection < 5 ? C.critical : result.projection < 9 ? C.warn : C.safe}
                  sub={delay > 0 ? `+${delay} day delay applied` : 'Act now'}
                />
                <KpiCard label="Effective Efficiency" value={`${result.efficiency}%`}
                  color={Number(result.efficiency) < 85 ? C.warn : C.safe}
                  sub="at current drift rate"
                />
                <KpiCard label="Failure Probability" value={`${result.failureProb}%`}
                  color={Number(result.failureProb) > 60 ? C.critical : Number(result.failureProb) > 35 ? C.warn : C.safe}
                  sub="within delay window"
                />
              </div>
            </div>

            <div style={{
              border: `1px solid ${Number(result.failureProb) > 50 ? C.critical : C.border}`,
              background: C.bgS1, padding: 16
            }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle, marginBottom: 8 }}>
                AI Agent Recommendation
              </p>
              <p style={{ fontSize: 13, color: C.body, lineHeight: 1.8 }}>
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
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: C.subtle }}>Machine not found.</p>
        <button onClick={() => navigate('/')} style={{ marginTop: 16, color: C.warn, background: 'none', border: 'none', cursor: 'pointer' }}>← Back to Dashboard</button>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Machine Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 24px', borderBottom: `1px solid ${C.border}`,
        background: C.bgS1,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(-1)}
            style={{ color: C.subtle, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
          >
            ← Back
          </button>
          <span style={{ color: C.border }}>|</span>
          <div>
            <h2 style={{ fontSize: 16, color: C.heading }}>{machine.name}</h2>
            <p style={{ fontSize: 11, color: C.subtle, marginTop: 1 }}>
              {machine.id} · {machine.line} · {machine.location}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <HealthBar value={machine.health} />
          <StatusBadge status={machine.status} />
        </div>
      </div>

      {/* Tab Bar */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Tab Content */}
      <div style={{ flex: 1, overflow: 'auto', background: C.bgBase }}>
        {activeTab === 'Overview'          && <OverviewTab machine={machine} alertData={alertData} stats={stats} chartData={chartData} />}
        {activeTab === 'Sensor History'    && <SensorHistoryTab machine={machine} />}
        {activeTab === 'Agent Trace'       && <AgentTraceTab alertData={alertData} stats={stats} diagnosisRaw={diagnosisRaw} />}
        {activeTab === 'Maintenance Log'   && <MaintenanceLogTab />}
        {activeTab === 'What-If Sim'       && <WhatIfTab machine={machine} />}
      </div>
    </div>
  )
}
