# DriftVeil Chatbot + What-If Simulation Implementation Guide

## Goal

Add a conversational assistant that becomes available when drift is detected, so operators and engineers can ask:

- What happens if I reduce load by 15 percent?
- What if we keep running for 8 hours?
- What should I do first to avoid failure?

The assistant should simulate likely outcomes from live machine context, then return clear, actionable guidance.

---

## Should LLM Be Inside MCP?

Short answer: no, keep LLM orchestration in the Backend API, not in MCP.

Recommended responsibility split:

1. MCP server
- Read-only tool/data access layer.
- Serves machine metadata, telemetry windows, fingerprints, recent alerts, baselines.
- No business orchestration, no long-running chat logic.

2. Backend API (main app)
- Chat session lifecycle.
- Scenario extraction from user question.
- Simulation engine execution.
- LLM prompting and response composition.
- Safety rules and audit logging.

3. LLM
- Natural language understanding and explanation.
- Summarizes simulation output into operator-friendly action plan.
- Must not be sole source of numeric prediction.

Why this is better:

- Keeps MCP clean and reusable as a tool layer.
- Makes testing easier (simulation can be tested without LLM).
- Avoids mixing protocol/tool concerns with product behavior.

---

## High-Level Architecture

1. Drift detected in existing pipeline.
2. Frontend enables Ask AI panel for the active machine.
3. User asks a what-if question.
4. Backend gathers context via MCP tools and internal state:
- recent telemetry window
- baseline profile
- machine type and current status
- latest detection stats (cusum, slopes)
- fingerprints and last alert
5. Backend extracts simulation intent:
- intervention type (reduce load, reduce rpm, stop, inspect, etc.)
- magnitude (for example 10 percent)
- horizon (for example 2 hours)
6. Backend runs deterministic simulation engine.
7. Backend sends simulation result plus context to LLM for narrative answer.
8. Backend returns:
- numeric outcome
- confidence and assumptions
- recommended action
- optional follow-up questions

---

## Core Feature Scope (V1)

1. Chat while drift is active.
2. What-if interventions supported:
- reduce load
- reduce rpm
- temporary stop and restart
- maintenance action placeholder (bearing inspection done / not done)
3. Horizon options:
- 30 minutes
- 2 hours
- 8 hours
- 24 hours
4. Output fields:
- predicted temperature trend
- predicted vibration trend
- projected health drop
- risk level (low, medium, high)
- recommendation text

---

## Backend Design

### A) New API Endpoints

1. POST /api/chat/sessions
- input: machine_id
- output: session_id

2. POST /api/chat/sessions/{session_id}/message
- input:
  - message
  - machine_id
  - optional scenario_override (advanced mode)
- output:
  - assistant_message
  - simulation object
  - recommendation

3. GET /api/chat/sessions/{session_id}/messages
- returns conversation history.

4. POST /api/chat/simulate
- direct non-chat simulation endpoint for testing.

### B) New Internal Modules

1. backend/simulation_engine.py
- Deterministic model.
- Inputs: machine context + intervention + horizon.
- Outputs: projected metrics and risk.

2. backend/chat_orchestrator.py
- Calls MCP tools.
- Builds context bundle.
- Parses user intent.
- Calls simulation_engine.
- Calls LLM for final natural language response.

3. backend/prompt_templates.py
- Strict system templates.
- Response schema enforcement.

### C) Suggested DB Tables

1. chat_sessions
- id
- machine_id
- created_at
- created_by (optional)

2. chat_messages
- id
- session_id
- role (user or assistant)
- content
- created_at
- simulation_id (nullable)

3. what_if_simulations
- id
- machine_id
- session_id
- user_question
- scenario_json
- result_json
- risk_level
- created_at

---

## Simulation Strategy

Use hybrid approach:

1. Deterministic math for projections.
2. LLM only for interpretation and communication.

Example deterministic logic (simple V1):

- Start from recent 15 to 30 readings.
- Estimate baseline slopes:
  - temp_slope_current
  - vib_slope_current
- Apply intervention multipliers:
  - reduce_load_10_percent -> slope factors 0.7 temp, 0.75 vib
  - reduce_rpm_20_percent -> slope factors 0.6 temp, 0.65 vib
  - stop_30_min -> temporary decay then restart ramp
- Simulate next N ticks.
- Compute risk score from:
  - projected temp band
  - projected vibration band
  - projected cusum growth

Confidence guidance:

- High when intervention is within known range and telemetry variance is low.
- Medium when variance is moderate.
- Low when intervention is novel or history is sparse.

---

## LLM Prompting Pattern

Use structured prompt with explicit boundaries:

1. System instruction
- You are an industrial reliability assistant.
- Use provided simulation result only.
- Do not invent numeric values.

2. Context payload
- machine metadata
- detection stats
- user question
- simulation input and output

3. Output schema (JSON)
- summary
- what_happens
- risk_level
- recommended_action
- assumptions
- confidence

Important:

- If LLM output fails schema parse, retry once with stricter repair prompt.
- If still invalid, fallback to template-based response from simulation result.

---

## Frontend UX Plan

1. Add Chat panel in Operator and Engineer views.
2. Enable when machine has active stream context (preferably drift or warn).
3. Show quick chips:
- If I reduce load by 10 percent?
- If I run 8 more hours?
- What is safest immediate action?
4. Render simulation card under each assistant message:
- horizon
- projected max temperature
- projected max vibration
- risk level
- confidence
5. Add View assumptions expander for transparency.

---

## Rollout Plan

### Phase 1: Backend Skeleton

1. Add chat session and message endpoints.
2. Stub simulation endpoint with hardcoded output.
3. Wire frontend chat panel to API.

Done when:

- User can send and receive persisted messages.

### Phase 2: Deterministic Simulation

1. Build simulation_engine.py.
2. Use recent telemetry and detection stats as input.
3. Add unit tests for each intervention type.

Done when:

- Same input returns same projected output.

### Phase 3: LLM Narrative Layer

1. Add structured prompt + JSON schema output.
2. Return explanation with recommendation and assumptions.
3. Add fallback response path if LLM unavailable.

Done when:

- App still works without API key and clearly labels fallback mode.

### Phase 4: Safety + Governance

1. Add guardrails:
- no instructions for unsafe operation
- no guaranteed outcome language
2. Add audit logging of prompts, outputs, simulation inputs.
3. Add operator disclaimer in UI.

Done when:

- Every answer is traceable and includes assumptions.

---

## Example Request/Response Contract

POST /api/chat/sessions/{session_id}/message

Request:

{
  "machine_id": "MCH-03",
  "message": "If I reduce machine load by 15%, what happens in next 8 hours?"
}

Response:

{
  "assistant_message": "Reducing load by 15% is likely to slow the drift growth and keep temperature below the critical band for the next 8 hours.",
  "simulation": {
    "horizon_minutes": 480,
    "projected_max_temperature": 84.2,
    "projected_max_vibration": 0.61,
    "projected_cusum_delta": 12.7,
    "risk_level": "medium",
    "confidence": "medium"
  },
  "recommendation": "Reduce load now, schedule bearing inspection within this shift, and re-evaluate after 30 minutes of telemetry."
}

---

## Testing Checklist

1. Unit tests
- intent parser
- simulation math
- risk scoring

2. Integration tests
- chat endpoint with MCP up
- chat endpoint with MCP down (graceful error)
- chat endpoint with LLM unavailable (fallback)

3. UX tests
- chat visible only in valid states
- response includes simulation card and assumptions
- no blocking UI during API call

---

## Recommended Next Action

Start with Phase 1 plus Phase 2 first (no LLM dependency), then layer LLM narrative in Phase 3.
This gives stable value early, lower cost, and better trust in the answers.