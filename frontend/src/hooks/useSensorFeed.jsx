import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'
const WS_BASE  = 'ws://127.0.0.1:8000/ws'

const SensorFeedContext = createContext(null)

/** Normalize any alert shape coming from the backend into what AlertCard expects */
function normalizeAlert(a) {
  if (!a) return null
  return {
    eventId:     a.eventId     ?? `EVT-${Date.now()}`,
    machine:     a.machine     ?? 'Active Machine',
    title:       a.title       ?? 'Drift Detected',
    confidence:  a.confidence  ?? '--',
    eta:         a.eta         ?? (a.eta_days != null ? `~${a.eta_days} days` : '--'),
    score:       a.score       ?? '--',
    sensors:     a.sensors     ?? 'Temperature, Vibration',
    action:      a.action      ?? 'Inspect equipment.',
    fingerprint: a.fingerprint ?? a.severity ?? '--',
  }
}

export function SensorFeedProvider({ children }) {
  const [activeMachineId, setActiveMachineId] = useState(null)
  const [chartData,       setChartData]       = useState([])
  const [isRunning,       setIsRunning]       = useState(false)
  const [alertData,       setAlertData]       = useState(null)
  const [stats,           setStats]           = useState(null)
  const [diagnosisRaw,    setDiagnosisRaw]    = useState(null)
  const wsRef = useRef(null)

  const safeClose = useCallback(() => {
    const ws = wsRef.current
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
      ws.close()
    }
    wsRef.current = null
  }, [])

  // When the active machine changes, cleanly disconnect and reset
  useEffect(() => {
    safeClose()
    setIsRunning(false)
    setChartData([])
    setAlertData(null)
    setStats(null)
    setDiagnosisRaw(null)
  }, [activeMachineId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function startFeed() {
    if (!activeMachineId) return
    try {
      const res = await fetch(`${API_BASE}/start-feed?machine_id=${activeMachineId}`, { method: 'POST' })
      if (!res.ok) throw new Error('Failed to start feed')
      setChartData([])
      setAlertData(null)
      setStats(null)
      setDiagnosisRaw(null)
      setIsRunning(true)
    } catch (e) {
      console.error('Start feed error', e)
    }
  }

  async function resetFeed() {
    try {
      await fetch(`${API_BASE}/reset`, { method: 'POST' })
    } catch (e) {
      console.error('Reset feed error', e)
    }
    safeClose()
    setIsRunning(false)
    setChartData([])
    setAlertData(null)
    setStats(null)
    setDiagnosisRaw(null)
  }

  useEffect(() => {
    if (!isRunning || !activeMachineId) return

    const ws = new WebSocket(`${WS_BASE}/feed/${activeMachineId}`)
    wsRef.current = ws

    ws.onmessage = (event) => {
      let data
      try { data = JSON.parse(event.data) }
      catch { return }

      // AI agent pushed a diagnosis update
      if (data.type === 'agent_update') {
        if (data.diagnosis_raw) setDiagnosisRaw(data.diagnosis_raw)
        if (data.alert)         setAlertData(normalizeAlert(data.alert))
        return
      }

      // Stream has finished — mark done, do NOT close ws here (cleanup handles it)
      if (data.finished) {
        if (data.alert) setAlertData(normalizeAlert(data.alert))
        setIsRunning(false)
        return
      }

      // Standard telemetry tick
      if (data.type === 'row_data') {
        if (data.row) {
          data.row.label = `T+${data.row.row_index}`
          setChartData(prev => [...prev, data.row])
        }
        if (data.detection_stats) setStats(data.detection_stats)
        if (data.alert)           setAlertData(normalizeAlert(data.alert))
        if (data.diagnosis_raw)   setDiagnosisRaw(data.diagnosis_raw)
      }
    }

    ws.onerror = (e) => console.error('[WS] error', e)

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [isRunning, activeMachineId])

  return (
    <SensorFeedContext.Provider value={{
      activeMachineId,
      setActiveMachineId,
      chartData,
      isRunning,
      alertVisible: !!alertData,
      alertData,
      stats,
      diagnosisRaw,
      startFeed,
      resetFeed,
      clearAlert: () => setAlertData(null),
    }}>
      {children}
    </SensorFeedContext.Provider>
  )
}

export function useSensorFeed() {
  const context = useContext(SensorFeedContext)
  if (!context) {
    throw new Error('useSensorFeed must be used within a SensorFeedProvider')
  }
  return context
}
