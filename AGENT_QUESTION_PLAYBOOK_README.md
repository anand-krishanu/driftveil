# DriftVeil Agent Question Playbook

## Why This File Exists

This document prepares your team for the Agent Builder round where the problem statement is given in a structured format (like your FestHelp screenshot), and you must quickly design a robust workflow.

It gives:

1. The likely question format organizers will use.
2. DriftVeil-flavored versions of those question types.
3. A prompt bank to rehearse.
4. Exact mapping to your workflow console in `driftveil_workflow_console.html`.

---

## 1) How Challenge Questions Are Usually Framed

Based on the screenshot style, expect 5 sections:

1. Scenario
- Business context and user behavior.

2. Problem Statement
- What the workflow must do end-to-end.

3. Available Data and APIs
- Structured tables, documents, and recent conversation context.

4. Constraints
- Latency, safety, and freshness requirements.

5. Success Criteria
- Required output format, escalation rules, and tone/style requirements.

---

## 2) DriftVeil-Style Question Template (What Ours Can Look Like)

Use this as your expected challenge pattern.

### Scenario

A manufacturing operator support assistant handles high-volume messages from line operators and maintenance engineers. Users ask for machine health, drift causes, and what-if outcomes in short informal messages.

### Problem Statement

Design a GenAI workflow that:

1. Normalizes noisy operator input.
2. Classifies the query intent and confidence.
3. Fetches live machine context and telemetry.
4. Runs deterministic what-if simulation when asked.
5. Returns a strict JSON answer with recommendation, confidence, and escalation decision.

### Available Data and APIs

1. Machine Registry (structured)
- machine_id, name, line, location, status, base_health

2. Telemetry History (structured)
- machine_id, time, temperature, vibration, rpm

3. Fingerprint Library (structured/JSON)
- issue_name, severity, pattern_data, eta_days, action_prescription

4. Recent Conversation Context (realtime)
- last 5 to 10 turns for continuity

5. APIs
- `GET /api/machines`
- `GET /api/machines/{machine_id}/history`
- `POST /api/chat/simulate`
- `GET /tools/get_fingerprints`

### Constraints

1. Latency vs accuracy
- Reply within 2 to 3 seconds for normal requests.

2. Safety vs automation
- If risk is high, confidence is low, or message indicates emergency, do not auto-close. Escalate.

3. Data freshness vs caching
- Always use live lookups for machine status and telemetry.
- Cached templates allowed only for generic policy answers.

### Success Criteria

1. Output must be strict JSON (schema-compliant).
2. Numeric predictions must come from deterministic simulation, not invented.
3. High-risk and low-confidence routes must include escalation payload.
4. Response must be concise and operator-friendly.

---

## 3) Question Bank To Rehearse (Likely Prompt Types)

## A) Status and Triage

1. "MCH-03 condition right now?"
2. "Which machine is riskiest in Line 1?"
3. "Any drift alert currently active?"

Expected route: status

## B) Root Cause

1. "Why is vibration climbing on MCH-03?"
2. "Explain drift reason in simple words."
3. "Most likely fault from current trend?"

Expected route: diagnosis

## C) What-If Simulation

1. "If I reduce load 15% for 8h what happens?"
2. "If rpm reduced by 20%, how risk changes?"
3. "Can we keep running till tomorrow morning?"

Expected route: what_if

## D) Recommendation

1. "Safest action in next 30 mins?"
2. "What should operator do first?"
3. "Give top 2 immediate actions."

Expected route: recommendation (may use diagnosis + simulation)

## E) Ambiguous / Low Confidence

1. "what now"
2. "do something"
3. "is it bad?"

Expected route: ambiguous -> clarification

## F) Escalation Triggers

1. "Machine smoking, should I stop now?"
2. "Temperature crossed limit and vibration spiking."
3. "Emergency shutdown?"

Expected route: high-risk handoff

---

## 4) Mapping To Your Workflow Console HTML

Your file `driftveil_workflow_console.html` already contains a practice-ready simulation for both flows.

## Basic Flow Node Path (from the HTML model)

1. `N1 Input`
2. `N2 Normalize Query`
3. `N3 Router`
4. One tool route (`N4` or `N5` or `N6`) OR `N7` clarify
5. `N8 Compose`
6. `N9 Guardrail`
7. `N10 Formatter` or `N11 Safe Fallback`
8. `N12 Final Response`

## Advanced Flow Node Path (from the HTML model)

1. `W1 Normalize`
2. `W2 Router`
3. `W3 Entity Extractor`
4. `W4 Memory`
5. Parallel tools `P1` to `P4`
6. `W5 Aggregator`
7. `W6 Risk Scorer`
8. `W7 risk >= high?`
9. `W17 Human Handoff` OR `W8 Recommendation -> W9 Policy Guardrail`
10. `W11 Formatter`
11. `W12 Schema Evaluator`
12. `W14 Repair Retry` (if needed)
13. `W15 Safe Fallback` (if needed)
14. `W16 Final Response`

---

## 5) Expected Output Schemas (Practice)

## A) Status

```json
{
  "intent": "status",
  "machine_id": "MCH-03",
  "summary": "Current machine status summary",
  "risk_level": "low|medium|high",
  "recommended_action": "Operator next step",
  "confidence": "low|medium|high"
}
```

## B) Diagnosis

```json
{
  "intent": "diagnosis",
  "machine_id": "MCH-03",
  "likely_cause": "Early Bearing Wear",
  "evidence": ["temp slope rising", "vibration slope rising"],
  "risk_level": "medium",
  "recommended_action": "Inspect bearing within shift",
  "confidence": "medium"
}
```

## C) What-If

```json
{
  "intent": "what_if",
  "machine_id": "MCH-03",
  "what_happens": {
    "horizon_minutes": 480,
    "projected_max_temperature": 84.2,
    "projected_max_vibration": 0.61,
    "projected_cusum_delta": 12.7
  },
  "risk_level": "medium",
  "recommended_action": "Reduce load and monitor every 30 min",
  "assumptions": ["load reduction is sustained"],
  "confidence": "medium"
}
```

## D) Escalation

```json
{
  "intent": "escalation",
  "machine_id": "MCH-03",
  "escalate": true,
  "reason": "high risk or low confidence",
  "handoff_team": "maintenance_control",
  "recommended_action": "Immediate safe shutdown checklist",
  "confidence": "high"
}
```

---

## 6) 60-Minute Build Strategy During Challenge

1. Minute 0-10
- Build basic pipeline skeleton (Input -> Normalize -> Router -> Tool -> Formatter).

2. Minute 10-20
- Add guardrail and safe fallback.

3. Minute 20-35
- Add simulation route and strict JSON formatting.

4. Minute 35-45
- Add escalation branch and low-confidence handling.

5. Minute 45-55
- Run 8-prompt test bank and fix weak routes.

6. Minute 55-60
- Final polish: clear labels, fast explanation script, submit.

---

## 7) What To Say To Judges In 30 Seconds

"Our agent is reliability-first. We normalize noisy operator text, route by intent, and use live tools for context. All numeric projections come from deterministic simulation, while LLM handles explanation only. A guardrail blocks unsafe or fabricated outputs, and high-risk cases are escalated via human handoff. So we balance speed, safety, and explainability in one workflow."
