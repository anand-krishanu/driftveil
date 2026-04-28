import json

SYSTEM_PROMPT = """You are an industrial reliability assistant. Your job is to translate statistical projections into clear, actionable advice for plant operators, and to answer any questions about the machine's state.

Rules:
1. You MUST answer the user's question, whether it is a simulation request, a general question, or a request for data.
2. Use the provided JSON simulation results AND call the MCP tools (e.g. get_sensor_data, get_machines) to fetch live data to inform your answer.
3. DO NOT hallucinate numbers. Rely on the MCP tools provided.
4. Be direct, authoritative, and concise. Operators reading this are in active production.

You must reply strictly in the following JSON format without any markdown code fences.

{
  "summary": "1 sentence recap of the user's query",
  "what_happens": "Your main response to the user. This can be an explanation, an answer to their question, or the outcome of a simulation.",
  "risk_level": "low" | "medium" | "high",
  "recommended_action": "The exact next physical step the operator should take, or general advice",
  "assumptions": "List of variables that could invalidate this projection, or data sources used",
  "confidence": "low" | "medium" | "high"
}"""

def build_context_prompt(context: dict, simulation_result: dict, user_question: str) -> str:
    payload = {
        "machine_context": context,
        "simulation_output": simulation_result,
        "operator_question": user_question
    }
    return json.dumps(payload, indent=2)

REPAIR_PROMPT = """The output you provided was not valid JSON or broke the schema. 
Return ONLY valid JSON matching the exact schema requested originally. No markdown blocks."""

def FALLBACK_RESPONSE_TEMPLATE(sim_result: dict) -> dict:
    # A rich mock narrative for when API keys fail, so the frontend demo still looks amazing
    intervention = sim_result['intervention_type'].replace("_", " ")
    max_temp = sim_result['projected_max_temperature']
    risk = sim_result['risk_level']
    
    narrative = f"Based on the live telemetry, if you {intervention}, the system projects the peak temperature will reach {max_temp}°C within the {sim_result['horizon_minutes']} minute horizon. "
    
    if risk == "high":
        narrative += f"This remains in the critical danger zone and will likely trigger forced auto-shutdowns to prevent stator damage."
        action = "Halt production immediately to perform thermal inspection."
    elif risk == "medium":
        narrative += f"This keeps the asset within stable operating bounds, but requires close monitoring as the CUSUM drift remains elevated."
        action = "Implement the adjustment and monitor the heat dissipation curve."
    else:
        narrative += f"This intervention is effective. The parameter slopes are flattened safely below SCADA thresholds."
        action = "Proceed with the adjustment. No further downtime anticipated."

    return {
        "summary": f"Simulating {intervention} over {sim_result['horizon_minutes']}m.",
        "what_happens": narrative,
        "risk_level": risk,
        "recommended_action": action,
        "assumptions": "Calculated via offline deterministic math engine (Demo Mode).",
        "confidence": "high"
    }
