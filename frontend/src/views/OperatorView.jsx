import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MACHINES } from '../data/machines'
import { SensorChart } from '../components/charts/SensorChart'
import { AlertCard } from '../components/alerts/AlertCard'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { useSensorFeed } from '../hooks/useSensorFeed'

export function OperatorView() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState('MCH-03')
  const { chartData, isRunning, alertVisible, alertData, startFeed, resetFeed } = useSensorFeed(activeId)

  const normalCount = MACHINES.filter(m => m.status === 'NORMAL').length
  const driftCount  = MACHINES.filter(m => m.status === 'DRIFT').length
  const warnCount   = MACHINES.filter(m => m.status === 'WARN').length

  return (
    <div className="flex flex-col h-full bg-bgBase">
      {/* KPI Strip */}
      <div className="grid grid-cols-4 border-b border-borderPrimary divide-x divide-borderPrimary bg-surface1/30 backdrop-blur-sm">
        {[
          { label: 'Active Nodes',   value: MACHINES.length, sub: 'Monitoring',      color: 'text-heading'  },
          { label: 'Healthy',        value: normalCount,      sub: 'No drift',        color: 'text-safe'     },
          { label: 'Warning',        value: warnCount,        sub: 'Monitor closely', color: 'text-warn'     },
          { label: 'Drift Detected', value: driftCount,       sub: 'Action needed',  color: 'text-critical' },
        ].map((kpi, i) => (
          <div key={i} className="px-6 py-4">
            <p className="text-[10px] uppercase tracking-widest text-subtle">{kpi.label}</p>
            <p className={`text-[32px] font-bold my-1 tabular-nums ${kpi.color} drop-shadow-sm`}>{kpi.value}</p>
            <p className="text-[11px] text-subtle">{kpi.sub}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-1 min-h-0">
        {/* Chart Panel */}
        <div className="flex-1 flex flex-col border-r border-borderPrimary">
          <div className="flex items-center justify-between px-6 py-3 border-b border-borderPrimary bg-surface1/20 backdrop-blur-sm">
            <div>
              <h3 className="text-sm text-heading">{activeId} — Live Sensor Feed</h3>
              <p className="text-[11px] text-subtle mt-1">
                Temperature · Vibration · SCADA Threshold
              </p>
            </div>
            <FeedControls isRunning={isRunning} chartData={chartData} onStart={startFeed} onReset={resetFeed} />
          </div>
          <div className="p-4 flex-1">
            <SensorChart data={chartData} height={340} />
            {chartData.length === 0 && (
              <p className="text-center text-muted text-xs mt-3">
                Click "Start Factory Feed" to begin simulation
              </p>
            )}
          </div>
        </div>

        {/* Right Panel: Machine List + Alert */}
        <div className="w-[300px] flex flex-col bg-surface1/50 backdrop-blur-xl border-l border-borderPrimary">
          <div className="px-4 py-2 border-b border-borderSubtle bg-surface1/80">
            <p className="text-[10px] uppercase tracking-widest text-subtle">
              Line Overview — Click to Drill In
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {MACHINES.map(m => (
              <div
                key={m.id}
                onClick={() => setActiveId(m.id)}
                onDoubleClick={() => navigate(`/machine/${m.id}`)}
                className={`flex items-center justify-between px-4 py-2.5 border-b border-borderSubtle cursor-pointer transition-colors duration-200 ${
                  m.id === activeId ? 'bg-bgAlert' : 'hover:bg-surface2'
                }`}
              >
                <div>
                  <p className="text-[13px] text-heading font-medium tracking-wide">{m.name}</p>
                  <p className="text-[10px] text-subtle mt-0.5">{m.id} · {m.line}</p>
                </div>
                <StatusBadge status={m.status} />
              </div>
            ))}
          </div>
          
          {alertVisible && alertData && (
            <div className="p-4 animate-in fade-in slide-in-from-bottom-5 duration-300 relative z-10 w-full mb-0 border-t border-borderPrimary">
               <AlertCard alert={alertData} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
