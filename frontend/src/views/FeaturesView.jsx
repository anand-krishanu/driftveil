import { C } from '../theme'

// ─── The Core Problem ─────────────────────────────────────────────────────────
const PROBLEM_VS_SOLUTION = [
  {
    problem: 'SCADA alarm triggers AFTER damage occurs.',
    solution: 'DriftVeil detects the drift BEFORE the threshold is ever touched.',
  },
  {
    problem: 'No root cause — just a raw alarm code.',
    solution: 'Amazon Bedrock identifies the exact failure type in plain English.',
  },
  {
    problem: 'Maintenance is time-based guesswork.',
    solution: 'What-If Simulation projects exact ETA so you act at the right moment.',
  },
  {
    problem: 'Multiple sensors drift together — no system notices.',
    solution: 'Cross-machine correlation catches multi-variate failures SCADA misses.',
  },
]

// ─── Key Differentiators ──────────────────────────────────────────────────────
const DIFFERENTIATORS = [
  {
    symbol: '≠',
    title: 'Slope, Not Spike',
    desc: 'We catch the slow 0.3°C/day temperature creep over 14 days — not just the moment it exceeds a hard limit.',
    tag: 'Core Innovation',
    color: C.warn,
  },
  {
    symbol: '?→!',
    title: 'Transparent AI',
    desc: 'Every alert is fully explainable: which data triggered it, which fingerprint matched, why Bedrock concluded what it did.',
    tag: 'No Black Box',
    color: C.safe,
  },
  {
    symbol: '⊕',
    title: 'Augments SCADA',
    desc: 'We layer on top of existing Siemens and Rockwell infrastructure. Zero replacement cost. Live in 2–4 weeks.',
    tag: 'Zero Migration',
    color: C.subtle,
  },
  {
    symbol: '↺',
    title: 'Self-Improving',
    desc: 'Every confirmed failure updates the Fingerprint Library. The system gets more accurate over time — automatically.',
    tag: 'Feedback Loop',
    color: C.safe,
  },
]

// ─── 5 Comparison Rows ────────────────────────────────────────────────────────
const COMPARISON = [
  { feature: 'Detects hidden drift (Zone 2)',         driftveil: true,  scada: false },
  { feature: 'Root cause in plain English',           driftveil: true,  scada: false },
  { feature: 'Predicts failure ETA',                  driftveil: true,  scada: false },
  { feature: 'What-If scenario simulation',           driftveil: true,  scada: false },
  { feature: 'Cross-machine correlation',             driftveil: true,  scada: false },
  { feature: 'Works with existing SCADA hardware',    driftveil: true,  scada: true  },
]

// ─── Features View ─────────────────────────────────────────────────────────────
export function FeaturesView() {
  return (
    <div style={{ padding: '40px 48px', display: 'flex', flexDirection: 'column', gap: 48 }}>

      {/* Hero Title */}
      <div style={{ textAlign: 'center' }}>
        <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.2em', color: C.warn, marginBottom: 10 }}>
          Competitive Advantage
        </p>
        <h1 style={{ fontSize: 28, color: C.heading, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
          Why DriftVeil?
        </h1>
        <p style={{ fontSize: 14, color: C.body, maxWidth: 560, margin: '0 auto', lineHeight: 1.8 }}>
          Traditional SCADA systems are <strong style={{ color: C.critical }}>reactive</strong>. DriftVeil is <strong style={{ color: C.safe }}>predictive</strong>. Here is the difference.
        </p>
      </div>

      {/* ── ROI Banner ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        border: `1px solid ${C.border}`, background: C.bgS1, padding: '24px 36px',
      }}>
        {[
          { value: '$80,000', label: 'Cost of one unplanned breakdown', color: C.critical },
          { value: '→', label: '', color: C.border },
          { value: '$2,000',  label: 'Cost of planned early repair', color: C.safe },
          { value: '=', label: '', color: C.border },
          { value: '4,000%', label: 'ROI per drift event caught', color: C.warn },
        ].map((item, i) => (
          <div key={i} style={{ textAlign: 'center' }}>
            <p style={{ fontSize: i === 1 || i === 3 ? 32 : 36, fontWeight: 700, color: item.color, fontFamily: 'JetBrains Mono' }}>
              {item.value}
            </p>
            {item.label && <p style={{ fontSize: 11, color: C.subtle, marginTop: 4, maxWidth: 130, lineHeight: 1.5 }}>{item.label}</p>}
          </div>
        ))}
      </div>

      {/* ── Problem vs Solution Flow ─────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 6 }}>The Problem We Solve</h2>
        <p style={{ fontSize: 12, color: C.subtle, marginBottom: 20 }}>What SCADA cannot do — and what we built instead.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: `1px solid ${C.border}` }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 40px 1fr',
            background: C.bgS2, borderBottom: `1px solid ${C.border}`,
          }}>
            <p style={{ padding: '10px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.critical }}>Legacy SCADA</p>
            <div />
            <p style={{ padding: '10px 20px', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: C.safe }}>DriftVeil</p>
          </div>
          {PROBLEM_VS_SOLUTION.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 40px 1fr',
              borderBottom: i < PROBLEM_VS_SOLUTION.length - 1 ? `1px solid ${C.borderSub}` : 'none',
              background: i % 2 === 0 ? C.bgS1 : C.bgS2,
            }}>
              {/* Problem side */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10, borderRight: `1px solid ${C.border}` }}>
                <span style={{ color: C.critical, fontSize: 16, flexShrink: 0 }}>✕</span>
                <p style={{ fontSize: 12, color: C.body, lineHeight: 1.6 }}>{row.problem}</p>
              </div>
              {/* Arrow */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.border, fontSize: 14 }}>→</div>
              {/* Solution side */}
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: C.safe, fontSize: 16, flexShrink: 0 }}>✓</span>
                <p style={{ fontSize: 12, color: C.heading, lineHeight: 1.6 }}>{row.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key Differentiators ───────────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 6 }}>4 Things No Competitor Does Together</h2>
        <p style={{ fontSize: 12, color: C.subtle, marginBottom: 20 }}>Each differentiator is defensible. Together, they form a moat.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {DIFFERENTIATORS.map((d, i) => (
            <div key={i} style={{ border: `1px solid ${C.border}`, background: C.bgS1, padding: '20px 20px 24px' }}>
              {/* Symbol */}
              <p style={{
                fontSize: 28, fontWeight: 700, color: d.color,
                fontFamily: 'JetBrains Mono', marginBottom: 12,
              }}>
                {d.symbol}
              </p>
              {/* Tag */}
              <span style={{ fontSize: 10, color: d.color, border: `1px solid ${d.color}`, padding: '2px 8px', letterSpacing: '0.08em' }}>
                {d.tag}
              </span>
              {/* Title */}
              <p style={{ fontSize: 15, fontWeight: 600, color: C.heading, margin: '10px 0 6px' }}>{d.title}</p>
              {/* Desc */}
              <p style={{ fontSize: 12, color: C.body, lineHeight: 1.7 }}>{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Simple Comparison Matrix ─────────────────────────────────────── */}
      <div>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: C.heading, marginBottom: 20 }}>Feature Comparison</h2>
        <div style={{ border: `1px solid ${C.border}`, background: C.bgS1 }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 120px 120px',
            padding: '10px 24px', borderBottom: `1px solid ${C.border}`, background: C.bgS2,
          }}>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle }}>Capability</p>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.safe, textAlign: 'center' }}>DriftVeil</p>
            <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', color: C.subtle, textAlign: 'center' }}>Legacy SCADA</p>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 120px 120px',
              padding: '14px 24px', borderBottom: i < COMPARISON.length - 1 ? `1px solid ${C.borderSub}` : 'none',
              alignItems: 'center',
            }}>
              <p style={{ fontSize: 13, color: C.heading }}>{row.feature}</p>
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: 18, color: C.safe }}>✓</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                {row.scada
                  ? <span style={{ fontSize: 18, color: C.safe }}>✓</span>
                  : <span style={{ fontSize: 18, color: C.critical }}>✕</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Market Stats ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0,
        border: `1px solid ${C.border}`,
      }}>
        {[
          { value: '$8B',      label: 'Global TAM',           sub: 'McKinsey Predictive Maintenance 2023' },
          { value: '$125K/hr', label: 'Avg. Downtime Cost',   sub: 'Manufacturing sector average' },
          { value: '9 days',   label: 'Avg. Early Warning',   sub: 'Before SCADA threshold is touched' },
          { value: '2–4 wks',  label: 'Time to First Alert',  sub: 'From initial MCP connection' },
        ].map((stat, i) => (
          <div key={i} style={{
            padding: '20px 24px', textAlign: 'center',
            borderRight: i < 3 ? `1px solid ${C.border}` : 'none',
            background: C.bgS1,
          }}>
            <p style={{ fontSize: 28, fontWeight: 700, color: C.warn, fontFamily: 'JetBrains Mono', marginBottom: 6 }}>{stat.value}</p>
            <p style={{ fontSize: 12, fontWeight: 600, color: C.heading }}>{stat.label}</p>
            <p style={{ fontSize: 11, color: C.subtle, marginTop: 4 }}>{stat.sub}</p>
          </div>
        ))}
      </div>

    </div>
  )
}
