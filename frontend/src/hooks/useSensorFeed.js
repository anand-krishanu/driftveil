import { useState, useEffect, useRef } from 'react'
import { ALL_SENSOR_DATA, DRIFT_TRIGGER_TICK } from '../data/sensorData'

// ─── useSensorFeed ────────────────────────────────────────────────────────────
// Encapsulates all simulation state and timer logic.
// Returns: { chartData, isRunning, alertVisible, startFeed, resetFeed }

export function useSensorFeed() {
  const [chartData,     setChartData]     = useState([])
  const [isRunning,     setIsRunning]     = useState(false)
  const [alertVisible,  setAlertVisible]  = useState(false)
  const [tick,          setTick]          = useState(0)
  const intervalRef = useRef(null)

  function startFeed() {
    setChartData([])
    setAlertVisible(false)
    setTick(0)
    setIsRunning(true)
  }

  function resetFeed() {
    clearInterval(intervalRef.current)
    setIsRunning(false)
    setChartData([])
    setAlertVisible(false)
    setTick(0)
  }

  useEffect(() => {
    if (!isRunning) return
    intervalRef.current = setInterval(() => {
      setTick(prev => {
        const next = prev + 1
        if (next >= ALL_SENSOR_DATA.length) {
          clearInterval(intervalRef.current)
          setIsRunning(false)
          return prev
        }
        setChartData(ALL_SENSOR_DATA.slice(0, next))
        if (next === DRIFT_TRIGGER_TICK) setAlertVisible(true)
        return next
      })
    }, 60)
    return () => clearInterval(intervalRef.current)
  }, [isRunning])

  return { chartData, isRunning, alertVisible, startFeed, resetFeed }
}
