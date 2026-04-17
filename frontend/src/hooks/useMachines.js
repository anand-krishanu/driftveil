import { useEffect, useState } from 'react'

const API_BASE = 'http://127.0.0.1:8000/api'

function normalizeMachine(machine) {
  return {
    id: machine.id,
    name: machine.name,
    line: machine.line || 'Unassigned',
    location: machine.location || 'Unknown',
    status: machine.status || 'NORMAL',
    health: machine.base_health ?? 100,
    temp: typeof machine.temp === 'number' ? machine.temp : 0,
    vib: typeof machine.vib === 'number' ? machine.vib : 0,
    cusum: 0,
    lastMaintenance: 'N/A',
    runtime: 'N/A',
  }
}

export function useMachines() {
  const [machines, setMachines] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  async function refreshMachines() {
    try {
      setIsLoading(true)
      setError(null)
      const res = await fetch(`${API_BASE}/machines`)
      const text = await res.text()
      if (!res.ok) {
        throw new Error(`Failed to fetch machines: ${res.status} ${text}`)
      }
      const payload = JSON.parse(text)
      const rows = Array.isArray(payload.machines) ? payload.machines.map(normalizeMachine) : []
      setMachines(rows)
    } catch (e) {
      setError(e.message || 'Failed to load machines')
      setMachines([])
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshMachines()
  }, [])

  return { machines, isLoading, error, refreshMachines }
}
