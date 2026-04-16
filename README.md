# DriftVeil

DriftVeil is an AI platform that detects early machine degradation via time-series sensor data before standard alarms trigger. It uses a modern React frontend and a FastAPI backend powered by Amazon Bedrock for Agentic root-cause analysis based on the Model Context Protocol (MCP).

## Prerequisites

- **Node.js**: (Version 18+ recommended)
- **Python**: (Version 3.10+)
- **OpenAI / Bedrock API Key**: Your `.env` inside the root directory must contain a valid key (e.g. `OPENAI_API_KEY=your_key_here`) for the Agents to work.

## Setup & Installation

**1. Create a Python Virtual Environment & Install Dependencies:**
```powershell
python -m venv venv
.\venv\Scripts\pip install -r backend\requirements.txt
```

**2. Install Frontend Dependencies:**
```powershell
cd frontend
npm install
cd ..
```

---

## How to Run the App Locally

You will need to open **3 separate terminal windows** inside the root `driftveil` folder to run the ecosystem properly.

### Terminal 1: Start the MCP Server
*This handles the direct, secure data access layer for the AI agents based on the MCP architecture.*
```powershell
.\venv\Scripts\python backend\mcp_server.py
# Runs on: http://127.0.0.1:8001
```

### Terminal 2: Start the FastAPI Backend
*The brains of the system. This runs the live simulation and AI agents.*
```powershell
.\venv\Scripts\uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
# Runs on: http://127.0.0.1:8000
```

### Terminal 3: Start the React Frontend
*The dashboard UI.*
```powershell
cd frontend
npm run dev
# Runs on: http://localhost:5174/
```

Once all 3 services are running, open your browser and go to [http://localhost:5174/](http://localhost:5174/) to test the platform. Click on the machine drill-down for **MCH-03** and select **Start Factory Feed** to trigger the AI agent flow!

---

## Architecture details & Next Steps
Read the full system synchronization audit and future scaling suggestions in [ARCHITECTURE.md](ARCHITECTURE.md)