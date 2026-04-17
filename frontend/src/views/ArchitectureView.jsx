const PIPELINE_STEPS = [
  { step: '01', label: 'Sensors',       tech: 'MQTT · PLCs',          desc: 'Temperature, vibration & RPM stream live from factory floor over encrypted edge gateway.', color: 'var(--text-subtle)' },
  { step: '02', label: 'Drift Math',    tech: 'CUSUM · z-score',      desc: 'Python calculates drift slope every second. Flags when cumulative deviation S_t > 10.', color: 'var(--accent-warn)' },
  { step: '03', label: 'AI Agents',     tech: 'AWS Strands · Bedrock', desc: '4 specialized agents pass signal through MCP, match fingerprint library, diagnose root cause.', color: 'var(--accent-critical)' },
  { step: '04', label: 'Operator Alert',tech: 'Plain English',         desc: 'Agent 4 formats diagnosis into human-readable alert with failure ETA and prescribed action.', color: 'var(--accent-safe)' },
]

const AGENTS = [
  { n: '1', name: 'Monitor Agent',    tag: 'Data Collector',    color: 'var(--text-subtle)',     input: 'Scheduled time tick (every 3 seconds)', tool: 'MCP: get_sensor_snapshot(machine_id)', output: '{ temp, vibration, rpm, timestamp }', detail: 'Polls MCP server for latest sensor bundle. Passes raw snapshot to Detection Agent without modification.', llm: false },
  { n: '2', name: 'Detection Agent',  tag: 'Math Engine',       color: 'var(--accent-warn)',     input: 'Raw sensor JSON from Agent 1', tool: 'MCP: get_baseline_profile(machine_id)', output: '{ drift_detected: true, cusum_score: 14.7 }', detail: 'Applies CUSUM and z-score formulas. Raises drift flag when S_t > h (threshold = 10).', llm: false },
  { n: '3', name: 'Root Cause Agent', tag: '⚡ LLM Connected', color: 'var(--accent-critical)', input: 'Drift flag + anomaly data from Agent 2', tool: 'MCP: get_fingerprints() → Amazon Bedrock (Claude 3.5)', output: '{ root_cause: "bearing_wear", confidence: 0.89 }', detail: 'Fetches fingerprint library via MCP, sends data to Bedrock. Guardrails enforce reasoning from tool data only.', llm: true },
  { n: '4', name: 'Explanation Agent',tag: '⚡ LLM Connected', color: 'var(--accent-safe)',     input: 'Raw diagnosis JSON from Agent 3', tool: 'Amazon Bedrock (Claude 3.5) — formatting prompt', output: '{ title, eta_days, action, confidence_pct }', detail: 'Sends diagnosis back to Bedrock with strict format prompt. Returns human-readable JSON for operator UI.', llm: true },
]

const STACK = [
  { layer: 'Data',     items: ['TimescaleDB (sensor history)', 'Redis (live cache)', 'SQLite (fingerprint library)'] },
  { layer: 'AI',       items: ['AWS Strands Agents', 'Amazon Bedrock (Claude 3.5)', 'Bedrock Guardrails'] },
  { layer: 'Backend',  items: ['Python 3.12 + FastAPI', 'MCP Python SDK', 'Pandas / NumPy / Scikit-learn'] },
  { layer: 'Frontend', items: ['React + Vite', 'Recharts (sensor charts)', 'TailwindCSS v4'] },
]

function SectionHeader({ title, sub }) {
  return (
    <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-header)' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>{sub}</span>}
    </div>
  )
}

export function ArchitectureView() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* Page title */}
      <div
        className="px-6 py-4"
        style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-header)' }}
      >
        <div style={{ fontSize: 11, color: 'var(--accent-info)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 4 }}>
          System Architecture
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          How DriftVeil Works
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', maxWidth: 580 }}>
          A 4-step pipeline from raw sensor data to plain-English operator alert — running in under 3 seconds.
        </p>
      </div>

      <div className="flex flex-col gap-0 p-0">

        {/* Pipeline steps */}
        <div style={{ borderBottom: '2px solid var(--border)' }}>
          <SectionHeader title="4-Step Pipeline" sub="End-to-end data flow" />
          <div className="grid grid-cols-4">
            {PIPELINE_STEPS.map((step, i) => (
              <div
                key={i}
                style={{
                  padding: '20px 24px',
                  borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
                  borderLeft: `3px solid ${step.color}`,
                }}
              >
                <div style={{ fontSize: 10, fontFamily: 'JetBrains Mono', color: step.color, letterSpacing: '0.1em', marginBottom: 6 }}>
                  STEP {step.step}
                </div>
                <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 4 }}>
                  {step.label}
                </div>
                <div
                  style={{
                    display: 'inline-block', fontSize: 10, fontFamily: 'JetBrains Mono',
                    color: step.color, border: `1px solid ${step.color}`, padding: '1px 6px', marginBottom: 10,
                  }}
                >
                  {step.tech}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* MCP Explainer */}
        <div style={{ borderBottom: '2px solid var(--border)' }}>
          <SectionHeader title="What is MCP and Why Does It Matter?" sub="Security & reliability backbone" />
          <div className="grid grid-cols-3">
            {[
              { label: 'Without MCP', icon: '✕', color: 'var(--accent-critical)', bg: 'var(--accent-critical-dim)', body: 'The AI agent gets raw database access. It can write, delete, or fabricate data. One hallucination could corrupt sensor history or trigger a false emergency shutdown.' },
              { label: 'What MCP Does', icon: '⇄', color: 'var(--accent-warn)', bg: 'var(--bg-row-alt)', body: 'MCP wraps the database behind a typed, schema-validated interface. Each tool call is explicitly defined: name, parameters, return shape. Agent cannot call anything outside this contract.' },
              { label: 'With MCP (DriftVeil)', icon: '✓', color: 'var(--accent-safe)', bg: 'var(--accent-safe-dim)', body: 'Agents are restricted to read-only, structured tool calls: get_sensor_snapshot(), get_baseline_profile(), get_fingerprints(). The SCADA database is physically unreachable from the AI layer.' },
            ].map((col, i) => (
              <div
                key={i}
                style={{
                  padding: '20px 24px',
                  borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                  background: col.bg,
                }}
              >
                <span style={{ fontSize: 22, color: col.color, display: 'block', marginBottom: 8 }}>{col.icon}</span>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
                  {col.label}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.7 }}>{col.body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* LLM banner */}
        <div
          className="flex items-center gap-3 px-6 py-3"
          style={{ background: 'var(--accent-critical-dim)', borderBottom: '1px solid var(--accent-critical)', borderTop: '1px solid var(--accent-critical)' }}
        >
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', fontWeight: 700, color: 'var(--accent-critical)' }}>⚡ LLM CONNECTED</span>
          <span style={{ color: 'var(--border)' }}>|</span>
          <span style={{ fontSize: 11, color: 'var(--text-body)' }}>
            <strong style={{ color: 'var(--text-heading)' }}>Amazon Bedrock (Claude 3.5 Sonnet)</strong> is called only by Agents 3 and 4. Bedrock Guardrails are active on every call.
          </span>
        </div>

        {/* 4 Agents */}
        <div style={{ borderBottom: '2px solid var(--border)' }}>
          <SectionHeader title="The 4 AI Agents in Detail" sub="Each agent has exactly one job" />
          <div className="grid grid-cols-2">
            {AGENTS.map((agent, i) => (
              <div
                key={i}
                style={{
                  borderRight: i % 2 === 0 ? '1px solid var(--border)' : 'none',
                  borderBottom: i < 2 ? '1px solid var(--border)' : 'none',
                  background: 'var(--bg-panel)',
                  borderLeft: `3px solid ${agent.color}`,
                }}
              >
                {/* Header */}
                <div
                  className="flex items-center gap-3 px-4 py-2"
                  style={{ background: 'var(--bg-header)', borderBottom: '1px solid var(--border)' }}
                >
                  <span
                    style={{
                      width: 22, height: 22, borderRadius: '50%',
                      background: agent.color, color: '#111',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                    }}
                  >
                    {agent.n}
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {agent.name}
                  </span>
                  <span style={{ marginLeft: 'auto', fontSize: 10, color: agent.color, border: `1px solid ${agent.color}`, padding: '1px 6px', fontFamily: 'JetBrains Mono' }}>
                    {agent.tag}
                  </span>
                </div>
                {/* Body */}
                <div style={{ padding: '14px 16px' }}>
                  <p style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.7, marginBottom: 10 }}>{agent.detail}</p>
                  <div
                    style={{
                      background: 'var(--bg-input)', border: '1px solid var(--border)',
                      padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 6,
                    }}
                  >
                    {[
                      { label: 'Input', value: agent.input },
                      { label: 'Tool',  value: agent.tool  },
                      { label: 'Output',value: agent.output },
                    ].map(row => (
                      <div key={row.label} className="flex gap-3">
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', width: 44, flexShrink: 0, paddingTop: 1 }}>{row.label}</span>
                        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono', color: 'var(--text-body)', lineHeight: 1.5 }}>{row.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack */}
        <div>
          <SectionHeader title="Full Tech Stack" />
          <div className="grid grid-cols-4">
            {STACK.map(({ layer, items }, i) => (
              <div
                key={layer}
                style={{
                  padding: '16px 20px',
                  borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                  background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
                }}
              >
                <div style={{ fontSize: 10, color: 'var(--accent-info)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 10 }}>
                  {layer}
                </div>
                {items.map(item => (
                  <div key={item} className="flex items-center gap-2 mb-2">
                    <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: 'var(--text-body)' }}>{item}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
