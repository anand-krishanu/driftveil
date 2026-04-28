import React, { useState, useRef, useEffect } from 'react'
import { useChatSession } from '../../hooks/useChatSession'

const QUICK_CHIPS = [
  "If I reduce load by 15%?",
  "If I run 8 more hours?",
  "What is the safest immediate action?",
  "If I reduce RPM by 20%?"
]

function SimCard({ sim }) {
  const [open, setOpen] = useState(false)
  if (!sim) return null
  
  const riskColor = sim.risk_level === 'high' ? 'var(--accent-critical)' : sim.risk_level === 'medium' ? 'var(--accent-warn)' : 'var(--accent-safe)'

  return (
    <div style={{ marginTop: 8, background: 'var(--bg-row)', border: '1px solid var(--border)', borderRadius: 4, width: '100%', maxWidth: 450 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-heading)' }}>Simulation Projection • {sim.horizon_minutes}m Horizon</span>
        <span style={{ padding: '2px 6px', fontSize: 9, fontWeight: 700, borderRadius: 2, background: 'rgba(255,255,255,0.05)', border: `1px solid ${riskColor}`, color: riskColor, textTransform: 'uppercase' }}>
          {sim.risk_level} RISK
        </span>
      </div>
      
      <div style={{ padding: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak Temperature</div>
          <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono', color: 'var(--text-heading)', fontWeight: 600 }}>{sim.projected_max_temperature}°C</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Peak Vibration</div>
          <div style={{ fontSize: 16, fontFamily: 'JetBrains Mono', color: 'var(--text-heading)', fontWeight: 600 }}>{sim.projected_max_vibration} mm/s</div>
        </div>
      </div>
      
      <div 
        style={{ padding: '6px 12px', background: 'var(--bg-row-alt)', fontSize: 10, color: 'var(--accent-info)', cursor: 'pointer', display: 'flex', justifyContent: 'center', borderTop: '1px solid var(--border-subtle)' }}
        onClick={() => setOpen(!open)}
      >
        {open ? 'Hide Assumptions ▴' : 'View Assumptions ▾'}
      </div>
      
      {open && (
        <div style={{ padding: 10, fontSize: 11, color: 'var(--text-subtle)', background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
          Assumed intervention: <b>{sim.intervention_type}</b>. Confidence model rates this output as <b>{sim.confidence}</b> based on recent variance.
        </div>
      )}
    </div>
  )
}

export function ChatPanel({ machineId, stats }) {
  const { messages, sendMessage, isLoading } = useChatSession(machineId)
  const [input, setInput] = useState('')
  const msgsEndRef = useRef(null)

  const isEnabled = true

  useEffect(() => {
    msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Removed isEnabled check block so it always shows the chat interface

  const handleSend = (e) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user'
          return (
            <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
              <div 
                style={{ 
                  maxWidth: '75%', 
                  padding: '12px 16px', 
                  borderRadius: isUser ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                  background: isUser ? 'var(--accent-info-dim)' : 'var(--bg-panel)',
                  border: isUser ? '1px solid rgba(87,148,242,0.3)' : '1px solid var(--border)',
                  color: 'var(--text-heading)',
                  fontSize: 13,
                  lineHeight: 1.5
                }}
              >
                {msg.content}
                {!isUser && msg.recommendation && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--accent-info)', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.05em' }}>
                      Recommended Action
                    </div>
                    <div style={{ color: 'var(--text-body)', fontWeight: 500, fontSize: 12 }}>
                      {msg.recommendation}
                    </div>
                  </div>
                )}
              </div>
              {msg.simulation && <SimCard sim={msg.simulation} />}
            </div>
          )
        })}
        {isLoading && (
          <div style={{ alignSelf: 'flex-start', padding: 12, color: 'var(--text-muted)', fontSize: 11 }}>
            Running deterministic projection pipeline...
          </div>
        )}
        <div ref={msgsEndRef} />
      </div>

      {/* Input area */}
      <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--bg-header)' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, overflowX: 'auto', paddingBottom: 4 }}>
          {QUICK_CHIPS.map(chip => (
            <button
              key={chip}
              onClick={() => { setInput(chip); sendMessage(chip); }}
              style={{ padding: '6px 12px', fontSize: 11, background: 'var(--bg-panel)', border: '1px solid var(--border)', borderRadius: 20, color: 'var(--text-subtle)', whiteSpace: 'nowrap', cursor: 'pointer' }}
            >
              {chip}
            </button>
          ))}
        </div>
        
        <form onSubmit={handleSend} style={{ display: 'flex', gap: 10 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a what-if question..."
            style={{ flex: 1, background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '10px 14px', color: 'var(--text-heading)', outline: 'none', borderRadius: 4 }}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            style={{ background: 'var(--accent-info)', color: '#fff', border: 'none', padding: '0 20px', fontWeight: 600, borderRadius: 4, cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (isLoading || !input.trim()) ? 0.6 : 1 }}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  )
}
