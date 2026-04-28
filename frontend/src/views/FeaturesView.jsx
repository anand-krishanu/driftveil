import React from 'react';

function SectionHeader({ title, sub }) {
  return (
    <div className="px-6 py-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-header)' }}>
      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-heading)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</span>
      {sub && <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 12 }}>{sub}</span>}
    </div>
  )
}

export function FeaturesView() {
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%', paddingBottom: 60 }}>

      {/* Page Header */}
      <div className="px-8 py-10" style={{ borderBottom: '2px solid var(--border)', background: 'var(--bg-panel)', backgroundImage: 'radial-gradient(var(--border) 1px, transparent 0)', backgroundSize: '32px 32px' }}>
        <div style={{ fontSize: 12, color: 'var(--accent-info)', textTransform: 'uppercase', letterSpacing: '0.2em', fontWeight: 700, marginBottom: 8 }}>
          The Paradigm Shift
        </div>
        <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-heading)', letterSpacing: '-0.02em', marginBottom: 16, lineHeight: 1.1 }}>
          From Reactive Panic to<br />
          <span style={{ color: 'var(--accent-safe)' }}>Planned Maintenance.</span>
        </h1>
        <p style={{ fontSize: 14, color: 'var(--text-body)', maxWidth: 650, lineHeight: 1.6 }}>
          Most factories operate on a "break-fix" model, waiting for catastrophic failure before taking action. DriftVeil catches the subtle, early statistical deviations <strong style={{ color: 'var(--text-heading)' }}>the Drift</strong> weeks before the machine actually breaks down.
        </p>
      </div>

      {/* Novelty 1: SCADA vs DriftVeil */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="01. Why SCADA Fails at Intelligence" sub="The problem with traditional monitoring" />
        <div className="grid grid-cols-2">
          <div style={{ padding: '32px', borderRight: '1px solid var(--border)', background: 'var(--bg-row-alt)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-critical)', border: '1px solid var(--accent-critical)', padding: '2px 6px', display: 'inline-block', borderRadius: 4, marginBottom: 12 }}>LEGACY SYSTEM</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-critical)', marginBottom: 8 }}>Legacy SCADA (Reactive)</h3>
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>
              Built for control, not intelligence. Hard-coded and rigid, SCADA only flags an alarm when a pre-set threshold is violently breached. By the time the alarm rings, the machine is already damaged and production stops.
            </p>
          </div>
          <div style={{ padding: '32px', background: 'var(--bg-panel)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', color: 'var(--accent-safe)', border: '1px solid var(--accent-safe)', padding: '2px 6px', display: 'inline-block', borderRadius: 4, marginBottom: 12 }}>PREDICTIVE SYSTEM</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent-safe)', marginBottom: 8 }}>DriftVeil (Predictive)</h3>
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>
              Sits above SCADA, streaming real-time high-frequency telemetry. We use dynamic baselines and moving-window math to catch a slow 0.3°C/day temperature creep weeks in advance, transforming operations into planned maintenance.
            </p>
          </div>
        </div>
      </div>

      {/* Novelty 2: MCP Breakthrough */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="02. The MCP AI Breakthrough" sub="Eliminating Hallucinations in Industrial AI" />
        <div style={{ padding: '32px', background: 'var(--bg-panel)' }}>
          <p style={{ fontSize: 14, color: 'var(--text-body)', maxWidth: 800, marginBottom: 24, lineHeight: 1.6 }}>
            Connecting physical sensor data to AI has historically resulted in massive hallucination risks. Our breakthrough is the <strong>Model Context Protocol (MCP)</strong>. We restrict the AI to strict, deterministic data retrieval.
          </p>

          <div className="grid grid-cols-3 gap-6">
            {[
              { step: '1. Deterministic Retrieval', desc: 'When drift is detected, the AI makes a strict tool call via MCP. It cannot guess or scrape the web; it must read the database.' },
              { step: '2. The Fingerprint Anchor', desc: 'MCP retrieves the "Fingerprint Library", a rigid table of known failure signatures specific to that exact machine class.' },
              { step: '3. Constrained Generation', desc: 'Using Gemini Structured Outputs, the AI performs a deterministic match. Grounded entirely in physical truth, hallucination drops to zero.' }
            ].map((item, i) => (
              <div key={i} style={{ background: 'var(--bg-row-alt)', padding: 20, borderRadius: 8, border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent-info)', marginBottom: 8 }}>{item.step}</div>
                <div style={{ fontSize: 12, color: 'var(--text-body)', lineHeight: 1.5 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Novelty 3: Cold Start & Roadmap */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="03. Solving the Cold Start Problem" sub="Day 1 ROI vs. Day 180 Vision" />
        <div className="grid grid-cols-2">
          <div style={{ padding: '32px', borderRight: '1px solid var(--border)', background: 'var(--bg-panel)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Day 1: Statistical Windowing</h3>
            <div style={{ fontSize: 10, color: 'var(--accent-warn)', border: '1px solid var(--accent-warn)', padding: '2px 8px', display: 'inline-block', borderRadius: 4, marginBottom: 12, fontFamily: 'JetBrains Mono' }}>CUSUM Algorithm</div>
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>
              Many predictive maintenance startups fail because their AI requires years of historical data to train before providing value. DriftVeil solves this "cold start" by launching with statistical math (CUSUM). It provides immediate, Day-1 ROI without needing a massive historical dataset.
            </p>
          </div>
          <div style={{ padding: '32px', background: 'var(--bg-row-alt)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-heading)', marginBottom: 8 }}>Day 180: Deep Learning Transition</h3>
            <div style={{ fontSize: 10, color: 'var(--accent-safe)', border: '1px solid var(--accent-safe)', padding: '2px 8px', display: 'inline-block', borderRadius: 4, marginBottom: 12, fontFamily: 'JetBrains Mono' }}>LSTM Neural Networks</div>
            <p style={{ fontSize: 13, color: 'var(--text-body)', lineHeight: 1.6 }}>
              Once we collect 6 months of rich telemetry, our roadmap shifts the core engine to Long Short-Term Memory (LSTM) networks. LSTMs understand non-linear, multi-variate relationships and will allow us to predict exact <strong>Remaining Useful Life (RUL)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Novelty 4: What-If Simulations */}
      <div style={{ borderBottom: '2px solid var(--border)' }}>
        <SectionHeader title="04. What-If LLM Simulations" sub="Interactive operator power" />
        <div style={{ padding: '32px', background: 'var(--bg-panel)', display: 'flex', gap: 40, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 14, color: 'var(--text-body)', lineHeight: 1.6, marginBottom: 16 }}>
              We don't stop at just telling the operator what's wrong. DriftVeil includes an autonomous ReAct Chat Agent that runs <strong>What-If Simulations</strong>.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              An operator can ask: <em style={{ color: 'var(--text-heading)' }}>"What happens if I increase the RPM by 10% on this drifting pump?"</em> The agent simulates the scenario against historical baselines, advising if it's safe to push production or if it will trigger a catastrophic failure.
            </p>
          </div>
          <div style={{ flex: 1, background: 'var(--bg-row-alt)', padding: 24, borderRadius: 8, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>User Query</div>
            <div style={{ fontSize: 13, color: 'var(--text-heading)', background: 'var(--bg-input)', padding: '10px 16px', borderRadius: 6, marginBottom: 16 }}>
              Can I safely increase load by 15% to meet quota?
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontFamily: 'JetBrains Mono' }}>Agent Response</div>
            <div style={{ fontSize: 13, color: 'var(--text-heading)', background: 'var(--accent-critical-dim)', padding: '10px 16px', borderRadius: 6, border: '1px solid var(--accent-critical)' }}>
              <span style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono', background: 'var(--accent-critical)', color: '#000', padding: '2px 6px', borderRadius: 4, marginRight: 8, display: 'inline-block' }}>CRITICAL</span>
              Not recommended. Simulating a 15% load increase projects vibration reaching 0.45mm/s within 2 hours, matching the fingerprint for immediate bearing failure.
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
