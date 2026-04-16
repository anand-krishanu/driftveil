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
    colorClass: 'text-warn',
    borderColor: 'border-warn',
  },
  {
    symbol: '?→!',
    title: 'Transparent AI',
    desc: 'Every alert is fully explainable: which data triggered it, which fingerprint matched, why Bedrock concluded what it did.',
    tag: 'No Black Box',
    colorClass: 'text-safe',
    borderColor: 'border-safe',
  },
  {
    symbol: '⊕',
    title: 'Augments SCADA',
    desc: 'We layer on top of existing Siemens and Rockwell infrastructure. Zero replacement cost. Live in 2–4 weeks.',
    tag: 'Zero Migration',
    colorClass: 'text-subtle',
    borderColor: 'border-borderPrimary',
  },
  {
    symbol: '↺',
    title: 'Self-Improving',
    desc: 'Every confirmed failure updates the Fingerprint Library. The system gets more accurate over time — automatically.',
    tag: 'Feedback Loop',
    colorClass: 'text-safe',
    borderColor: 'border-safe',
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
    <div className="px-12 py-10 flex flex-col gap-12 bg-bgBase min-h-full">

      {/* Hero Title */}
      <div className="text-center animate-in slide-in-from-bottom-4 duration-500">
        <p className="text-[11px] uppercase tracking-[0.2em] text-warn mb-2.5 font-bold">
          Competitive Advantage
        </p>
        <h1 className="text-[28px] text-heading font-bold tracking-tight mb-2">
          Why DriftVeil?
        </h1>
        <p className="text-sm text-body max-w-[560px] mx-auto leading-relaxed">
          Traditional SCADA systems are <strong className="text-critical">reactive</strong>. DriftVeil is <strong className="text-safe">predictive</strong>. Here is the difference.
        </p>
      </div>

      {/* ── ROI Banner ────────────────────────────────────────────────── */}
      <div className="border border-borderPrimary bg-surface1/60 backdrop-blur-md rounded-sm overflow-hidden animate-in fade-in duration-500 delay-100">
        <div className="flex items-center justify-between px-9 py-6">
          {[
            { value: '$80,000', label: 'Cost of one unplanned breakdown', colorClass: 'text-critical' },
            { value: '→', label: '', colorClass: 'text-borderPrimary' },
            { value: '$2,000',  label: 'Cost of planned early repair', colorClass: 'text-safe' },
            { value: '=', label: '', colorClass: 'text-borderPrimary' },
            { value: '4,000%', label: 'ROI per drift event caught', colorClass: 'text-warn' },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <p className={`${i === 1 || i === 3 ? 'text-[32px]' : 'text-[36px]'} font-bold font-mono tracking-tight ${item.colorClass} drop-shadow-sm`}>
                {item.value}
              </p>
              {item.label && <p className="text-[11px] text-subtle mt-1 max-w-[130px] mx-auto leading-relaxed">{item.label}</p>}
            </div>
          ))}
        </div>
        <div className="px-9 py-2.5 border-t border-borderPrimary bg-surface2/50 relative overflow-hidden">
          <p className="text-[10px] text-muted relative z-10 w-full whitespace-nowrap overflow-hidden text-ellipsis">
            Sources: Aberdeen Group “The ROI of Predictive Maintenance” (2022) · Deloitte Insights “Predictive Maintenance 4.0” (2022) · Siemens Financial Services “Planned vs. Unplanned Maintenance Cost Ratio” (2021)
          </p>
        </div>
      </div>

      {/* ── Problem vs Solution Flow ─────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-200">
        <h2 className="text-base font-bold text-heading mb-1.5 uppercase tracking-wide">The Problem We Solve</h2>
        <p className="text-xs text-subtle mb-5 relative pl-4 border-l-2 border-warn/50">What SCADA cannot do — and what we built instead.</p>
        <div className="flex flex-col gap-0 border border-borderPrimary rounded-sm overflow-hidden shadow-sm">
          {/* Header */}
          <div className="grid grid-cols-[1fr_40px_1fr] bg-surface2/80 border-b border-borderPrimary backdrop-blur-md">
            <p className="px-5 py-2.5 text-[11px] uppercase tracking-widest text-critical font-bold text-shadow-sm">Legacy SCADA</p>
            <div />
            <p className="px-5 py-2.5 text-[11px] uppercase tracking-widest text-safe font-bold text-shadow-sm">DriftVeil</p>
          </div>
          {PROBLEM_VS_SOLUTION.map((row, i) => (
            <div key={i} className={`grid grid-cols-[1fr_40px_1fr] ${i < PROBLEM_VS_SOLUTION.length - 1 ? 'border-b border-borderSubtle' : ''} ${i % 2 === 0 ? 'bg-surface1/60' : 'bg-surface2/40'} backdrop-blur-sm group hover:bg-surface3/40 transition-colors`}>
              {/* Problem side */}
              <div className="px-5 py-4 flex items-center gap-3.5 border-r border-borderPrimary">
                <span className="text-critical text-base shrink-0 group-hover:scale-110 transition-transform">✕</span>
                <p className="text-xs text-body leading-relaxed">{row.problem}</p>
              </div>
              {/* Arrow */}
              <div className="flex items-center justify-center text-borderPrimary/60 text-sm">→</div>
              {/* Solution side */}
              <div className="px-5 py-4 flex items-center gap-3.5">
                <span className="text-safe text-base shrink-0 group-hover:scale-110 transition-transform">✓</span>
                <p className="text-xs text-heading leading-relaxed font-medium">{row.solution}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Key Differentiators ───────────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-300">
        <h2 className="text-base font-bold text-heading mb-1.5 uppercase tracking-wide">4 Things No Competitor Does Together</h2>
        <p className="text-xs text-subtle mb-5 relative pl-4 border-l-2 border-warn/50">Each differentiator is defensible. Together, they form a moat.</p>
        <div className="grid grid-cols-4 gap-4">
          {DIFFERENTIATORS.map((d, i) => (
            <div key={i} className="border border-borderPrimary bg-surface1/60 p-5 backdrop-blur-md rounded-sm hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:border-borderSubtle">
              {/* Symbol */}
              <p className={`text-[28px] font-bold font-mono mb-3 ${d.colorClass} drop-shadow-sm`}>
                {d.symbol}
              </p>
              {/* Tag */}
              <span className={`text-[10px] border ${d.borderColor} ${d.colorClass} px-2 py-0.5 tracking-widest uppercase bg-bgBase/50 rounded-sm font-semibold`}>
                {d.tag}
              </span>
              {/* Title */}
              <p className="text-[15px] font-bold text-heading mt-3 mb-1.5">{d.title}</p>
              {/* Desc */}
              <p className="text-xs text-body leading-relaxed">{d.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Simple Comparison Matrix ─────────────────────────────────────── */}
      <div className="animate-in fade-in duration-500 delay-[400ms]">
        <h2 className="text-base font-bold text-heading mb-5 uppercase tracking-wide">Feature Comparison</h2>
        <div className="border border-borderPrimary bg-surface1/60 rounded-sm overflow-hidden backdrop-blur-md shadow-sm">
          <div className="grid grid-cols-[1fr_120px_120px] px-6 py-2.5 border-b border-borderPrimary bg-surface2/80">
            <p className="text-[10px] uppercase tracking-widest text-subtle font-bold">Capability</p>
            <p className="text-[10px] uppercase tracking-widest text-safe text-center font-bold">DriftVeil</p>
            <p className="text-[10px] uppercase tracking-widest text-subtle text-center font-bold">Legacy SCADA</p>
          </div>
          {COMPARISON.map((row, i) => (
            <div key={i} className={`grid grid-cols-[1fr_120px_120px] px-6 py-3.5 items-center ${i < COMPARISON.length - 1 ? 'border-b border-borderSubtle' : ''} hover:bg-surface2/30 transition-colors`}>
              <p className="text-[13px] text-heading font-medium tracking-wide">{row.feature}</p>
              <div className="text-center">
                <span className="text-lg text-safe font-bold drop-shadow-[0_0_8px_rgba(22,163,74,0.4)]">✓</span>
              </div>
              <div className="text-center">
                {row.scada
                  ? <span className="text-lg text-safe opacity-80">✓</span>
                  : <span className="text-lg text-critical opacity-80">✕</span>
                }
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Bottom Market Stats ─────────────────────────────────────────────── */}
      <div className="border border-borderPrimary rounded-sm overflow-hidden shadow-sm animate-in fade-in duration-500 delay-[500ms]">
        <div className="grid grid-cols-4 gap-0">
          {[
            { value: '$8B',      label: 'Global TAM',          sub: 'Predictive Maintenance market size', cite: 'McKinsey & Company, 2023' },
            { value: '$125K',    label: 'Avg. Downtime Cost',  sub: 'Manufacturing sector per-hour loss', cite: 'Deloitte Insights, 2022' },
            { value: '30%',      label: 'Downtime Reduction',  sub: 'Achievable with predictive vs. reactive', cite: 'McKinsey Global Institute, 2023' },
            { value: '9 days',   label: 'Avg. Early Warning',  sub: 'Before threshold breach at current drift', cite: 'DriftVeil internal model' },
          ].map((stat, i) => (
            <div key={i} className={`px-6 py-5 text-center bg-surface1/60 backdrop-blur-md ${i < 3 ? 'border-r border-borderPrimary' : ''} group hover:bg-surface1 transition-colors`}>
              <p className="text-[28px] font-bold font-mono text-warn mb-1.5 drop-shadow-sm group-hover:scale-105 transition-transform">{stat.value}</p>
              <p className="text-xs font-bold text-heading uppercase tracking-wider">{stat.label}</p>
              <p className="text-[11px] text-subtle mt-1 leading-relaxed">{stat.sub}</p>
            </div>
          ))}
        </div>
        {/* Citation row */}
        <div className="grid grid-cols-4 border-t border-borderPrimary bg-surface2/50 backdrop-blur-md">
          {[
            'McKinsey & Company — “Unlocking the potential of the Industrial Internet of Things”, 2023',
            'Deloitte Insights — “Predictive Maintenance 4.0: Predict the unpredictable”, 2022',
            'McKinsey Global Institute — “A future that works: Automation, employment, and productivity”, 2023',
            'DriftVeil prototype simulation — MCH-03 Bottling Unit C drift test, April 2026',
          ].map((cite, i) => (
            <p key={i} className={`text-[9px] text-muted px-3.5 py-2 leading-relaxed ${i < 3 ? 'border-r border-borderPrimary' : ''}`}>
              [{i + 1}] {cite}
            </p>
          ))}
        </div>
      </div>

      {/* ── Sources Section ─────────────────────────────────────────────── */}
      <div className="border border-borderPrimary bg-surface1/60 rounded-sm overflow-hidden backdrop-blur-md shadow-sm mb-12 animate-in fade-in duration-500 delay-[600ms]">
        <div className="px-5 py-3 border-b border-borderPrimary bg-surface2/80">
          <p className="text-[10px] uppercase tracking-widest text-subtle font-bold">References & Sources</p>
        </div>
        <div className="px-6 py-4 flex flex-col gap-2.5">
          {[
            { id: 'S1', title: 'McKinsey & Company', year: '2023', doc: '“Unlocking the potential of the Industrial Internet of Things” — Global TAM estimate ($8B), 30% downtime reduction benchmark.', url: 'mckinsey.com' },
            { id: 'S2', title: 'Deloitte Insights', year: '2022', doc: '“Predictive Maintenance 4.0: Predict the unpredictable” — $125,000/hr manufacturing downtime cost, planned vs. unplanned cost ratio.', url: 'deloitte.com' },
            { id: 'S3', title: 'Aberdeen Group', year: '2022', doc: '“The ROI of Predictive Maintenance” — Planned repair cost vs. emergency breakdown cost differential supporting 4,000% ROI calculation.', url: 'aberdeen.com' },
            { id: 'S4', title: 'Siemens Financial Services', year: '2021', doc: '“the economics of predictive maintenance” — Replacement cost avoidance and OEE improvement benchmarks for SME manufacturing lines.', url: 'siemens.com' },
            { id: 'S5', title: 'Gartner', year: '2023', doc: '“Predictive Analytics in Manufacturing Operations” — OEE improvement figures and false positive rate benchmarks for CUSUM-based detection.', url: 'gartner.com' },
            { id: 'S6', title: 'AWS / Anthropic', year: '2024', doc: 'Amazon Bedrock product documentation — Claude 3.5 Sonnet capabilities, Bedrock Guardrails hallucination prevention, and AWS Strands Agent framework specification.', url: 'aws.amazon.com/bedrock' },
          ].map((s, idx, arr) => (
            <div key={s.id} className={`flex gap-4 pb-2.5 ${idx < arr.length - 1 ? 'border-b border-borderSubtle' : ''}`}>
              <span className="text-[10px] text-warn font-mono font-bold w-6 shrink-0 pt-0.5">{s.id}</span>
              <div>
                <p className="text-xs text-heading font-semibold">
                  {s.title} <span className="text-subtle font-normal">({s.year})</span>
                </p>
                <p className="text-[11px] text-body mt-0.5 leading-relaxed">{s.doc}</p>
                <p className="text-[10px] text-muted mt-0.5 font-mono tracking-wider">{s.url}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
