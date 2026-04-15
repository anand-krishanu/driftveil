import { C } from '../theme'

// ─── Pipeline Steps ───────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    step: '01',
    label: 'Sensors',
    tech: 'MQTT · PLCs',
    desc: 'Temperature, vibration & RPM stream live from factory floor over a one-way encrypted edge gateway.',
    color: C.subtle,
  },
  {
    step: '02',
    label: 'Drift Math',
    tech: 'CUSUM · z-score',
    desc: 'Python calculates the drift slope every second. Flags when cumulative deviation exceeds threshold S_t > 10.',
    color: C.warn,
  },
  {
    step: '03',
    label: 'AI Agents',
    tech: 'AWS Strands · Bedrock',
    desc: '4 specialized agents pass the signal through the MCP server, match it to the fingerprint library, and diagnose the root cause.',
    color: C.critical,
  },
  {
    step: '04',
    label: 'Operator Alert',
    tech: 'Plain English',
    desc: 'Agent 4 formats the diagnosis into a human-readable alert with a failure ETA and a prescribed action to take next.',
    color: C.safe,
  },
]

// ─── 4 Agents ─────────────────────────────────────────────────────────────────
const AGENTS = [
  { n: '1', name: 'Monitor Agent',    role: 'Polls MCP Server for new sensor readings every tick.' },
  { n: '2', name: 'Detection Agent',  role: 'Runs CUSUM math. Raises a drift flag when score crosses h=10.' },
  { n: '3', name: 'Root Cause Agent', role: 'Sends drifted data + fingerprints to Amazon Bedrock. Gets a diagnosis back.' },
  { n: '4', name: 'Explanation Agent',role: 'Converts raw diagnosis into a plain-English operator alert with ETA.' },
]

// ─── Tech Stack Rows ──────────────────────────────────────────────────────────
const STACK = [
  { layer: 'Data',    items: ['TimescaleDB (sensor history)', 'Redis (live cache)', 'SQLite (fingerprint library)'] },
  { layer: 'AI',      items: ['AWS Strands Agents', 'Amazon Bedrock (Claude 3.5)', 'Bedrock Guardrails (no hallucinations)'] },
  { layer: 'Backend', items: ['Python 3.12 + FastAPI', 'MCP Python SDK', 'Pandas / NumPy / Scikit-learn'] },
  { layer: 'Frontend',items: ['React + Vite', 'Recharts (sensor charts)', 'TailwindCSS'] },
]

// ─── Architecture View ────────────────────────────────────────────────────────
export function ArchitectureView() {
  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 48 }}>

      {/* Hero Title */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.warn, marginBottom: 10 }}>
          System Architecture
        </p>
        <h1 style={{ fontSize: 28, color: C.heading, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
          How DriftVeil Works
        </h1>
        <p style={{ fontSize: 14, color: C.body, maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
          A 4-step pipeline from raw sensor data to a plain-English operator alert — all running in under 3 seconds.
        </p>
      </div>

      {/* ── Pipeline Flow ─────────────────────────────────────────────────── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'stretch', gap: 0 }}>
          {PIPELINE_STEPS.map((step, i) => (
            <div key={i} style={{ display: 'flex', flex: 1, alignItems: 'stretch' }}>
              {/* Card */}
              <div style={{
                flex: 1,
                border: `1px solid ${C.border}`,
                borderLeft: i === 0 ? `3px solid ${step.color}` : `1px solid ${C.border}`,
                background: C.bgS1,
                padding: '24px 20px',
                display: 'flex', flexDirection: 'column', gap: 10,
                position: 'relative',
              }}>
                {/* Step Number */}
                <span style={{
                  fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono',
                  color: step.color, letterSpacing: '0.1em',
                }}>
                  STEP {step.step}
                </span>
                {/* Label */}
                <p style={{ fontSize: 20, fontWeight: 700, color: C.heading }}>{step.label}</p>
                {/* Tech */}
                <p style={{
                  fontSize: 10, fontFamily: 'JetBrains Mono',
                  color: step.color, letterSpacing: '0.06em',
                  border: `1px solid ${step.color}`,
                  display: 'inline-block', padding: '2px 8px', alignSelf: 'flex-start',
                }}>
                  {step.tech}
                </p>
                {/* Description */}
                <p style={{ fontSize: 12, color: C.body, lineHeight: 1.75, marginTop: 4 }}>{step.desc}</p>
              </div>
              {/* Arrow between steps */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 40, flexShrink: 0, color: C.border, fontSize: 20,
                }}>
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 Agents Flow ────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 6 }}>
          The 4 AI Agents (Step 3 Detail)
        </h2>
        <p style={{ fontSize: 12, color: C.subtle, marginBottom: 20 }}>
          Each agent has exactly one job. Output of one feeds directly into the next.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${C.border}` }}>
          {AGENTS.map((agent, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 20,
              padding: '16px 24px',
              borderBottom: i < AGENTS.length - 1 ? `1px solid ${C.border}` : 'none',
              background: i % 2 === 0 ? C.bgS1 : C.bgS2,
            }}>
              {/* Number bubble */}
              <div style={{
                width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                background: C.warn, color: C.bgBase,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 700,
              }}>
                {agent.n}
              </div>
              {/* Agent info */}
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.heading }}>{agent.name}</p>
                <p style={{ fontSize: 12, color: C.body, marginTop: 2 }}>{agent.role}</p>
              </div>
              {/* Arrow down */}
              {i < AGENTS.length - 1 && (
                <div style={{ fontSize: 16, color: C.border }}>↓</div>
              )}
            </div>
          ))}
        </div>
        {/* MCP Note */}
        <div style={{
          marginTop: 12, padding: '12px 20px',
          border: `1px solid ${C.border}`, background: C.bgS1,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: C.warn, border: `1px solid ${C.warn}`, padding: '3px 10px' }}>
            MCP SERVER
          </span>
          <p style={{ fontSize: 12, color: C.body }}>
            All agents read data through the <strong style={{ color: C.heading }}>Model Context Protocol (MCP)</strong> — a typed, read-only tool layer that shields the database from any direct AI access.
          </p>
        </div>
      </div>

      {/* ── Tech Stack Grid ───────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 20 }}>Full Tech Stack</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {STACK.map(({ layer, items }) => (
            <div key={layer} style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${C.border}`, background: C.bgS2 }}>
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.warn }}>{layer}</p>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map(item => (
                  <p key={item} style={{ fontSize: 12, color: C.body, lineHeight: 1.5 }}>{item}</p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
