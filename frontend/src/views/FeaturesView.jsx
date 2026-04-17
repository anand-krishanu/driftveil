const PROBLEM_VS_SOLUTION = [
  { problem: 'SCADA alarm triggers AFTER damage occurs.', solution: 'DriftVeil detects the drift BEFORE the threshold is ever touched.' },
  { problem: 'No root cause — just a raw alarm code.', solution: 'Amazon Bedrock identifies the exact failure type in plain English.' },
  { problem: 'Maintenance is time-based guesswork.', solution: 'What-If Simulation projects exact ETA so you act at the right moment.' },
  { problem: 'Multiple sensors drift together — no system notices.', solution: 'Cross-machine correlation catches multi-variate failures SCADA misses.' },
]

const DIFFERENTIATORS = [
  { symbol: '≠', title: 'Slope, Not Spike', desc: 'We catch the slow 0.3°C/day temperature creep over 14 days — not just the moment it exceeds a hard limit.', tag: 'Core Innovation', color: 'var(--accent-warn)' },
  { symbol: '?→!', title: 'Transparent AI', desc: 'Every alert is fully explainable: which data triggered it, which fingerprint matched, why Bedrock concluded what it did.', tag: 'No Black Box', color: 'var(--accent-safe)' },
  { symbol: '⊕', title: 'Augments SCADA', desc: 'We layer on top of existing Siemens and Rockwell infrastructure. Zero replacement cost. Live in 2–4 weeks.', tag: 'Zero Migration', color: 'var(--accent-info)' },
  { symbol: '↺', title: 'Self-Improving', desc: 'Every confirmed failure updates the Fingerprint Library. The system gets more accurate over time — automatically.', tag: 'Feedback Loop', color: 'var(--accent-safe)' },
]

const COMPARISON = [
  { feature: 'Detects hidden drift (Zone 2)',       driftveil: true,  scada: false },
  { feature: 'Root cause in plain English',         driftveil: true,  scada: false },
  { feature: 'Predicts failure ETA',                driftveil: true,  scada: false },
  { feature: 'What-If scenario simulation',         driftveil: true,  scada: false },
  { feature: 'Cross-machine correlation',           driftveil: true,  scada: false },
  { feature: 'Works with existing SCADA hardware',  driftveil: true,  scada: true  },
]

function SectionHeader({ title, sub }) {
  return (
    <div className="px-6 py-3" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-header)' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)' }}>{title}</span>
      {sub && <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 10 }}>{sub}</span>}
    </div>
  )
}

export function FeaturesView() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>

      {/* Page header */}
      <div className="px-6 py-4" style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-header)' }}>
        <div style={{ fontSize: 11, color: 'var(--accent-info)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 600, marginBottom: 4 }}>
          Competitive Advantage
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-heading)', letterSpacing: '-0.01em', marginBottom: 4 }}>
          Why DriftVeil?
        </h1>
        <p style={{ fontSize: 12, color: 'var(--text-subtle)', maxWidth: 560 }}>
          Traditional SCADA systems are <span style={{ color: 'var(--accent-critical)', fontWeight: 600 }}>reactive</span>. DriftVeil is <span style={{ color: 'var(--accent-safe)', fontWeight: 600 }}>predictive</span>. Here is the difference.
        </p>
      </div>

      {/* ROI Numbers */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="ROI Per Drift Event" sub="Based on Aberdeen Group, Deloitte Insights, Siemens Financial Services" />
        <div className="grid grid-cols-5" style={{ background: 'var(--bg-panel)' }}>
          {[
            { value: '$80,000', label: 'Unplanned breakdown cost', color: 'var(--accent-critical)' },
            { value: '→', label: '', color: 'var(--text-muted)' },
            { value: '$2,000', label: 'Planned early repair cost', color: 'var(--accent-safe)' },
            { value: '=', label: '', color: 'var(--text-muted)' },
            { value: '4,000%', label: 'ROI per drift event caught', color: 'var(--accent-warn)' },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center justify-center py-6"
              style={{ borderRight: i < 4 ? '1px solid var(--border)' : 'none' }}
            >
              <span style={{ fontSize: i === 1 || i === 3 ? 28 : 34, fontWeight: 700, fontFamily: 'JetBrains Mono', color: item.color }}>
                {item.value}
              </span>
              {item.label && (
                <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6, textAlign: 'center', maxWidth: 120, lineHeight: 1.4 }}>
                  {item.label}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Problem vs Solution */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="The Problem We Solve" sub="What SCADA cannot do — and what we built instead" />
        {/* Sub-headers */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: '1fr 36px 1fr',
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <span style={{ padding: '8px 20px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-critical)', fontWeight: 700 }}>Legacy SCADA</span>
          <div />
          <span style={{ padding: '8px 20px', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-safe)', fontWeight: 700 }}>DriftVeil</span>
        </div>
        {PROBLEM_VS_SOLUTION.map((row, i) => (
          <div
            key={i}
            className="grid"
            style={{
              gridTemplateColumns: '1fr 36px 1fr',
              borderBottom: '1px solid var(--border-subtle)',
              background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
            }}
          >
            <div style={{ padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'flex-start', borderRight: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--accent-critical)', fontSize: 13, flexShrink: 0 }}>✕</span>
              <span style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.6 }}>{row.problem}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>→</div>
            <div style={{ padding: '12px 20px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--accent-safe)', fontSize: 13, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 12, color: 'var(--text-heading)', lineHeight: 1.6, fontWeight: 500 }}>{row.solution}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Differentiators */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="4 Things No Competitor Does Together" sub="Each is defensible. Together, they form a moat." />
        <div className="grid grid-cols-4">
          {DIFFERENTIATORS.map((d, i) => (
            <div
              key={i}
              style={{
                padding: '20px 20px',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
                borderLeft: `3px solid ${d.color}`,
              }}
            >
              <span style={{ fontSize: 24, fontWeight: 700, fontFamily: 'JetBrains Mono', color: d.color, display: 'block', marginBottom: 8 }}>
                {d.symbol}
              </span>
              <span style={{ fontSize: 10, color: d.color, border: `1px solid ${d.color}`, padding: '1px 6px', letterSpacing: '0.07em', fontFamily: 'JetBrains Mono' }}>
                {d.tag}
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', margin: '10px 0 6px' }}>{d.title}</div>
              <p style={{ fontSize: 11, color: 'var(--text-body)', lineHeight: 1.7 }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Comparison matrix */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="Feature Comparison" />
        <div
          className="grid px-6 py-2"
          style={{
            gridTemplateColumns: '1fr 120px 120px',
            background: 'var(--bg-header)',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {['Capability', 'DriftVeil', 'Legacy SCADA'].map((h, i) => (
            <span key={h} style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: i === 1 ? 'var(--accent-safe)' : 'var(--text-muted)', textAlign: i > 0 ? 'center' : 'left', fontWeight: 600 }}>
              {h}
            </span>
          ))}
        </div>
        {COMPARISON.map((row, i) => (
          <div
            key={i}
            className="grid px-6 py-3"
            style={{
              gridTemplateColumns: '1fr 120px 120px',
              alignItems: 'center',
              borderBottom: i < COMPARISON.length - 1 ? '1px solid var(--border-subtle)' : 'none',
              background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
            }}
          >
            <span style={{ fontSize: 12, color: 'var(--text-heading)', fontWeight: 500 }}>{row.feature}</span>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: 16, color: 'var(--accent-safe)', fontWeight: 700 }}>✓</span>
            </div>
            <div style={{ textAlign: 'center' }}>
              {row.scada
                ? <span style={{ fontSize: 16, color: 'var(--accent-safe)' }}>✓</span>
                : <span style={{ fontSize: 16, color: 'var(--accent-critical)' }}>✕</span>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Market stats */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="Market Opportunity" />
        <div className="grid grid-cols-4">
          {[
            { value: '$8B',      label: 'Global TAM',         sub: 'Predictive Maintenance market',   cite: 'McKinsey & Company, 2023' },
            { value: '$125K/hr', label: 'Avg. Downtime Cost', sub: 'Manufacturing sector per-hour',   cite: 'Deloitte Insights, 2022' },
            { value: '30%',      label: 'Downtime Reduction', sub: 'Predictive vs. reactive baseline',cite: 'McKinsey Global Institute, 2023' },
            { value: '9 days',   label: 'Avg. Early Warning', sub: 'Before threshold breach',         cite: 'DriftVeil internal model' },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                padding: '20px 24px',
                borderRight: i < 3 ? '1px solid var(--border)' : 'none',
                background: i % 2 === 0 ? 'var(--bg-panel)' : 'var(--bg-row-alt)',
              }}
            >
              <span style={{ fontSize: 30, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-warn)', display: 'block', marginBottom: 4 }}>
                {stat.value}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-heading)', display: 'block' }}>{stat.label}</span>
              <span style={{ fontSize: 11, color: 'var(--text-subtle)', display: 'block', marginTop: 3 }}>{stat.sub}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, display: 'block', fontFamily: 'JetBrains Mono' }}>{stat.cite}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
