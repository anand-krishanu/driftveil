"""
main.py
=======
DriftVeil FastAPI Backend — The Brain of the System

Endpoints:
  POST /api/start-feed         → Resets the live feed cursor for a specific machine
  GET  /api/reset              → Full reset of all state
  WS   /ws/feed/{machine_id}   → Streams data and LLM alerts at 2Hz natively

Agent Pipeline (runs automatically when drift is detected):
  Agent 1 (Monitor)    → Polls latest 10 rows via MCP
  Agent 2 (Detection)  → CUSUM + moving average to detect drift
  Agent 3 (Root Cause) → GPT-4o matches drifting data to fingerprints
  Agent 4 (Explainer)  → GPT-4o formats diagnosis for operator display

How to run:
    uvicorn main:app --host 127.0.0.1 --port 8000 --reload

Prerequisites:
    1. mcp_server.py must be running on port 8001
    2. .env must contain OPENAI_API_KEY=your_key_here
    3. sensor_stream.csv must exist (run generate_data.py first)
"""

import os
import json
import asyncio
import httpx
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv

from fastapi import FastAPI, BackgroundTasks, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    print("[WARNING] OPENAI_API_KEY not found in .env - AI agents will not work!")

# ── Config ────────────────────────────────────────────────────────────────────
MCP_BASE_URL   = "http://127.0.0.1:8001"
CHUNK_SIZE     = 1          # rows to advance per /api/live-feed call
DRIFT_WINDOW   = 15         # rows for moving average calculation
DRIFT_SLOPE_THRESHOLD = 0.15  # °C increase per row triggers detection

# ── App setup ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DriftVeil Backend",
    description="Industrial drift detection with AI-powered root cause agents.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],       # Allow the frontend (any origin during prototype)
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Shared in-memory state (Multi-tenant) ─────────────────────────────────────────────────────
states = {}

def get_state(machine_id: str) -> dict:
    if machine_id not in states:
        states[machine_id] = {
            "cursor":          0,
            "running":         False,
            "all_rows":        [],
            "sent_rows":       [],
            "drift_detected":  False,
            "agent_running":   False,
            "alert":           None,
            "diagnosis_raw":   None,
        }
    return states[machine_id]

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPER: Load all rows from MCP server into memory
# ═══════════════════════════════════════════════════════════════════════════════

async def load_all_rows_from_mcp(machine_id: str) -> list:
    """Fetch all 200 rows from the MCP server and cache them."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{MCP_BASE_URL}/tools/get_sensor_data", params={"start": 0, "limit": 200, "machine_id": machine_id})
        resp.raise_for_status()
        data = resp.json()
        return data["data"]


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 1 — Monitor: Fetch latest N rows via MCP
# ═══════════════════════════════════════════════════════════════════════════════

async def agent_monitor(start: int, machine_id: str, limit: int = 10) -> list:
    """
    Agent 1: Monitor
    ----------------
    Fetches the latest `limit` rows starting from `start` via the MCP server.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{MCP_BASE_URL}/tools/get_sensor_data",
            params={"start": start, "limit": limit, "machine_id": machine_id},
        )
        resp.raise_for_status()
        return resp.json()["data"]


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 2 — Detection: CUSUM + Moving Average Slope
# ═══════════════════════════════════════════════════════════════════════════════

def agent_detection(rows: list) -> dict:
    """
    Agent 2: Drift Detection
    -------------------------
    Uses two math techniques on the rows seen so far:

    1. Moving Average: smooths temperature noise to reveal trend.
    2. Linear Slope:   fits a line to the last DRIFT_WINDOW rows.
                       If slope > DRIFT_SLOPE_THRESHOLD → drift detected.

    Returns:
        {
          "drift_detected": bool,
          "slope_temp":     float,
          "slope_vib":      float,
          "moving_avg_temp": float,
          "cusum_score":    float,
        }
    """
    if len(rows) < DRIFT_WINDOW:
        return {"drift_detected": False, "reason": "Not enough data yet"}

    # Use last DRIFT_WINDOW rows
    window = rows[-DRIFT_WINDOW:]
    temps  = [r["temperature"] for r in window]
    vibs   = [r["vibration"]   for r in window]
    x      = np.arange(len(temps))

    # Linear regression slopes
    slope_temp = float(np.polyfit(x, temps, 1)[0])  # °C per row
    slope_vib  = float(np.polyfit(x, vibs,  1)[0])  # mm/s per row

    # Moving average of temperature
    moving_avg_temp = float(np.mean(temps))

    # CUSUM: cumulative sum of deviations from baseline mean
    baseline_mean = 60.5   # expected normal temperature
    cusum         = float(np.sum(np.array(temps) - baseline_mean))

    # ── Decision logic ────────────────────────────────────────────────────────
    # Drift is flagged when BOTH temperature AND vibration are rising
    drift_flagged = (slope_temp > DRIFT_SLOPE_THRESHOLD) and (slope_vib > 0.005)

    return {
        "drift_detected":  drift_flagged,
        "slope_temp":      round(slope_temp, 4),
        "slope_vib":       round(slope_vib,  6),
        "moving_avg_temp": round(moving_avg_temp, 2),
        "cusum_score":     round(cusum, 2),
        "window_size":     DRIFT_WINDOW,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 3 — Root Cause: GPT-4o matches drift data to fingerprints
# ═══════════════════════════════════════════════════════════════════════════════

async def agent_root_cause(drifting_rows: list, detection_stats: dict) -> str:
    """
    Agent 3: Root Cause Analysis
    -----------------------------
    Fetches failure fingerprints from MCP, then asks GPT-4o to match
    the drifting sensor data against those patterns.

    Returns raw text diagnosis from GPT-4o.
    """
    # Fetch fingerprints via MCP
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{MCP_BASE_URL}/tools/get_fingerprints")
        resp.raise_for_status()
        fingerprints = resp.json()["fingerprints"]

    # Build the prompt
    data_summary = json.dumps(drifting_rows, indent=2)
    fp_summary   = json.dumps(fingerprints,  indent=2)
    stats_summary = json.dumps(detection_stats, indent=2)

    prompt = f"""You are an expert industrial equipment diagnostics AI.

SENSOR READINGS (last 15 rows showing drift):
{data_summary}

DETECTION STATISTICS:
{stats_summary}

KNOWN FAILURE FINGERPRINTS (from engineering database):
{fp_summary}

Instructions:
1. Analyze the sensor trends (temperature and vibration over time).
2. Match the drift pattern to the MOST LIKELY failure fingerprint.
3. Explain WHY this fingerprint matches (temperature slope, vibration behavior).
4. Estimate how many days until critical failure.
5. Recommend the immediate corrective action.

Be concise but technically precise. This diagnosis goes to a plant operator."""

    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,    # Low temperature = more deterministic, factual output
        max_tokens=500,
    )

    return response.choices[0].message.content


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 4 — Explainer: Format diagnosis as strict JSON for the UI
# ═══════════════════════════════════════════════════════════════════════════════

async def agent_explainer(raw_diagnosis: str) -> dict:
    """
    Agent 4: Operator Alert Formatter
    -----------------------------------
    Takes Agent 3's verbose diagnosis and asks GPT-4o to produce a
    clean, strict JSON object for the frontend alert card.

    Returns:
        {
          "title":   "Early Bearing Wear Detected",
          "eta_days": 7,
          "action":  "Schedule bearing inspection within 48 hours.",
          "severity": "medium",
          "confidence": "high"
        }
    """
    prompt = f"""You are a formatting assistant. Convert this industrial diagnosis into strict JSON.

DIAGNOSIS:
{raw_diagnosis}

Return ONLY valid JSON (no markdown, no explanation, no code fences) with exactly these fields:
{{
  "title":       "Short title of the fault (max 6 words)",
  "eta_days":    <integer: estimated days until critical failure>,
  "action":      "The single most important action for the operator (1-2 sentences)",
  "severity":    "low" | "medium" | "high",
  "confidence":  "low" | "medium" | "high"
}}

Return ONLY the JSON object, nothing else."""

    response = await openai_client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,    # Very low — we want strict, consistent JSON output
        max_tokens=200,
    )

    raw_text = response.choices[0].message.content.strip()

    # Strip markdown code fences if GPT ignores instructions
    if raw_text.startswith("```"):
        raw_text = raw_text.split("```")[1]
        if raw_text.startswith("json"):
            raw_text = raw_text[4:]
        raw_text = raw_text.strip()

    return json.loads(raw_text)


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT PIPELINE — Runs in background when drift is detected
# ═══════════════════════════════════════════════════════════════════════════════

async def run_agent_pipeline(drifting_rows: list, detection_stats: dict, machine_id: str, websocket: WebSocket):
    """
    Orchestrates all 4 agents in sequence.
    Pushes results INSTANTLY to the WebSocket the millisecond they are ready.
    """
    print(f"\n[Agent Pipeline] Triggered for {machine_id}!")
    st = get_state(machine_id)
    
    try:
        print("   [Agent 3] Root Cause -> calling GPT-4o ...")  
        raw_diagnosis = await agent_root_cause(drifting_rows, detection_stats)
        st["diagnosis_raw"] = raw_diagnosis
        print(f"   [Agent 3] Complete:\n{raw_diagnosis[:200]}...")
        
        # Instantly push diagnosis_raw mid-stream
        await websocket.send_json({
            "type": "agent_update",
            "diagnosis_raw": raw_diagnosis
        })

        print("   [Agent 4] Explainer -> calling GPT-4o ...")
        alert_json = await agent_explainer(raw_diagnosis)
        st["alert"] = alert_json
        print(f"   [Agent 4] Complete: {alert_json}")
        
        # Instantly push alert_json
        await websocket.send_json({
            "type": "agent_update",
            "alert": alert_json
        })

    except Exception as e:
        print(f"   [ERROR] Agent pipeline error: {e}")
        fallback = {
            "title": "Drift Detected", "eta_days": 7, "action": "Inspect equipment.", "severity": "medium", "confidence": "medium"
        }
        st["alert"] = fallback
        await websocket.send_json({"type": "agent_update", "alert": fallback})
    finally:
        st["agent_running"] = False
        print("[Agent Pipeline] Complete!\n")


# ═══════════════════════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/start-feed")
async def start_feed(machine_id: str):
    """
    Resets the live feed cursor to row 0 and loads all rows into memory for a specific machine.
    """
    st = get_state(machine_id)
    st["cursor"]         = 0
    st["running"]        = True
    st["sent_rows"]      = []
    st["drift_detected"] = False
    st["agent_running"]  = False
    st["alert"]          = None
    st["diagnosis_raw"]  = None

    # Load all 200 rows from MCP server into memory
    st["all_rows"] = await load_all_rows_from_mcp(machine_id)
    print(f"[Feed] Started - {len(st['all_rows'])} rows loaded from MCP server for {machine_id}")

    return {"status": "started", "total_rows": len(st["all_rows"])}


@app.websocket("/ws/feed/{machine_id}")
async def websocket_feed(websocket: WebSocket, machine_id: str):
    """
    Streams data natively via WebSockets at 2Hz.
    Replaces /api/live-feed polling.
    """
    await websocket.accept()
    st = get_state(machine_id)
    print(f"[WS] Connected for {machine_id}. running={st['running']}, all_rows_len={len(st['all_rows'])}")
    try:
        while True:
            await asyncio.sleep(0.5)
            
            if not st["running"] or not st["all_rows"]:
                print(f"[WS] Loop tick skipped: running={st['running']}, all_rows_len={len(st['all_rows'])}")
                continue

            cursor = st["cursor"]
            total  = len(st["all_rows"])

            if cursor >= total:
                await websocket.send_json({
                    "finished":        True,
                    "cursor":          cursor,
                    "total":           total,
                    "drift_detected":  st["drift_detected"],
                    "alert":           st["alert"],
                })
                st["running"] = False
                continue

            current_row = st["all_rows"][cursor]
            st["sent_rows"].append(current_row)
            st["cursor"] += CHUNK_SIZE

            # Agent 1
            monitor_start = max(0, cursor - 9)
            recent_rows   = await agent_monitor(start=monitor_start, machine_id=machine_id, limit=10)

            # Agent 2
            detection_stats = agent_detection(st["sent_rows"])

            if detection_stats.get("drift_detected") and not st["drift_detected"] and not st["agent_running"]:
                st["drift_detected"] = True
                st["agent_running"]  = True
                print(f"[ALERT] DRIFT DETECTED at row {cursor}! Triggering AI agent pipeline ...")
                
                drifting_rows = st["sent_rows"][-15:]
                # Spawn background WebSocket push task directly
                asyncio.create_task(run_agent_pipeline(drifting_rows, detection_stats, machine_id, websocket))

            await websocket.send_json({
                "type": "row_data",
                "row":             current_row,
                "cursor":          st["cursor"],
                "total":           total,
                "finished":        False,
                "drift_detected":  st["drift_detected"],
                "detection_stats": detection_stats,
                "alert":           st["alert"],
                "diagnosis_raw":   st["diagnosis_raw"],
            })

    except WebSocketDisconnect:
        print(f"[Websocket] Client disconnected from {machine_id}")


@app.post("/api/reset")
async def reset():
    """Fully resets all state — for demo restarts."""
    states.clear()
    return {"status": "reset complete"}


@app.get("/health")
async def health(machine_id: str = "MCH-03"):
    """Health check."""
    st = get_state(machine_id)
    return {
        "status":  "ok",
        "server":  "DriftVeil FastAPI Backend",
        "running": st["running"],
        "cursor":  st["cursor"],
    }


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("[DriftVeil] Backend starting on http://127.0.0.1:8000")
    print("   Make sure mcp_server.py is running on port 8001 first!")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
