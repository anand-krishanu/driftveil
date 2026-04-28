import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts'
import { CustomTooltip } from './CustomTooltip'

const SCADA_THRESHOLD = 100
const SCADA_THRESHOLD_VIB = 1.0

function buildDomain(data, key, floor = 0, minimumMax = null) {
  if (!data || data.length === 0) {
    return [floor, minimumMax !== null ? minimumMax + 1 : floor + 1]
  }
  const values = data
    .map((d) => Number(d[key]))
    .filter((v) => Number.isFinite(v))

  if (values.length === 0) {
    return [floor, minimumMax !== null ? minimumMax + 1 : floor + 1]
  }

  const min = Math.min(...values)
  let max = Math.max(...values)
  if (minimumMax !== null) {
    max = Math.max(max, minimumMax)
  }
  
  const spread = Math.max(max - min, 0.01)
  const pad = spread * 0.2
  return [Math.max(floor, min - pad), max + pad]
}

export function SensorChart({ data, height = 320, showScada = true }) {
  const tempDomain = buildDomain(data, 'temperature', 0, showScada ? SCADA_THRESHOLD : null)
  const vibDomain = buildDomain(data, 'vibration', 0, showScada ? SCADA_THRESHOLD_VIB : null)

  return (
    <div style={{ height, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ height: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-row)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '6px 8px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Temperature (deg C)
        </div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={data} margin={{ top: 6, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="none" stroke="var(--chart-grid)" horizontal={true} vertical={false} strokeOpacity={1} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval={19}
            />
            <YAxis
              domain={tempDomain}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              width={32}
            />
            <Tooltip content={<CustomTooltip />} />
            {showScada && (
              <ReferenceLine
                y={SCADA_THRESHOLD}
                stroke="var(--accent-critical)"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{
                  value: 'SCADA THRESHOLD',
                  fill: 'var(--accent-critical)',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideTopRight',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="temperature"
              name="Temperature (deg C)"
              stroke="var(--chart-temp)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ height: '50%', border: '1px solid var(--border-subtle)', background: 'var(--bg-row)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-muted)', padding: '6px 8px 0', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Vibration (mm/s)
        </div>
        <ResponsiveContainer width="100%" height="88%">
          <LineChart data={data} margin={{ top: 6, right: 16, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="none" stroke="var(--chart-grid)" horizontal={true} vertical={false} strokeOpacity={1} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={{ stroke: 'var(--border)' }}
              interval={19}
            />
            <YAxis
              domain={vibDomain}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              tickLine={false}
              axisLine={false}
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            {showScada && (
              <ReferenceLine
                y={SCADA_THRESHOLD_VIB}
                stroke="var(--accent-critical)"
                strokeDasharray="6 3"
                strokeWidth={1}
                label={{
                  value: 'SCADA THRESHOLD',
                  fill: 'var(--accent-critical)',
                  fontSize: 9,
                  fontFamily: 'JetBrains Mono',
                  position: 'insideTopRight',
                }}
              />
            )}
            <Line
              type="monotone"
              dataKey="vibration"
              name="Vibration (mm/s)"
              stroke="var(--chart-vib)"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
