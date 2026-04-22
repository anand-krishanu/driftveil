# DriftVeil Data Retention and Agent Context Guide

## Purpose

This guide defines:

1. What data DriftVeil should store.
2. Where each data type is stored.
3. How long each data type should be retained.
4. What context goes to each agent, when it is sent, and what output is produced.
5. Whether each output should be persisted.
6. How the fingerprint library is structured and maintained.

This is the source-of-truth document for data lifecycle decisions across backend, MCP, and AI layers.

---

## Current Storage Layers

1. Runtime memory in backend process
- `states[machine_id]` in backend process memory.
- Contains live cursor, sent rows, drift flags, current alert, and diagnosis text.
- Volatile and cleared on process restart or `/api/reset`.

2. SQLite database via Prisma
- Source of truth for machine metadata, sensor history, fingerprints, chat history, and simulations.
- Tables are defined in `backend/schema.prisma`.

3. MCP server read layer
- Reads from DB and returns normalized tool payloads:
  - `/tools/get_sensor_data`
  - `/tools/get_machines`
  - `/tools/get_fingerprints`

4. LLM context payloads
- Built at runtime in backend.
- Not permanently stored by default except where captured in chat/simulation tables.

---

## What Data To Store, Where, and Why

| Data Type | Store? | Where | Why |
|---|---|---|---|
| Machine registry (id, name, line, location, status, base health) | Yes | `Machine` | Core asset identity and UI fleet state |
| Raw sensor telemetry (time, temp, vib, rpm) | Yes | `SensorReading` | Drift detection, history charts, simulation input |
| Failure fingerprints | Yes | `FailureFingerprint` | Root-cause matching reference library |
| Drift alerts and diagnosis summary | Yes | `Alert` (recommended operationally) | Audit trail and maintenance workflow |
| Chat sessions | Yes | `ChatSession` | Conversation continuity by machine |
| Chat messages (user + assistant) | Yes | `ChatMessage` | Explainability and operator traceability |
| What-if simulation requests/results | Yes | `WhatIfSimulation` | Replayability and decision support history |
| Live websocket transient metrics | No (raw stream) | Memory only | High-frequency ephemeral transport |
| Agent intermediate states (`sent_rows`, `detection_stats` per tick) | Partial | Memory now, optional aggregate table later | Useful for debugging and tuning |
| Prompt/response audit logs | Recommended | File or DB log table | Compliance, judging transparency, RCA |

---

## Retention Policy (Recommended)

### A) Hackathon / Prototype Retention

1. SensorReading: keep all (small scale) until manual cleanup.
2. ChatSession/ChatMessage: keep all during event.
3. WhatIfSimulation: keep all during event.
4. Alert: keep all during event.
5. Logs: 7-14 days.

### B) Pilot / Production Retention (Recommended Baseline)

| Data Type | Hot Retention | Warm Retention | Cold Retention | Notes |
|---|---|---|---|---|
| SensorReading (1s or 5s raw) | 30 days | 180 days (downsampled 1m) | 2 years (hourly/daily aggregates) | Cost control + trend visibility |
| Drift detection stats | 90 days | 1 year (daily summary) | Optional archive | Needed for model tuning |
| Alert records | 2 years | 5 years archive | Optional | Maintenance and audit value |
| Failure fingerprints | Indefinite | Versioned forever | N/A | Knowledge base should not be lost |
| Chat sessions/messages | 90 days | 1 year (summaries) | Optional | Keep concise for privacy/cost |
| What-if simulations | 180 days | 2 years summary | Optional | Valuable for post-incident review |
| Prompt/LLM logs | 30-90 days | Redacted summaries 1 year | Optional | Privacy and cost constraints |

---

## Agent Context Matrix

## Agent 1 - Monitor

1. Trigger timing
- Every websocket tick while feed is running.

2. Input context
- `machine_id`
- `start` row index (cursor-9)
- `limit=10`
- Source: MCP `/tools/get_sensor_data`.

3. Output
- Recent 10 rows of telemetry.

4. Persist output?
- Current: No (transient).
- Recommended: persist aggregated monitor diagnostics only (not every raw fetch).

## Agent 2 - Detection

1. Trigger timing
- Every websocket tick after current row is appended to `sent_rows`.

2. Input context
- `sent_rows` (all rows streamed so far for machine).
- Uses last `DRIFT_WINDOW` rows (15) for slope and CUSUM.

3. Output
- `drift_detected`
- `slope_temp`
- `slope_vib`
- `moving_avg_temp`
- `cusum_score`
- `window_size`

4. Persist output?
- Current: Sent to websocket; not stored in table.
- Recommended: store periodic snapshots (for explainability and model calibration).

## Agent 3 - Root Cause

1. Trigger timing
- One-time trigger when drift flips false -> true and pipeline is not already running.

2. Input context
- `drifting_rows = sent_rows[-15:]`
- `detection_stats` from Agent 2
- Fingerprint library from MCP `/tools/get_fingerprints`

3. Output
- Raw diagnosis narrative text.

4. Persist output?
- Current: kept in memory (`st["diagnosis_raw"]`) and pushed to websocket.
- Recommended: persist into `Alert.rawDiagnosis` and link to alert record.

## Agent 4 - Explainer

1. Trigger timing
- Immediately after Agent 3 completes.

2. Input context
- Agent 3 raw diagnosis text.

3. Output
- Structured alert JSON:
  - title
  - eta_days
  - action
  - severity
  - confidence

4. Persist output?
- Current: stored in memory (`st["alert"]`) and pushed to websocket.
- Recommended: persist into `Alert` table for lifecycle tracking.

## Chat Orchestrator (What-if Assistant)

1. Trigger timing
- On `POST /api/chat/sessions/{session_id}/message`.
- On direct `POST /api/chat/simulate` for stateless simulation.

2. Input context
- User message.
- Local machine context derived from state + detection:
  - moving_avg_temp
  - latest_vib
  - slope_temp
  - slope_vib
  - cusum_score

3. Output
- `assistant_message`
- `simulation` object
- `recommendation`

4. Persist output?
- Current: Yes.
  - User and assistant text in `ChatMessage`.
  - Simulation in `WhatIfSimulation`.
- Recommended: keep as-is and add request-id for observability.

---

## When Context Is Sent (Timeline)

1. Feed starts -> backend loads all rows from MCP into machine runtime state.
2. Websocket tick -> Agent 1 fetches latest 10 rows.
3. Same tick -> Agent 2 computes detection stats from sent history.
4. Drift crossing event -> Agent 3 receives 15-row drift window + fingerprints + stats.
5. Agent 3 output -> Agent 4 receives diagnosis text and emits strict JSON alert.
6. User chat question -> chat orchestrator receives question + latest local context.
7. Simulation engine projects outcomes -> LLM formats operator-facing recommendation.
8. Chat response and simulation output are persisted to DB.

---

## Do We Store Outputs? (Current vs Recommended)

| Output | Current | Recommended |
|---|---|---|
| Live row_data websocket events | No | No (derive from telemetry table) |
| Agent 2 detection per tick | No | Optional summarized snapshots |
| Agent 3 raw diagnosis | Memory only | Yes in `Alert.rawDiagnosis` |
| Agent 4 alert JSON | Memory only | Yes in `Alert` |
| Chat assistant answers | Yes (`ChatMessage`) | Keep |
| Simulation payloads | Yes (`WhatIfSimulation`) | Keep |

---

## Fingerprint Library Design

## What Fingerprint Library Takes

Each fingerprint entry should take these fields:

1. `issueName`: canonical fault label.
2. `severity`: LOW/MEDIUM/HIGH/CRITICAL.
3. `patternData`: machine-readable trend signature.
4. `etaDays`: expected time-to-critical from first matching signal.
5. `actionPrescription`: standard recommended mitigation.

Current implementation seeds these from `backend/seed.py` and stores them in `FailureFingerprint`.

## What It Stores and How

1. Storage table: `FailureFingerprint`.
2. Current `patternData` format: plain descriptive string in SQLite.
3. Retrieval path: MCP `/tools/get_fingerprints` transforms DB rows into prompt-ready JSON objects.

## Recommended Fingerprint Storage Format

Prefer structured JSON in `patternData` (still serialized as string in SQLite for now), for example:

```json
{
  "temp_slope_min": 0.12,
  "vib_slope_min": 0.004,
  "temp_vib_coupled": true,
  "window_minutes": 30,
  "signature_type": "gradual_bearing_wear"
}
```

Why:

1. Easier deterministic pre-filtering before LLM call.
2. Better consistency for versioning and evaluation.
3. Lower prompt ambiguity.

## Fingerprint Lifecycle

1. Curate from domain experts + incidents.
2. Validate on historical telemetry.
3. Version updates (do not overwrite blindly).
4. Deploy to DB.
5. Monitor match quality and false positives.

---

## Minimum Governance Rules

1. Always store machine_id, timestamp, and source endpoint for every persisted AI artifact.
2. Redact secrets and never persist API keys in logs or prompts.
3. Keep a strict output schema for alert/chat responses.
4. Add explicit retention cleanup jobs once data volume grows.
5. Document any fallback mode used during outages.

---

## Immediate Next Improvements

1. Persist Agent 3/4 outputs into `Alert` table on drift trigger.
2. Add a retention cleanup cron/script for old telemetry and chat data.
3. Convert fingerprint `patternData` from free-text to structured JSON schema.
4. Add a `detection_snapshot` table for periodic drift metrics.
5. Add request tracing IDs across websocket, chat, and simulation APIs.