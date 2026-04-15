# DriftVeil: 48-Hour Scrappy Prototype Execution Plan

This is a ruthless 48-hour hackathon execution plan explicitly designed for a 2-person team skipping heavy AWS infrastructure in favor of a local prototype.

**Roles:**
*   **Developer A (Frontend):** React (Vite), shadcn/ui, Recharts, Dashboard Polish
*   **Developer B (Backend):** Python, FastAPI, MCP, OpenAI API Integration

---

## 🕒 Phase 1: Environment & Repository Setup (Hour 1)
**Developer A (Frontend):**
1. Create a `driftveil-prototype` root folder. Inside it, create the `/frontend` directory.
2. Initialize app: `npm create vite@latest . -- --template react-ts`
3. Initialize UI library: `npx shadcn@latest init`
4. Install charting library: `npm install recharts`

**Developer B (Backend):**
1. Create the `/backend` directory inside the root.
2. Create and activate a Python virtual environment: `python -m venv venv`
3. Install dependencies: `pip install fastapi uvicorn pandas openai mcp`
4. Create a `.env` file and add: `OPENAI_API_KEY=your_key_here`

---

## 🕒 Phase 2: The Foundation Data (Hours 2–4)
**Developer B (Backend Only):**
1. **Create the Sensor Stream (`sensor_stream.csv`):** 
   * Write a simple script to generate ~200 rows of pseudo-random data.
   * Columns: `timestamp, temperature, vibration`. 
   * Rows 1–100: "Normal Baseline" where numbers bounce slightly.
   * Rows 101–200: "Drift Zone" where numbers slowly slope upward continuously, but **never** go high enough to touch your imaginary maximum SCADA threshold.
2. **Create the Fingerprints (`fingerprints.json`):** 
   * Write a JSON file containing matched failure patterns.
   * Example: `{"issue": "Early Bearing Wear", "pattern": "temperature and vibration increasing simultaneously over time."}`

---

## 🕒 Phase 3: The MCP Server (Hours 4–8)
**Developer B (Backend Only):**
1. **Write `mcp_server.py`:**
   * Create a local Python MCP server offering two typed tools to the agent backend:
   * **Tool 1:** `get_sensor_data(start_limit)` -> Reads and returns rows from your CSV.
   * **Tool 2:** `get_fingerprints()` -> Reads and returns the JSON file.

*(Meanwhile, Developer A should begin building out the static UI shell based on shadcn components.)*

---

## 🕒 Phase 4: Agent API & Math Engine (Hours 8–18)
**Developer B (Backend Only):**
1. **Build `main.py` (FastAPI):**
   * Create an endpoint `/api/live-feed` to serve data array chunks to the frontend.
2. **Build the "Hackathon Agents" as Python Functions:**
   * **Agent 1 (Monitor):** Python loop/function fetching the latest 10 rows from the CSV via MCP.
   * **Agent 2 (Detection):** Use Pandas to calculate a moving average/CUSUM score. If the slope exceeds `X`, flag `drift_detected=True`.
   * **Agent 3 (Root Cause):** When flagged, pass the 10 bad rows + the fingerprints JSON to `gpt-4o`. Prompt: *"Match this drifting data against these fingerprints. Diagnose the root cause."*
   * **Agent 4 (Explanation):** Send Agent 3's output to OpenAI again. Prompt: *"Return strict JSON formatting this diagnosis for an operator: `{"title": "", "eta_days": X, "action": ""}`"*

---

## 🕒 Phase 5: The Dashboard UI (Hours 18–28)
**Developer A (Frontend Only):**
1. **Build the Layout:** Dark mode shell, Sidebar, Main Chart prominent in center.
2. **The Magic Line (Crucial):** Inside the Recharts component, hardcode the "Traditional Alarm line": `<ReferenceLine y={100} stroke="red" strokeDasharray="3 3"/>`. It is vital that the data line never touches this red line during the demo.
3. **The Live Feed:** Write logic to `setInterval()` fetch from `/api/live-feed` and animate the data coming into the chart left-to-right.
4. **The Alert Component:** Build a beautiful glassmorphism Alert Card. Keep it completely hidden (`display: none`) until the backend API returns the Agent 4 alert JSON, then animate its appearance.

---

## 🕒 Phase 6: The Golden Demo Integration (Hours 28–40)
**Both Developers:**
1. **Wire it Together:** Dev A adds a "Start Factory Feed" button. When clicked, it tells Dev B's backend to start stepping through the CSV from row 1 to 200, one row per second.
2. **Execute the Golden Flow:**
   * Watch the chart draw.
   * Halfway through, the data hits the "Drift Zone" and starts sloping up.
   * The Pandas math catches it → Triggers OpenAI agents.
   * **The Magic Moment:** Long before the data line touches the red SCADA threshold, the AI API returns the final JSON, and the Alert Card pops up on Developer A's UI.
3. **Lock Down & Pitch Polish (Hours 40-48):**
   * STOP feature development.
   * Hard-code the OpenAI prompt constraints to guarantee absolute zero hallucination during the live demo.
   * Developer A polishes the UI spacing and adds the static HTML "ROI Waterfall Chart".
   * Run the physical click-through demo 10 times perfectly.
