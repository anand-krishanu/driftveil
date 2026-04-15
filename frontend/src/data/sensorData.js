// ─── Sensor Data Simulation ───────────────────────────────────────────────────

export function generateSensorStream() {
  const data = []
  for (let i = 0; i < 200; i++) {
    const isNormal   = i < 80
    const driftFactor = isNormal ? 0 : ((i - 80) / 120) * 28
    const noise       = () => (Math.random() - 0.5) * 2.5
    data.push({
      tick:        i,
      label:       `T+${i}`,
      temperature: parseFloat((58 + driftFactor * 0.9 + noise()).toFixed(2)),
      vibration:   parseFloat((42 + driftFactor * 0.7 + noise()).toFixed(2)),
    })
  }
  return data
}

// Pre-generated static history for Machine Detail page graphs
export function generateHistoricalData(driftOffset = 0) {
  const data = []
  for (let i = 0; i < 120; i++) {
    const noise  = () => (Math.random() - 0.5) * 2
    const drift  = driftOffset > 0 && i > 60 ? ((i - 60) / 60) * driftOffset : 0
    data.push({
      day:         `Day ${i + 1}`,
      temperature: parseFloat((58 + drift * 0.9 + noise()).toFixed(2)),
      vibration:   parseFloat((42 + drift * 0.7 + noise()).toFixed(2)),
      cusum:       parseFloat((drift * 0.5 + Math.max(0, noise())).toFixed(2)),
    })
  }
  return data
}

export const ALL_SENSOR_DATA = generateSensorStream()

// Per-machine historical data keyed by machine ID
export const MACHINE_HISTORY = {
  'MCH-01': generateHistoricalData(0),
  'MCH-02': generateHistoricalData(0),
  'MCH-03': generateHistoricalData(28),  // drifting machine
  'MCH-04': generateHistoricalData(0),
  'MCH-05': generateHistoricalData(0),
  'MCH-06': generateHistoricalData(8),   // warning machine
  'MCH-07': generateHistoricalData(0),
  'MCH-08': generateHistoricalData(0),
}

export const SCADA_THRESHOLD = 100
export const DRIFT_TRIGGER_TICK = 88
