// ─── Machine Registry ────────────────────────────────────────────────────────

export const MACHINES = [
  { id: 'MCH-01', name: 'Motor Pump A',    line: 'Line 1', health: 97, temp: 59.2, vib: 43.1, cusum: 0.4,  status: 'NORMAL', location: 'Bay A-1', lastMaintenance: '12 Mar 2026', runtime: '2,847 hrs' },
  { id: 'MCH-02', name: 'Conveyor Belt B', line: 'Line 1', health: 94, temp: 61.0, vib: 44.5, cusum: 1.2,  status: 'NORMAL', location: 'Bay A-2', lastMaintenance: '05 Mar 2026', runtime: '3,120 hrs' },
  { id: 'MCH-03', name: 'Bottling Unit C', line: 'Line 2', health: 71, temp: 73.8, vib: 59.2, cusum: 14.7, status: 'DRIFT',  location: 'Bay B-1', lastMaintenance: '27 Feb 2026', runtime: '4,450 hrs' },
  { id: 'MCH-04', name: 'Rotary Press D',  line: 'Line 2', health: 88, temp: 64.4, vib: 48.3, cusum: 3.1,  status: 'NORMAL', location: 'Bay B-2', lastMaintenance: '18 Mar 2026', runtime: '1,980 hrs' },
  { id: 'MCH-05', name: 'Compressor E',    line: 'Line 3', health: 95, temp: 60.1, vib: 42.8, cusum: 0.7,  status: 'NORMAL', location: 'Bay C-1', lastMaintenance: '20 Mar 2026', runtime: '2,210 hrs' },
  { id: 'MCH-06', name: 'Hydraulic Press', line: 'Line 3', health: 82, temp: 67.9, vib: 51.0, cusum: 6.2,  status: 'WARN',   location: 'Bay C-2', lastMaintenance: '01 Mar 2026', runtime: '3,640 hrs' },
  { id: 'MCH-07', name: 'Fan Assembly G',  line: 'Line 4', health: 99, temp: 57.3, vib: 41.2, cusum: 0.2,  status: 'NORMAL', location: 'Bay D-1', lastMaintenance: '10 Apr 2026', runtime: '890 hrs'  },
  { id: 'MCH-08', name: 'Mixer Unit H',    line: 'Line 4', health: 91, temp: 62.7, vib: 46.4, cusum: 2.0,  status: 'NORMAL', location: 'Bay D-2', lastMaintenance: '08 Apr 2026', runtime: '1,340 hrs' },
]

export const ACTIVE_ALERT = {
  machineId:   'MCH-03',
  machine:     'MCH-03 — Bottling Unit C',
  title:       'Early Bearing Wear Detected',
  confidence:  '89%',
  eta:         '9 Days',
  action:      'Schedule lubrication inspection within 48 hours.',
  sensors:     'Temperature (+2.4σ), Vibration (+1.9σ)',
  score:       '0.74 / 1.0',
  fingerprint: 'Matched 3 historical failure patterns.',
  eventId:     'DV-2024-0847',
}

export const MAINTENANCE_LOG = [
  { date: '27 Feb 2026', type: 'Scheduled',  tech: 'R. Sharma',  action: 'Full lubrication service. Bearing check passed.', result: 'PASS' },
  { date: '12 Jan 2026', type: 'Predictive', tech: 'A. Mehta',   action: 'DriftVeil alert DV-2024-0712. Replaced seal gasket.', result: 'FIXED' },
  { date: '04 Dec 2025', type: 'Emergency',  tech: 'R. Sharma',  action: 'Unplanned stoppage. Motor overheated. Replaced fan belt.', result: 'REPAIRED' },
  { date: '01 Nov 2025', type: 'Scheduled',  tech: 'P. Verma',   action: 'Quarterly inspection. All parameters nominal.', result: 'PASS' },
]

export const AGENT_TRACE = [
  { agent: 'Agent 1 — Monitor',    time: '09:14:23', output: 'get_latest_snapshot("MCH-03") → temp=73.8°C (+2.4σ), vib=59.2 mm/s (+1.9σ)' },
  { agent: 'Agent 2 — Detection',  time: '09:14:24', output: 'CUSUM S_t = 14.7 (h=10) → SIGNAL. 4/4 consecutive windows confirmed.' },
  { agent: 'Agent 3 — Root Cause', time: '09:14:25', output: 'Fingerprint: bearing_wear (sim: 0.89). Last lubrication: 47 days ago. Root cause: degradation.' },
  { agent: 'Agent 4 — Explain',    time: '09:14:26', output: 'Alert DV-2024-0847 written. Predicted breach in 9 days at current drift slope.' },
]
