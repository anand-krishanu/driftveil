"""
mcp_server.py
=============
A local MCP (Model Context Protocol) server that exposes two tools
to the agent pipeline:

  Tool 1 → get_sensor_data(start, limit)
           Reads rows from sensor_stream.csv and returns them as JSON.

  Tool 2 → get_fingerprints()
           Reads fingerprints.json and returns all known failure patterns.

How to run (in a separate terminal):
    python mcp_server.py

The server listens on http://127.0.0.1:8001
FastAPI (main.py) calls it internally — you do NOT need to interact
with this server directly.
"""

import json
import csv
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

# ── Paths ────────────────────────────────────────────────────────────────────
BASE_DIR        = Path(__file__).parent
CSV_PATH        = BASE_DIR / "sensor_stream.csv"
FINGERPRINT_PATH = BASE_DIR / "fingerprints.json"

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="DriftVeil MCP Server",
    description="MCP-style tool server exposing sensor data and failure fingerprints.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Tool 1: get_sensor_data ───────────────────────────────────────────────────
@app.get("/tools/get_sensor_data")
def get_sensor_data(
    start: int = Query(default=0, ge=0, description="Row index to start reading from (0-indexed)"),
    limit: int = Query(default=10, ge=1, le=200, description="Number of rows to return"),
):
    """
    Reads `limit` rows from sensor_stream.csv starting at row `start`.

    Returns a list of dicts:
        [{"timestamp": "...", "temperature": 60.12, "vibration": 0.23}, ...]
    """
    if not CSV_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="sensor_stream.csv not found. Run generate_data.py first!"
        )

    rows = []
    with open(CSV_PATH, newline="") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader):
            if i < start:
                continue
            if len(rows) >= limit:
                break
            rows.append({
                "row_index":   i,
                "timestamp":   row["timestamp"],
                "temperature": float(row["temperature"]),
                "vibration":   float(row["vibration"]),
            })

    return {
        "tool":  "get_sensor_data",
        "start": start,
        "limit": limit,
        "count": len(rows),
        "data":  rows,
    }


# ── Tool 2: get_fingerprints ──────────────────────────────────────────────────
@app.get("/tools/get_fingerprints")
def get_fingerprints():
    """
    Reads and returns all failure fingerprints from fingerprints.json.

    Returns a list of fingerprint objects with fields:
        id, issue, pattern, severity, eta_days_range, recommended_action
    """
    if not FINGERPRINT_PATH.exists():
        raise HTTPException(
            status_code=404,
            detail="fingerprints.json not found."
        )

    with open(FINGERPRINT_PATH) as f:
        fingerprints = json.load(f)

    return {
        "tool":         "get_fingerprints",
        "count":        len(fingerprints),
        "fingerprints": fingerprints,
    }


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "server": "DriftVeil MCP Server"}


# ── Entry point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("🔧  DriftVeil MCP Server starting on http://127.0.0.1:8001")
    uvicorn.run(app, host="127.0.0.1", port=8001, log_level="info")
