import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend
} from 'recharts'
import { SCADA_THRESHOLD } from '../../data/sensorData'
import { CustomTooltip } from './CustomTooltip'

export function SensorChart({ data, height = 320, showScada = true }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
        <CartesianGrid strokeDasharray="2 4" stroke="var(--color-chartGrid)" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: 'var(--color-subtle)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={{ stroke: 'var(--color-borderPrimary)' }}
          interval={19}
        />
        <YAxis
          domain={[30, 110]}
          tick={{ fill: 'var(--color-subtle)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 11, color: 'var(--color-subtle)', paddingTop: 8 }}
          iconType="plainline"
        />
        {showScada && (
          <ReferenceLine
            y={SCADA_THRESHOLD}
            stroke="var(--color-critical)"
            strokeDasharray="5 4"
            strokeWidth={1.5}
            label={{
              value: 'SCADA THRESHOLD',
              fill: 'var(--color-critical)',
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              position: 'insideTopRight',
            }}
          />
        )}
        <Line
          type="monotone"
          dataKey="temperature"
          name="Temperature (°C)"
          stroke="var(--color-chartTemp)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="vibration"
          name="Vibration (mm/s)"
          stroke="var(--color-chartVib)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
