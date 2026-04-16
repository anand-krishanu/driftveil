// ─── Pipeline Steps ───────────────────────────────────────────────────────────
const PIPELINE_STEPS = [
  {
    step: '01',
    label: 'Sensors',
    tech: 'MQTT · PLCs',
    desc: 'Temperature, vibration & RPM stream live from factory floor over a one-way encrypted edge gateway.',
    colorClass: 'text-subtle',
    borderClass: 'border-subtle',
  },
  {
    step: '02',
    label: 'Drift Math',
    tech: 'CUSUM · z-score',
    desc: 'Python calculates the drift slope every second. Flags when cumulative deviation exceeds threshold S_t > 10.',
    colorClass: 'text-warn',
    borderClass: 'border-warn',
  },
  {
    step: '03',
    label: 'AI Agents',
    tech: 'AWS Strands · Bedrock',
    desc: '4 specialized agents pass the signal through the MCP server, match it to the fingerprint library, and diagnose the root cause.',
    colorClass: 'text-critical',
    borderClass: 'border-critical',
  },
  {
    step: '04',
    label: 'Operator Alert',
    tech: 'Plain English',
    desc: 'Agent 4 formats the diagnosis into a human-readable alert with a failure ETA and a prescribed action to take next.',
    colorClass: 'text-safe',
    borderClass: 'border-safe',
  },
]

// ─── 4 Agents ─────────────────────────────────────────────────────────────────
const AGENTS = [
  {
    n: '1',
    name: 'Monitor Agent',
    tag: 'Data Collector',
    bgColor: 'bg-subtle',
    borderColor: 'border-subtle',
    textColor: 'text-subtle',
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
    bgColor: 'bg-warn',
    borderColor: 'border-warn',
    textColor: 'text-warn',
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
    bgColor: 'bg-critical',
    borderColor: 'border-critical',
    textColor: 'text-critical',
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
    bgColor: 'bg-safe',
    borderColor: 'border-safe',
    textColor: 'text-safe',
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
    <div className="px-12 py-10 flex flex-col gap-12 bg-bgBase min-h-full">
      {/* Hero Title */}
      <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
        <p className="text-[11px] uppercase tracking-[0.2em] text-warn mb-2.5 font-semibold">
          System Architecture
        </p>
        <h1 className="text-3xl text-heading font-bold tracking-tight mb-2">
          How DriftVeil Works
        </h1>
        <p className="text-sm text-body max-w-[560px] mx-auto leading-relaxed">
          A 4-step pipeline from raw sensor data to a plain-English operator alert — all running in under 3 seconds.
        </p>
      </div>

      {/* ── Pipeline Flow ─────────────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-100">
        <div className="flex items-stretch gap-0">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={i} className="flex flex-1 items-stretch">
              {/* Card */}
              <div className={`flex-1 border bg-surface1/60 backdrop-blur-md p-6 flex flex-col gap-2.5 relative transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${i === 0 ? `border-l-4 ${step.borderClass} border-y-borderPrimary border-r-borderPrimary` : 'border-borderPrimary'}`}>
                {/* Step Number */}
                <span className={`text-[11px] font-bold font-mono tracking-widest ${step.colorClass}`}>
                  STEP {step.step}
                </span>
                {/* Label */}
                <p className="text-xl font-bold text-heading">{step.label}</p>
                {/* Tech */}
                <p className={`text-[10px] font-mono tracking-wider border ${step.borderClass} ${step.colorClass} inline-block px-2 py-0.5 self-start rounded-sm bg-bgBase/50`}>
                  {step.tech}
                </p>
                {/* Description */}
                <p className="text-xs text-body leading-relaxed mt-1">{step.desc}</p>
              </div>
              {/* Arrow between steps */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div className="flex items-center justify-center w-10 shrink-0 text-borderPrimary text-xl">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── MCP Explainer ─────────────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-200">
        <h2 className="text-base font-semibold text-heading mb-1.5">
          What is MCP and Why Does It Matter?
        </h2>
        <p className="text-xs text-subtle mb-4">
          The Model Context Protocol is the security and reliability backbone of the entire agent pipeline.
        </p>
        <div className="grid grid-cols-3 gap-0 border border-warn/50 shadow-[0_0_20px_rgba(217,119,6,0.05)] rounded-sm overflow-hidden">
          {[
            {
              label: 'Without MCP',
              icon: '✕',
              iconClass: 'text-critical',
              bgClass: 'bg-bgAlert/80',
              body: 'The AI agent gets raw database access. It can write, delete, or fabricate data. One hallucination could corrupt your entire sensor history or trigger a false emergency shutdown.',
            },
            {
              label: 'What MCP Does',
              icon: '⇄',
              iconClass: 'text-warn',
              bgClass: 'bg-surface2/80',
              body: 'MCP wraps the database behind a typed, schema-validated interface. Each tool call is explicitly defined: name, parameters, return shape. The agent cannot call anything outside this contract.',
            },
            {
              label: 'With MCP (DriftVeil)',
              icon: '✓',
              iconClass: 'text-safe',
              bgClass: 'bg-surface1/80',
              body: 'Agents are restricted to read-only, structured tool calls: get_sensor_snapshot(), get_baseline_profile(), get_fingerprints(). The SCADA database is physically unreachable from the AI layer.',
            },
          ].map((col, i) => (
            <div key={i} className={`p-6 ${i < 2 ? 'border-r border-warn/30' : ''} ${col.bgClass} backdrop-blur-md`}>
              <p className="text-2xl mb-2 flex items-center">
                <span className={col.iconClass}>{col.icon}</span>
              </p>
              <p className="text-xs font-bold text-heading mb-2 uppercase tracking-widest">
                {col.label}
              </p>
              <p className="text-xs text-body leading-relaxed">{col.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 4 Agents Flow ────────────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-300">
        <h2 className="text-base font-semibold text-heading mb-1.5">
          The 4 AI Agents in Detail
        </h2>
        <p className="text-xs text-subtle mb-4">
          Each agent has exactly one job. Agents 3 & 4 are the only ones that call the LLM.
        </p>

        {/* LLM callout banner */}
        <div className="flex items-center gap-3 px-5 py-2.5 border border-critical/40 bg-critical/5 drop-shadow-sm mb-4 rounded-sm">
          <span className="text-[11px] font-mono font-bold text-critical tracking-wider whitespace-nowrap">⚡ LLM CONNECTED</span>
          <span className="text-critical/30">|</span>
          <p className="text-xs text-body">
            <strong className="text-heading">Amazon Bedrock (Claude 3.5 Sonnet)</strong> is called only by Agents 3 and 4. Bedrock Guardrails are applied on every call — the model is not permitted to reason beyond the structured MCP tool data it receives.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {AGENTS.map((agent, i) => (
            <div key={i} className={`border ${agent.llm ? 'border-critical/50 shadow-[0_0_15px_rgba(220,38,38,0.05)]' : 'border-borderPrimary'} bg-surface1/60 backdrop-blur-md rounded-sm overflow-hidden transition-all duration-300 hover:border-borderSubtle`}>
              {/* Card header */}
              <div className="flex items-center gap-3.5 px-5 py-3 border-b border-borderPrimary bg-surface2/50">
                <div className={`w-[30px] h-[30px] rounded-full shrink-0 ${agent.bgColor} text-bgBase flex items-center justify-center text-[13px] font-bold shadow-sm`}>
                  {agent.n}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-bold text-heading tracking-wide uppercase">{agent.name}</p>
                </div>
                <span className={`text-[10px] border ${agent.borderColor} ${agent.textColor} px-2 py-0.5 tracking-wider bg-bgBase/50 rounded-sm font-semibold`}>
                  {agent.tag}
                </span>
              </div>
              {/* Card body */}
              <div className="px-5 py-4 flex flex-col gap-3">
                <p className="text-xs text-body leading-relaxed">{agent.detail}</p>
                <div className="flex flex-col gap-1.5 mt-1 bg-surface2/30 p-3 rounded-sm border border-borderPrimary/50">
                  {[
                    { label: 'Input',  value: agent.input },
                    { label: 'Tool',   value: agent.tool  },
                    { label: 'Output', value: agent.output },
                  ].map(row => (
                    <div key={row.label} className="flex gap-3 items-baseline">
                      <p className="text-[10px] uppercase tracking-widest text-subtle w-11 shrink-0">{row.label}</p>
                      <p className={`text-[11px] font-mono text-body leading-relaxed ${row.label === 'Output' ? 'text-heading font-semibold' : ''}`}>{row.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech Stack Grid ───────────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-500 pb-12">
        <h2 className="text-base font-semibold text-heading mb-4">Full Tech Stack</h2>
        <div className="grid grid-cols-4 gap-4">
          {STACK.map(({ layer, items }) => (
            <div key={layer} className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm overflow-hidden hover:border-borderSubtle transition-colors">
              <div className="px-4 py-2.5 border-b border-borderPrimary bg-surface2/50">
                <p className="text-[10px] uppercase tracking-widest text-warn font-semibold">{layer}</p>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {items.map(item => (
                  <p key={item} className="text-xs text-body leading-relaxed flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-borderSubtle" />
                    {item}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
