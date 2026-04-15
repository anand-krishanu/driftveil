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
  {
    n: '1',
    name: 'Monitor Agent',
    tag: 'Data Collector',
    color: C.subtle,
    input:  'Scheduled time tick (every 3 seconds)',
    tool:   'MCP Tool: get_sensor_snapshot(machine_id)',
    output: 'Raw JSON: { temp, vibration, rpm, timestamp }',
    detail: 'Continuously polls the MCP server for the latest sensor bundle. Passes the raw snapshot to the Detection Agent without any modification.',
    llm: false,
  },
  {
    n: '2',
    name: 'Detection Agent',
    tag: 'Math Engine',
    color: C.warn,
    input:  'Raw sensor JSON from Agent 1',
    tool:   'MCP Tool: get_baseline_profile(machine_id)',
    output: '{ drift_detected: true, cusum_score: 14.7, z_score: 2.4 }',
    detail: 'Applies CUSUM (Cumulative Sum Control Chart) and z-score formulas to measure deviation from the machine baseline. Raises a drift flag when S_t > h (threshold = 10).',
    llm: false,
  },
  {
    n: '3',
    name: 'Root Cause Agent',
    tag: '⚡ LLM Connected',
    color: C.critical,
    input:  'Drift flag + anomaly data from Agent 2',
    tool:   'MCP Tool: get_fingerprints() → Amazon Bedrock (Claude 3.5)',
    output: '{ root_cause: "bearing_wear", confidence: 0.89, details: "..." }',
    detail: 'Fetches the full fingerprint library via MCP, then sends the drifted data + fingerprints to Amazon Bedrock for reasoning. Bedrock Guardrails enforce that the LLM can ONLY reason from the provided tool data — no hallucinations.',
    llm: true,
  },
  {
    n: '4',
    name: 'Explanation Agent',
    tag: '⚡ LLM Connected',
    color: C.safe,
    input:  'Raw diagnosis JSON from Agent 3',
    tool:   'Amazon Bedrock (Claude 3.5) — formatting prompt',
    output: '{ title, eta_days, action, confidence_pct }',
    detail: 'Sends the structured diagnosis back to Bedrock with a strict formatting prompt: return a valid JSON object with a human-readable title, failure ETA in days, and a plain-English action for the operator.',
    llm: true,
  },
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

      {/* ── MCP Explainer ─────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 6 }}>
          What is MCP and Why Does It Matter?
        </h2>
        <p style={{ fontSize: 12, color: C.subtle, marginBottom: 16 }}>
          The Model Context Protocol is the security and reliability backbone of the entire agent pipeline.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0, border: `1px solid ${C.warn}` }}>
          {[
            {
              label: 'Without MCP',
              icon: '✕',
              iconColor: C.critical,
              body: 'The AI agent gets raw database access. It can write, delete, or fabricate data. One hallucination could corrupt your entire sensor history or trigger a false emergency shutdown.',
            },
            {
              label: 'What MCP Does',
              icon: '⇄',
              iconColor: C.warn,
              body: 'MCP wraps the database behind a typed, schema-validated interface. Each tool call is explicitly defined: name, parameters, return shape. The agent cannot call anything outside this contract.',
            },
            {
              label: 'With MCP (DriftVeil)',
              icon: '✓',
              iconColor: C.safe,
              body: 'Agents are restricted to read-only, structured tool calls: get_sensor_snapshot(), get_baseline_profile(), get_fingerprints(). The SCADA database is physically unreachable from the AI layer.',
            },
          ].map((col, i) => (
            <div key={i} style={{
              padding: '20px 24px',
              borderRight: i < 2 ? `1px solid ${C.warn}` : 'none',
              background: i === 0 ? C.bgAlert : i === 2 ? C.bgS1 : C.bgS2,
            }}>
              <p style={{ fontSize: 24, marginBottom: 8 }}>
                <span style={{ color: col.iconColor }}>{col.icon}</span>
              </p>
              <p style={{ fontSize: 12, fontWeight: 700, color: C.heading, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {col.label}
              </p>
              <p style={{ fontSize: 12, color: C.body, lineHeight: 1.75 }}>{col.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 Agents Flow ────────────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 6 }}>
          The 4 AI Agents in Detail
        </h2>
        <p style={{ fontSize: 12, color: C.subtle, marginBottom: 16 }}>
          Each agent has exactly one job. Agents 3 & 4 are the only ones that call the LLM.
        </p>

        {/* LLM callout banner */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px',
          border: `1px solid ${C.critical}`, background: C.bgAlert,
          marginBottom: 12,
        }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 700, color: C.critical }}>⚡ LLM CONNECTED</span>
          <span style={{ color: C.border }}>|</span>
          <p style={{ fontSize: 12, color: C.body }}>
            <strong style={{ color: C.heading }}>Amazon Bedrock (Claude 3.5 Sonnet)</strong> is called only by Agents 3 and 4. Bedrock Guardrails are applied on every call — the model is not permitted to reason beyond the structured MCP tool data it receives.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {AGENTS.map((agent, i) => (
            <div key={i} style={{
              border: `1px solid ${agent.llm ? C.critical : C.border}`,
              background: C.bgS1,
            }}>
              {/* Card header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '12px 20px', borderBottom: `1px solid ${C.border}`,
                background: C.bgS2,
              }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                  background: agent.color, color: C.bgBase,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                }}>
                  {agent.n}
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: C.heading }}>{agent.name}</p>
                </div>
                <span style={{
                  fontSize: 10, color: agent.color,
                  border: `1px solid ${agent.color}`,
                  padding: '2px 8px', letterSpacing: '0.06em',
                }}>
                  {agent.tag}
                </span>
              </div>
              {/* Card body */}
              <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 12, color: C.body, lineHeight: 1.7 }}>{agent.detail}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                  {[
                    { label: 'Input',  value: agent.input },
                    { label: 'Tool',   value: agent.tool  },
                    { label: 'Output', value: agent.output },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', gap: 12 }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle, width: 44, flexShrink: 0, paddingTop: 1 }}>{row.label}</p>
                      <p style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: C.body, lineHeight: 1.6 }}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
