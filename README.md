# DriftVeil

DriftVeil is an industrial telemetry and drift-detection demo.

## App Basics

What the app does:

1. Shows machine fleet status (NORMAL, WARN, DRIFT) from database-backed machine records.
2. Streams live sensor telemetry (temperature and vibration) for a selected machine.
3. Runs drift detection on streaming data using moving-window trend logic.
4. Triggers AI diagnosis and operator alert formatting when drift is detected.
5. Lets you create new machines from machine-type templates with generated baseline stream data.

Architecture overview:

- Frontend: React + Vite dashboard
- Backend: FastAPI orchestration and websocket feed
- MCP server: tool-style read layer for machines, sensor history, and fingerprints
- Database: SQLite via Prisma

## Prerequisites

1. Python 3.10+
2. Node.js 18+
3. npm

Optional:

- Add OPENAI_API_KEY to a .env file at repository root for live AI responses.
- Without key, the app still works and falls back to mock diagnosis output.

## Setup (Run Once)

Run all commands from repository root.

1. Create virtual environment

```powershell
python -m venv venv
```

2. Install backend dependencies

```powershell
.\venv\Scripts\python -m pip install -r backend\requirements.txt
```

3. Install frontend dependencies

```powershell
cd frontend
npm install
cd ..
```

4. Generate Prisma client (from backend folder)

```powershell
cd backend
..\venv\Scripts\python -m prisma generate
```

5. Push schema to database

```powershell
..\venv\Scripts\python -m prisma db push
```

6. Seed database with machines, fingerprints, and telemetry

```powershell
..\venv\Scripts\python seed.py
cd ..
```

## Run The App (Every Time)

Open 3 separate terminals from repository root.

### Terminal 1 (MCP server)

```powershell
cd backend
..\venv\Scripts\python -m uvicorn mcp_server:app --host 127.0.0.1 --port 8001
```

Expected: server on http://127.0.0.1:8001

### Terminal 2 (Backend API)

```powershell
cd backend
..\venv\Scripts\python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Expected: server on http://127.0.0.1:8000

### Terminal 3 (Frontend)

```powershell
cd frontend
npm run dev
```

Expected: frontend on http://localhost:5173

## Basic Usage Flow

1. Open http://localhost:5173
2. Select a machine (or create one from Add Machine)
3. Click Start Feed
4. Watch separate temperature and vibration charts update in real time
5. Observe status transition NORMAL -> WARN -> DRIFT as conditions worsen

## Quick Health Checks

Run from repository root:

1. MCP health

```powershell
Invoke-RestMethod "http://127.0.0.1:8001/health"
```

2. Backend health

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/health?machine_id=MCH-03"
```

3. Backend machine list

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/machines"
```

4. Start stream for a machine

```powershell
Invoke-RestMethod -Method Post "http://127.0.0.1:8000/api/start-feed?machine_id=MCH-03"
```

## Recommended Machine List And Sensor Data (Industry Standard)

Use these 5 machine classes as your default production rollout scope for predictive maintenance.

### 1) Motor-Driven Centrifugal Pump

- Typical use: Water, chemicals, utilities
- Common failure modes: Bearing wear, cavitation, seal degradation, imbalance
- Sensor data to collect:
	- Bearing temperature (deg C)
	- Vibration velocity RMS (mm/s)
	- Shaft RPM
	- Suction pressure (bar)
	- Discharge pressure (bar)
	- Motor current (A)

### 2) Rotary Air Compressor

- Typical use: Plant compressed air network
- Common failure modes: Lubrication breakdown, valve wear, thermal overload
- Sensor data to collect:
	- Discharge temperature (deg C)
	- Vibration velocity RMS (mm/s)
	- Shaft RPM
	- Discharge pressure (bar)
	- Oil pressure (bar)
	- Motor current (A)

### 3) Conveyor Drive Gearbox + Motor

- Typical use: Material handling and packaging lines
- Common failure modes: Gear wear, misalignment, overload, chain/belt tension issues
- Sensor data to collect:
	- Gearbox temperature (deg C)
	- Vibration velocity RMS (mm/s)
	- Drive RPM
	- Motor current (A)
	- Torque estimate (Nm)
	- Belt speed (m/s)

### 4) Industrial Fan / Blower Assembly

- Typical use: HVAC, process exhaust, cooling lines
- Common failure modes: Rotor imbalance, looseness, bearing wear, resonance
- Sensor data to collect:
	- Bearing temperature (deg C)
	- Vibration velocity RMS (mm/s)
	- Fan RPM
	- Air flow (m3/h)
	- Differential pressure (Pa)
	- Motor current (A)

### 5) CNC Spindle or High-Speed Rotary Axis

- Typical use: Machining centers and precision manufacturing
- Common failure modes: Spindle bearing wear, thermal drift, lubrication issues
- Sensor data to collect:
	- Spindle temperature (deg C)
	- Vibration acceleration RMS (g) or velocity (mm/s)
	- Spindle RPM
	- Spindle load (%)
	- Lubrication pressure/flow
	- Acoustic emission (optional advanced channel)

### Sensor Standards Guidance

- Temperature: Use RTD/PT100 or industrial thermocouples near bearings and housings
- Vibration: Use ISO 10816/20816 style vibration severity interpretation (mm/s RMS for rotating equipment)
- RPM: Use encoder/tachometer as a baseline context signal for all rotating assets
- Current/Power: Add electrical signature channels for better fault separation
- Pressure/Flow/Torque: Include process context to reduce false positives

### DriftVeil Current Schema vs Expansion

- Currently implemented in DriftVeil telemetry schema:
	- temperature
	- vibration
	- rpm (optional)
- Recommended next expansion fields for industry-grade deployment:
	- current
	- pressure (suction/discharge)
	- flow
	- torque/load
	- lubrication/oil condition indicators

## Troubleshooting

If a server fails to start because port is already in use:

1. Find process using port

	netstat -ano | findstr :8000
	netstat -ano | findstr :8001
	netstat -ano | findstr :5173

2. Kill process by PID

	taskkill /F /PID <PID_NUMBER>

If Prisma commands cannot find schema:

- Run Prisma commands from backend folder, not root.

If frontend cannot fetch data:

1. Confirm MCP (8001) and backend (8000) are both running
2. Confirm database has been seeded via seed.py
3. Confirm machine id MCH-03 exists in seeded data

## Architecture Notes

See ARCHITECTURE.md for system design details.