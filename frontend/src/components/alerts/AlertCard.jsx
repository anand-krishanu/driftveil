import { Divider } from '../ui/Divider'

export function AlertCard({ alert }) {
  const { eventId, machine, title, confidence, eta, score, sensors, action, fingerprint } = alert
  return (
    <div className="bg-bgAlert border-t-2 border-t-critical p-4 flex flex-col gap-2.5 animate-pulse-glow backdrop-blur-md shadow-[0_0_20px_rgba(220,38,38,0.1)]">
      <div className="flex justify-between items-start">
        <span className="text-[10px] font-semibold text-critical tracking-widest uppercase">
          Drift Alert
        </span>
        <span className="text-[10px] text-subtle font-mono">{eventId}</span>
      </div>

      <div>
        <p className="text-sm font-semibold text-heading">{title}</p>
        <p className="text-[11px] text-body mt-0.5">{machine}</p>
      </div>

      <Divider />

      <div className="grid grid-cols-2 gap-y-2 gap-x-4">
        {[
          { label: 'AI Confidence', value: confidence, color: 'text-heading', mono: true },
          { label: 'Est. Failure',  value: eta,        color: 'text-critical', mono: true },
          { label: 'Drift Score',   value: score,      color: 'text-heading',  mono: true },
          { label: 'Sensors',       value: sensors,    color: 'text-body',     mono: false },
        ].map(({ label, value, color, mono }) => (
          <div key={label}>
            <p className="text-[10px] text-subtle uppercase tracking-wider">{label}</p>
            <p className={`text-xs font-medium mt-0.5 ${color} ${mono ? 'font-mono' : ''}`}>
              {value}
            </p>
          </div>
        ))}
      </div>

      <Divider />

      <div>
        <p className="text-[10px] text-subtle uppercase tracking-wider mb-1">
          Prescribed Action
        </p>
        <p className="text-xs text-body leading-relaxed">{action}</p>
      </div>
      <p className="text-[11px] text-subtle">{fingerprint}</p>

      <div className="flex gap-2 mt-1">
        <button className="flex-1 py-1.5 text-[11px] font-medium border border-critical text-critical bg-critical/5 hover:bg-critical/15 transition-colors cursor-pointer rounded-sm">
          Escalate
        </button>
        <button className="flex-1 py-1.5 text-[11px] font-medium border border-borderSubtle text-subtle hover:bg-surface2 transition-colors cursor-pointer rounded-sm">
          Acknowledge
        </button>
      </div>
    </div>
  )
}
