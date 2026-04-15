"""
main.py
=======
DriftVeil FastAPI Backend — The Brain of the System

Endpoints:
  GET  /api/live-feed          → Returns the next chunk of sensor data for the chart
  POST /api/start-feed         → Resets the live feed cursor to row 0 (starts demo)
  GET  /api/agent-status       → Returns current alert/diagnosis from Agent 4
  GET  /api/reset              → Full reset of all state

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

from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

# ── Load environment variables ────────────────────────────────────────────────
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
if not OPENAI_API_KEY:
    print("⚠️  WARNING: OPENAI_API_KEY not found in .env — AI agents will not work!")

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

# ── Shared in-memory state ─────────────────────────────────────────────────────
# This acts like a simple database for the prototype.
state = {
    "cursor":          0,          # Current row index in the CSV
    "running":         False,      # Is the live feed active?
    "all_rows":        [],         # Cache of all 200 rows (loaded on start)
    "sent_rows":       [],         # Rows already sent to frontend
    "drift_detected":  False,      # Has drift been flagged?
    "agent_running":   False,      # Is the AI pipeline currently running?
    "alert":           None,       # Final Alert JSON from Agent 4
    "diagnosis_raw":   None,       # Raw output from Agent 3
}

openai_client = AsyncOpenAI(api_key=OPENAI_API_KEY)


# ═══════════════════════════════════════════════════════════════════════════════
#  HELPER: Load all rows from MCP server into memory
# ═══════════════════════════════════════════════════════════════════════════════

async def load_all_rows_from_mcp() -> list:
    """Fetch all 200 rows from the MCP server and cache them."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(f"{MCP_BASE_URL}/tools/get_sensor_data", params={"start": 0, "limit": 200})
        resp.raise_for_status()
        data = resp.json()
        return data["data"]


# ═══════════════════════════════════════════════════════════════════════════════
#  AGENT 1 — Monitor: Fetch latest N rows via MCP
# ═══════════════════════════════════════════════════════════════════════════════

async def agent_monitor(start: int, limit: int = 10) -> list:
    """
    Agent 1: Monitor
    ----------------
    Fetches the latest `limit` rows starting from `start` via the MCP server.
    Simulates a real-time sensor polling loop.
    """
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"{MCP_BASE_URL}/tools/get_sensor_data",
            params={"start": start, "limit": limit},
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

async def run_agent_pipeline(drifting_rows: list, detection_stats: dict):
    """
    Orchestrates all 4 agents in sequence.
    Results are stored in the global `state` dict so the frontend
    can poll /api/agent-status to pick up the alert.
    """
    print("\n🤖 Agent Pipeline triggered!")
    print(f"   Detection stats: {detection_stats}")

    try:
        # Agent 3: Root Cause
        print("   ⚙️  Agent 3 (Root Cause) → calling GPT-4o ...")
        raw_diagnosis = await agent_root_cause(drifting_rows, detection_stats)
        state["diagnosis_raw"] = raw_diagnosis
        print(f"   ✅ Agent 3 complete:\n{raw_diagnosis[:200]}...")

        # Agent 4: Explainer
        print("   ⚙️  Agent 4 (Explainer) → calling GPT-4o ...")
        alert_json = await agent_explainer(raw_diagnosis)
        state["alert"] = alert_json
        print(f"   ✅ Agent 4 complete: {alert_json}")

    except Exception as e:
        print(f"   ❌ Agent pipeline error: {e}")
        # Fallback alert so the frontend still gets something
        state["alert"] = {
            "title":      "Drift Detected",
            "eta_days":   7,
            "action":     "Inspect equipment immediately.",
            "severity":   "medium",
            "confidence": "medium",
        }
    finally:
        state["agent_running"] = False
        print("🤖 Agent Pipeline complete!\n")


# ═══════════════════════════════════════════════════════════════════════════════
#  API ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════════

@app.post("/api/start-feed")
async def start_feed():
    """
    Resets the live feed cursor to row 0 and loads all rows into memory.
    The frontend calls this when the user clicks 'Start Factory Feed'.
    """
    state["cursor"]         = 0
    state["running"]        = True
    state["sent_rows"]      = []
    state["drift_detected"] = False
    state["agent_running"]  = False
    state["alert"]          = None
    state["diagnosis_raw"]  = None

    # Load all 200 rows from MCP server into memory
    state["all_rows"] = await load_all_rows_from_mcp()
    print(f"✅ Feed started — {len(state['all_rows'])} rows loaded from MCP server")

    return {"status": "started", "total_rows": len(state["all_rows"])}


@app.get("/api/live-feed")
async def live_feed(background_tasks: BackgroundTasks):
    """
    Returns the NEXT chunk of sensor data for the frontend chart.
    The frontend calls this every second via setInterval().

    Also runs Agent 1 (Monitor) + Agent 2 (Detection) on each call.
    If drift is detected and no agent run is happening, triggers the
    full AI pipeline (Agents 3 + 4) in the background.

    Returns:
        {
          "row": { timestamp, temperature, vibration, row_index },
          "cursor": int,
          "total": int,
          "finished": bool,
          "drift_detected": bool,
          "detection_stats": { ... }
        }
    """
    if not state["running"] or not state["all_rows"]:
        return {"status": "idle", "message": "Call /api/start-feed first"}

    cursor = state["cursor"]
    total  = len(state["all_rows"])

    # Check if we've served all rows
    if cursor >= total:
        return {
            "finished":        True,
            "cursor":          cursor,
            "total":           total,
            "drift_detected":  state["drift_detected"],
            "alert":           state["alert"],
        }

    # ── Return the next row ───────────────────────────────────────────────────
    current_row = state["all_rows"][cursor]
    state["sent_rows"].append(current_row)
    state["cursor"] += CHUNK_SIZE

    # ── Agent 1: Monitor — fetch latest 10 rows via MCP ──────────────────────
    monitor_start = max(0, cursor - 9)
    recent_rows   = await agent_monitor(start=monitor_start, limit=10)

    # ── Agent 2: Detection — check for drift in all sent rows ────────────────
    detection_stats = agent_detection(state["sent_rows"])

    # ── Trigger AI pipeline if drift detected (only once) ────────────────────
    if (
        detection_stats.get("drift_detected")
        and not state["drift_detected"]
        and not state["agent_running"]
    ):
        state["drift_detected"] = True
        state["agent_running"]  = True
        print(f"🚨 DRIFT DETECTED at row {cursor}! Triggering AI agent pipeline ...")

        # Grab the last 15 rows to pass to Agent 3
        drifting_rows = state["sent_rows"][-15:]
        background_tasks.add_task(run_agent_pipeline, drifting_rows, detection_stats)

    return {
        "row":             current_row,
        "cursor":          state["cursor"],
        "total":           total,
        "finished":        False,
        "drift_detected":  state["drift_detected"],
        "detection_stats": detection_stats,
        "alert":           state["alert"],   # None until Agent 4 finishes
    }


@app.get("/api/agent-status")
async def agent_status():
    """
    Returns the current state of the agent pipeline.
    The frontend polls this to pick up the alert card data.
    """
    return {
        "drift_detected":  state["drift_detected"],
        "agent_running":   state["agent_running"],
        "alert":           state["alert"],
        "diagnosis_raw":   state["diagnosis_raw"],
        "cursor":          state["cursor"],
        "total":           len(state["all_rows"]),
    }


@app.post("/api/reset")
async def reset():
    """Fully resets all state — for demo restarts."""
    state.update({
        "cursor":          0,
        "running":         False,
        "all_rows":        [],
        "sent_rows":       [],
        "drift_detected":  False,
        "agent_running":   False,
        "alert":           None,
        "diagnosis_raw":   None,
    })
    return {"status": "reset complete"}


@app.get("/health")
async def health():
    """Health check."""
    return {
        "status":  "ok",
        "server":  "DriftVeil FastAPI Backend",
        "running": state["running"],
        "cursor":  state["cursor"],
    }


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    print("🚀 DriftVeil Backend starting on http://127.0.0.1:8000")
    print("   Make sure mcp_server.py is running on port 8001 first!")
    uvicorn.run(app, host="127.0.0.1", port=8000, log_level="info")
