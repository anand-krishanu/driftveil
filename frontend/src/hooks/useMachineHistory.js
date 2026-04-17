import { useEffect, useMemo, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'
const BASELINE_TEMP = 60.5

function mapHistoryRows(rows) {
  let runningCusum = 0
  return rows.map((row) => {
    runningCusum += Number(row.temperature) - BASELINE_TEMP
    return {
      label: `T+${row.row_index}`,
      temperature: Number(row.temperature),
      vibration: Number(row.vibration),
      cusum: Number(runningCusum.toFixed(2)),
      timestamp: row.timestamp,
    }
  })
}

export function useMachineHistory(machineId, limit = 200) {
  const [history, setHistory] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function loadHistory() {
      if (!machineId) {
        setHistory([])
        return
      }
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/machines/${machineId}/history?start=0&limit=${limit}`)
        const text = await res.text()
        if (!res.ok) {
          throw new Error(`Failed to fetch history: ${res.status} ${text}`)
        }
        const payload = JSON.parse(text)
        if (!cancelled) {
          const rows = Array.isArray(payload.data) ? payload.data : []
          setHistory(mapHistoryRows(rows))
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load history')
          setHistory([])
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadHistory()
    return () => {
      cancelled = true
    }
  }, [machineId, limit])

  const recent60 = useMemo(() => history.slice(-60), [history])

  return { history, recent60, isLoading, error }
}
