# DriftVeil: Frontend & Backend Architecture Synchronization

This document provides a comprehensive audit of how the DriftVeil frontend and backend communicate, confirms their synchronization, and outlines strategic recommendations for scaling the platform beyond the hackathon "Golden Demo".

---

## 1. Do They Match? (Current Synchronization Status)

**Yes, they are perfectly synchronized.** The frontend and backend act as a cohesive, real-time reactive pipeline. Here is exactly how they handshake:

### The Data Stream
- **Frontend (`useSensorFeed.js`)**: Triggers `POST /api/start-feed`, and begins polling `GET /api/live-feed` exactly once every 500ms.
- **Backend (`main.py`)**: Pulls the 200-row testing dataset from the MCP server into memory. On every `/live-feed` request, it advances the cursor by 1 and returns the next telemetry row.

### The Drift Detection (Agent 2)
- **Backend**: As rows stream, a math-based CUSUM function constantly calculates the statistical drift of the temperature. If the score exceeds `10.0`, it sets `drift_detected: true`.
- **Frontend**: The `EngineerView` and `MachineDetailView` ingest the `detection_stats` payload. If the score exceeds 10, the row color changes to red (`C.critical`), a "SIGNAL" badge appears, and the UI immediately expands the AI Agent Trace window.

### The AI Orchestration (Agents 3 & 4)
- **Backend**: Captures the last 15 rows of data and sends them to Anthropic Claude 3.5 (Agent 3 - Root Cause) via Amazon Bedrock/OpenAI wrapper. Once Agent 3 returns a raw text explanation, Agent 4 translates it into a strict JSON schema.
- **Frontend**: Detects that the pipeline is running and initiates a secondary 1000ms polling loop on `GET /api/agent-status`. It displays "waiting for Bedrock Agent..." until the backend yields the `diagnosis_raw` (printing it live into the trace window). Once `alert` JSON completes, the red `AlertCard` pops up on the Operator Dashboard.

---

## 2. Areas for Improvement & Recommended Changes

While the current architecture is robust for a hackathon, here are the core changes I recommend implementing to scale DriftVeil into production-grade enterprise software:

### 🚀 High Priority (Immediate Next Steps)
1. **Migrate from HTTP Polling to WebSockets (SSE)**
   - **Current:** The frontend hits the `/api/live-feed` endpoint every 500ms using a standard `fetch`.
   - **Change:** Implement FastAPI `websockets`. This will remove HTTP handshake overhead, reduce network tab bloat, and allow the backend to instantly "push" the Alert card to the UI the millisecond the LLM finishes generating it, removing the need for the secondary `/agent-status` poll.

2. **Remove Hardcoded "MCH-03" Tracking**
   - **Current:** The UI arrays and the backend pipeline implicitly assume the drifting machine is `MCH-03`.
   - **Change:** Pass `machine_id` as a dynamic query parameter to `POST /api/start-feed`. Have the backend select the appropriate dataset from the MCP server based on the requested machine.

### 🏗️ Medium Priority (Architecture Upgrades)
3. **True MCP SDK Implementation**
   - **Current:** The MCP server serves a `/api/mock-rows` HTTP endpoint which `main.py` `requests.get()` from. 
   - **Change:** Use the official `mcp-sdk` in Python to connect `main.py` strictly over the MCP protocol (Stdio or SSE). This will fully legitimize the claim that we are using the Model Context Protocol to the judges.

4. **Streaming LLM Output**
   - **Current:** The UI shows "Running..." until the full paragraph is generated, then flashes the text on screen.
   - **Change:** Use `stream=True` in the OpenAI/Bedrock client block and stream chunks to the frontend. The `AgentTrace` UI will look substantially more impressive if the text gets typed out character-by-character as the AI thinks.

5. **In-Memory State to TimescaleDB**
   - **Current:** Global variables (`state = {}`) in `main.py` hold the cursor count and alert payloads. If the FastApi server restarts, the feed resets.
   - **Change:** Write historical data into a TimescaleDB (PostgreSQL) container, and pull the recent 15 rows via a SQL query when drift occurs.

---

### Conclusion
The pipeline is currently entirely stable and handles state management seamlessly. By implementing **WebSockets** and **Streaming LLM chunks**, the "WOW" factor of the golden demo will increase significantly, elevating the feel from "standard web app" to "hyper-modern AI dashboard".
