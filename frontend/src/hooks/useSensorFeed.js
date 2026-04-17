import { useState, useEffect, useRef } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'
const WS_BASE = 'ws://127.0.0.1:8000/ws'

export function useSensorFeed(machineId = 'MCH-03') {
  const [chartData,     setChartData]     = useState([])
  const [isRunning,     setIsRunning]     = useState(false)
  const [alertData,     setAlertData]     = useState(null)
  const [stats,         setStats]         = useState(null)
  const [diagnosisRaw,  setDiagnosisRaw]  = useState(null)
  const wsRef = useRef(null)

  async function startFeed() {
    if (!machineId) {
      console.warn('[Frontend] Cannot start feed: machineId is empty.')
      return
    }
    try {
      console.log(`[Frontend] Fetching start-feed for ${machineId}...`)
      const res = await fetch(`${API_BASE}/start-feed?machine_id=${machineId}`, { method: 'POST' })
      const text = await res.text()
      console.log(`[Frontend] start-feed response status:`, res.status, text)
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}: ${text}`)
      }
      setChartData([])
      setAlertData(null)
      setStats(null)
      setDiagnosisRaw(null)
      setIsRunning(true)
    } catch (e) {
      console.error('[Frontend Error] Failed to start feed:', e)
    }
  }

  async function resetFeed() {
    try {
      console.log(`[Frontend] Fetching reset...`)
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' })
      console.log(`[Frontend] reset response status:`, res.status)
      if (wsRef.current) wsRef.current.close()
      setIsRunning(false)
      setChartData([])
      setAlertData(null)
      setStats(null)
      setDiagnosisRaw(null)
    } catch (e) {
      console.error('Failed to reset feed:', e)
    }
  }

  useEffect(() => {
    if (!isRunning || !machineId) return
    
    // Connect to WebSocket
    console.log(`[Frontend] Connecting to WebSocket: ${WS_BASE}/feed/${machineId}...`)
    const ws = new WebSocket(`${WS_BASE}/feed/${machineId}`)
    wsRef.current = ws
    
    ws.onopen = () => console.log(`[Frontend] WebSocket connected successfully!`)
    ws.onerror = (err) => console.error(`[Frontend] WebSocket error:`, err)
    ws.onclose = (event) => console.log(`[Frontend] WebSocket closed:`, event.code, event.reason)

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      // Instant push updates from background LLM task
      if (data.type === 'agent_update') {
        if (data.diagnosis_raw) setDiagnosisRaw(data.diagnosis_raw)
        if (data.alert) setAlertData(data.alert)
        return
      }

      // Stream finished
      if (data.finished) {
        setIsRunning(false)
        ws.close()
        if (data.alert) setAlertData(data.alert)
        return
      }

      // Standard telemetry tick
      if (data.type === 'row_data') {
        if (data.row) {
          data.row.label = `T+${data.row.row_index}`
          setChartData(prev => [...prev, data.row])
        }
        if (data.detection_stats) setStats(data.detection_stats)
        if (data.alert) setAlertData(data.alert)
        if (data.diagnosis_raw) setDiagnosisRaw(data.diagnosis_raw)
      }
    }

    return () => {
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close()
      }
    }
  }, [isRunning, machineId])

  return { chartData, isRunning, alertVisible: !!alertData, alertData, stats, diagnosisRaw, startFeed, resetFeed }
}
