"""
mcp_server.py
=============
A local MCP (Model Context Protocol) server that exposes two tools
to the agent pipeline:

  Tool 1 -> get_sensor_data(start, limit)
           Reads rows from DB and returns them as JSON.

  Tool 2 -> get_fingerprints()
           Reads from DB and returns all known failure patterns.
"""

import json
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from prisma_client import Prisma
import uvicorn
from contextlib import asynccontextmanager

import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("mcp_server")

db = Prisma()

@asynccontextmanager
async def lifespan(app: FastAPI):
    await db.connect()
    yield
    await db.disconnect()

app = FastAPI(
    title="DriftVeil MCP Server",
    description="MCP-style tool server exposing sensor data and failure fingerprints.",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/tools/get_sensor_data")
async def get_sensor_data(
    start: int = Query(default=0, ge=0, description="Row index to start reading from (0-indexed)"),
    limit: int = Query(default=10, ge=1, le=200, description="Number of rows to return"),
    machine_id: Optional[str] = Query(default=None, description="Industrial machine identifier"),
):
    logger.info(f"Incoming request for get_sensor_data, machine_id={machine_id}, start={start}, limit={limit}")
    if not machine_id:
        machine = await db.machine.find_first()
        if machine:
            machine_id = machine.id
        else:
            raise HTTPException(status_code=404, detail="No machines found.")

    readings = await db.sensorreading.find_many(
        where={"machineId": machine_id},
        order={"time": "asc"},
        skip=start,
        take=limit
    )

    rows = []
    for i, r in enumerate(readings):
        rows.append({
            "row_index": start + i,
            "timestamp": r.time.strftime('%Y-%m-%d %H:%M:%S'),
            "temperature": r.temperature,
            "vibration": r.vibration
        })

    return {
        "tool":  "get_sensor_data",
        "start": start,
        "limit": limit,
        "count": len(rows),
        "data":  rows,
    }

@app.get("/tools/get_fingerprints")
async def get_fingerprints():
    fps = await db.failurefingerprint.find_many()

    fingerprints = []
    for f in fps:
        fingerprints.append({
            "id": f.id,
            "issue": f.issueName,
            "pattern": f.patternData,
            "severity": f.severity.lower(),
            "eta_days_range": f"{f.etaDays}-{f.etaDays+7}" if f.etaDays else "Unknown",
            "recommended_action": f.actionPrescription
        })

    return {
        "tool":         "get_fingerprints",
        "count":        len(fingerprints),
        "fingerprints": fingerprints,
    }


@app.get("/tools/get_machines")
async def get_machines():
    machines = await db.machine.find_many(order={"id": "asc"})

    rows = []
    for machine in machines:
        latest = await db.sensorreading.find_first(
            where={"machineId": machine.id},
            order={"time": "desc"},
        )

        rows.append({
            "id": machine.id,
            "name": machine.name,
            "line": machine.line,
            "location": machine.location,
            "status": machine.status,
            "base_health": machine.baseHealth,
            "temp": latest.temperature if latest else None,
            "vib": latest.vibration if latest else None,
            "last_timestamp": latest.time.strftime('%Y-%m-%d %H:%M:%S') if latest else None,
        })

    return {
        "tool": "get_machines",
        "count": len(rows),
        "machines": rows,
    }

@app.get("/health")
def health():
    return {"status": "ok", "server": "DriftVeil MCP Server (Prisma)"}

if __name__ == "__main__":
    print("[DriftVeil] MCP Server starting on http://127.0.0.1:8001")
    uvicorn.run("mcp_server:app", host="127.0.0.1", port=8001, log_level="info")
