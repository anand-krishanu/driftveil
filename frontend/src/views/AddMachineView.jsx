import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://127.0.0.1:8000/api'

export function AddMachineView() {
  const navigate = useNavigate()
  const [types, setTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const [machineType, setMachineType] = useState('')
  const [machineId, setMachineId] = useState('')
  const [name, setName] = useState('')
  const [line, setLine] = useState('Line 1')
  const [location, setLocation] = useState('Bay A-1')
  const [scenario, setScenario] = useState('NORMAL')
  const [points, setPoints] = useState(200)

  const [preview, setPreview] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState('')

  const selectedType = useMemo(
    () => types.find((t) => t.machine_type === machineType) || null,
    [types, machineType]
  )

  useEffect(() => {
    let cancelled = false

    async function loadTypes() {
      try {
        setIsLoading(true)
        setError(null)
        const res = await fetch(`${API_BASE}/machine-types`)
        const text = await res.text()
        if (!res.ok) {
          throw new Error(`Failed to load machine types: ${res.status} ${text}`)
        }
        const payload = JSON.parse(text)
        const rows = Array.isArray(payload.types) ? payload.types : []
        if (!cancelled) {
          setTypes(rows)
          if (rows.length > 0) {
            setMachineType(rows[0].machine_type)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load machine types')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    loadTypes()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!selectedType) {
      return
    }

    if (!name) {
      setName(selectedType.default_name)
    }
  }, [selectedType, name])

  useEffect(() => {
    let cancelled = false

    async function loadPreview() {
      if (!machineType) {
        setPreview(null)
        return
      }

      try {
        const res = await fetch(
          `${API_BASE}/machine-types/${machineType}/preview?scenario=${scenario}&points=${points}`
        )
        const text = await res.text()
        if (!res.ok) {
          throw new Error(`Failed to load preview: ${res.status} ${text}`)
        }
        const payload = JSON.parse(text)
        if (!cancelled) {
          setPreview(payload)
        }
      } catch (e) {
        if (!cancelled) {
          setPreview(null)
          setError(e.message || 'Failed to load preview')
        }
      }
    }

    loadPreview()
    return () => {
      cancelled = true
    }
  }, [machineType, scenario, points])

  async function onSubmit(e) {
    e.preventDefault()
    setSaveMessage('')

    try {
      setIsSaving(true)
      setError(null)

      const payload = {
        machine_type: machineType,
        machine_id: machineId.trim() || undefined,
        name: name.trim() || undefined,
        line: line.trim() || undefined,
        location: location.trim() || undefined,
        scenario,
        points,
      }

      const res = await fetch(`${API_BASE}/machines/auto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const text = await res.text()
      if (!res.ok) {
        throw new Error(`Failed to create machine: ${res.status} ${text}`)
      }

      const result = JSON.parse(text)
      setSaveMessage(`Machine ${result.machine.id} created with ${result.stream.points} data points.`)
      setMachineId('')
      navigate('/', { replace: false })
    } catch (err) {
      setError(err.message || 'Failed to create machine')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full" style={{ background: 'var(--bg-base)' }}>
      <div
        className="px-4 py-2"
        style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-header)' }}
      >
        <div style={{ fontSize: 13, color: 'var(--text-heading)', fontWeight: 700 }}>Add Machine</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
          Select a machine type and DriftVeil auto-fills sensor fields, baseline, and dummy stream profile.
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <form className="p-4 flex flex-col gap-3" style={{ width: 420, borderRight: '1px solid var(--border)' }} onSubmit={onSubmit}>
          {isLoading && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Loading machine types...</div>}
          {error && <div style={{ color: 'var(--accent-critical)', fontSize: 12 }}>{error}</div>}
          {saveMessage && <div style={{ color: 'var(--accent-safe)', fontSize: 12 }}>{saveMessage}</div>}

          <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
            Machine Type
            <select
              value={machineType}
              onChange={(e) => setMachineType(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
              required
            >
              {types.map((t) => (
                <option key={t.machine_type} value={t.machine_type}>
                  {t.label}
                </option>
              ))}
            </select>
          </label>

          <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
            Machine ID (optional)
            <input
              value={machineId}
              onChange={(e) => setMachineId(e.target.value)}
              placeholder="MCH-09"
              style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
            />
          </label>

          <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
            Name
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              Line
              <input
                value={line}
                onChange={(e) => setLine(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
              />
            </label>
            <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              Location
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              Scenario
              <select
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
              >
                <option value="NORMAL">NORMAL</option>
                <option value="WARN">WARN</option>
                <option value="DRIFT">DRIFT</option>
              </select>
            </label>
            <label style={{ fontSize: 11, color: 'var(--text-subtle)' }}>
              Stream Points
              <input
                type="number"
                min={50}
                max={1000}
                value={points}
                onChange={(e) => setPoints(Number(e.target.value || 200))}
                style={{ width: '100%', marginTop: 4, padding: '8px 10px', background: 'var(--bg-row)', border: '1px solid var(--border)', color: 'var(--text-body)' }}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isSaving || !machineType}
            style={{ marginTop: 8, padding: '9px 12px', border: '1px solid var(--accent-info)', background: 'var(--accent-info-dim)', color: 'var(--accent-info)', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}
          >
            {isSaving ? 'Creating...' : 'Create Machine With Auto Stream'}
          </button>
        </form>

        <div className="flex-1 min-h-0 overflow-auto p-4">
          <div style={{ fontSize: 12, color: 'var(--text-heading)', fontWeight: 600, marginBottom: 10 }}>Auto-filled Profile Preview</div>

          {!preview && <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>Select a machine type to preview profile data.</div>}

          {preview && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(preview.baseline || {}).map(([k, v]) => (
                  <div key={k} style={{ border: '1px solid var(--border)', background: 'var(--bg-row-alt)', padding: '10px 12px' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k} baseline</div>
                    <div style={{ fontSize: 18, color: 'var(--text-heading)', fontFamily: 'JetBrains Mono', fontWeight: 700, marginTop: 3 }}>{v}</div>
                  </div>
                ))}
              </div>

              <div style={{ border: '1px solid var(--border)', background: 'var(--bg-row-alt)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Sensor Fields</div>
                <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-body)' }}>
                  {(preview.sensor_fields || []).join(' | ')}
                </div>
              </div>

              <div style={{ border: '1px solid var(--border)', background: 'var(--bg-row-alt)', padding: '10px 12px' }}>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Generated Stream Sample</div>
                <div style={{ marginTop: 8, overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', color: 'var(--text-muted)', paddingBottom: 6 }}>Timestamp</th>
                        <th style={{ textAlign: 'right', color: 'var(--text-muted)', paddingBottom: 6 }}>Temp</th>
                        <th style={{ textAlign: 'right', color: 'var(--text-muted)', paddingBottom: 6 }}>Vibration</th>
                        <th style={{ textAlign: 'right', color: 'var(--text-muted)', paddingBottom: 6 }}>RPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(preview.sample || []).map((row) => (
                        <tr key={row.time}>
                          <td style={{ color: 'var(--text-body)', padding: '4px 0' }}>{row.time}</td>
                          <td style={{ color: 'var(--text-body)', textAlign: 'right', padding: '4px 0', fontFamily: 'JetBrains Mono' }}>{row.temperature}</td>
                          <td style={{ color: 'var(--text-body)', textAlign: 'right', padding: '4px 0', fontFamily: 'JetBrains Mono' }}>{row.vibration}</td>
                          <td style={{ color: 'var(--text-body)', textAlign: 'right', padding: '4px 0', fontFamily: 'JetBrains Mono' }}>{row.rpm}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
