import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MACHINES } from '../data/machines'
import { SensorChart } from '../components/charts/SensorChart'
import { FeedControls } from '../components/ui/FeedControls'
import { StatusBadge } from '../components/ui/StatusBadge'
import { HealthBar } from '../components/ui/HealthBar'
import { useSensorFeed } from '../hooks/useSensorFeed'

export function EngineerView() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState('MCH-03')
  const { chartData, isRunning, alertVisible, alertData, stats, diagnosisRaw, startFeed, resetFeed } = useSensorFeed(activeId)

  return (
    <div className="flex flex-col h-full bg-bgBase">
      {/* Dense Machine Table */}
      <div className="border-b border-borderPrimary bg-surface1/30 backdrop-blur-sm">
        {/* Table Header */}
        <div className="grid grid-cols-[90px_1fr_110px_80px_100px_130px_90px] px-6 py-2.5 border-b border-borderPrimary bg-surface2/50 backdrop-blur-md">
          {['Machine ID', 'Name', 'Health', 'Temp (°C)', 'Vibration', 'CUSUM Score', 'Status'].map(h => (
            <p key={h} className="text-[10px] uppercase tracking-widest text-subtle font-semibold">{h}</p>
          ))}
        </div>

        {MACHINES.map(m => {
          const liveCusum = m.id === activeId && stats?.cusum_score ? stats.cusum_score : m.cusum
          const liveTemp = m.id === activeId && chartData.length > 0 ? chartData[chartData.length - 1].temperature.toFixed(2) : m.temp
          const liveVib = m.id === activeId && chartData.length > 0 ? chartData[chartData.length - 1].vibration.toFixed(3) : m.vib

          return (
            <div
              key={m.id}
              onClick={() => setActiveId(m.id)}
              onDoubleClick={() => navigate(`/machine/${m.id}`)}
              className={`grid grid-cols-[90px_1fr_110px_80px_100px_130px_90px] px-6 py-3 border-b border-borderSubtle items-center cursor-pointer transition-colors duration-200 ${
                m.id === activeId ? 'bg-bgAlert' : 'hover:bg-surface2'
              }`}
            >
              <p className="text-xs font-mono text-heading">{m.id}</p>
              <p className="text-xs text-body font-medium">{m.name}</p>
              <div className="pr-4"><HealthBar value={Math.max(0, m.health - (m.id === activeId && stats?.cusum_score > 10 ? 15 : 0))} /></div>
              <p className={`text-xs font-mono ${m.id === activeId ? 'text-warn font-semibold' : 'text-body'}`}>{liveTemp}</p>
              <p className={`text-xs font-mono ${m.id === activeId ? 'text-warn font-semibold' : 'text-body'}`}>{liveVib}</p>
              <p className={`text-xs font-mono font-bold ${liveCusum > 10 ? 'text-critical' : liveCusum > 4 ? 'text-warn' : 'text-safe'}`}>
                {liveCusum.toFixed(1)}{liveCusum > 10 ? ' ↑ SIGNAL' : ''}
              </p>
              <div><StatusBadge status={m.id === activeId && stats?.drift_detected ? 'DRIFT' : m.status} /></div>
            </div>
          )
        })}
      </div>

      {/* Chart + Agent Trace */}
      <div className="flex flex-1 min-h-0">
        <div className="flex-1 flex flex-col border-r border-borderPrimary relative">
          <div className="flex items-center justify-between px-6 py-3 border-b border-borderPrimary bg-surface1/20 backdrop-blur-sm">
            <div>
              <h3 className="text-sm text-heading">{activeId} — Statistical Drift Analysis</h3>
              <p className="text-[11px] text-subtle mt-1">
                Drift zone visible after T+80 · SCADA threshold never triggered
              </p>
            </div>
            <FeedControls isRunning={isRunning} chartData={chartData} onStart={startFeed} onReset={resetFeed} />
          </div>
          <div className="p-4 flex-1">
            <SensorChart data={chartData} height={280} />
          </div>
        </div>

        {(stats?.drift_detected || alertVisible) && (
          <div className="w-[360px] p-5 bg-surface1/80 backdrop-blur-xl flex flex-col gap-3 overflow-y-auto shadow-[inset_10px_0_30px_rgba(220,38,38,0.03)] border-l border-critical/20 z-10 animate-in slide-in-from-right-8 duration-300">
            <p className="text-[10px] uppercase tracking-widest text-subtle mb-1">
              Live AI Reasoning Trace
            </p>
            
            {/* Agent 2 shows when stats arrive */}
            {stats && (
              <div className="border border-borderPrimary bg-surface2/50 p-3 rounded-sm backdrop-blur-md">
                <div className="flex justify-between mb-2">
                  <p className="text-[10px] text-warn font-bold uppercase tracking-widest text-shadow-sm">
                    Agent 2: Detection
                  </p>
                </div>
                <p className="text-[11px] text-body font-mono leading-relaxed whitespace-pre-wrap">
                  {`> DRIFT FLAGGED (h > 10)\n> CUSUM: ${stats.cusum_score}\n> Temp Slope: ${stats.slope_temp}°C/t\n> Pipeline handed to Agent 3.`}
                </p>
              </div>
            )}

            {/* Agent 3 shows when polling completes */}
            {diagnosisRaw ? (
              <div className="border border-critical/50 bg-critical/5 p-3 rounded-sm backdrop-blur-md shadow-[0_0_15px_rgba(220,38,38,0.1)]">
                <div className="flex justify-between mb-2">
                  <p className="text-[10px] text-critical font-bold uppercase tracking-widest drop-shadow-sm">
                    Agent 3: Root Cause (Claude 3.5)
                  </p>
                </div>
                <p className="text-[10px] text-body font-mono leading-relaxed whitespace-pre-wrap">
                  {diagnosisRaw}
                </p>
              </div>
            ) : (
              <div className="border border-borderPrimary bg-surface2/50 p-3 rounded-sm backdrop-blur-md animate-pulse">
                <p className="text-[11px] text-subtle font-mono leading-relaxed">Detecting drift & waiting for Bedrock Agent 3...</p>
              </div>
            )}

            {/* Agent 4 Explainer summary */}
            {alertData && (
              <div className="border border-safe/30 bg-safe/5 p-3 rounded-sm backdrop-blur-md">
                <div className="flex justify-between mb-2">
                  <p className="text-[10px] text-safe font-bold uppercase tracking-widest">
                    Agent 4: Explainer
                  </p>
                </div>
                <p className="text-[11px] font-mono leading-relaxed text-safe/90">
                  Alert JSON Object generated and published to Operator Dashboard successfully.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
