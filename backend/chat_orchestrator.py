import re
import json
import logging
from typing import Dict, Any, Tuple
from google import genai
from google.genai import types
import os
import httpx

from simulation_engine import simulate_what_if
from prompt_templates import SYSTEM_PROMPT, build_context_prompt, REPAIR_PROMPT, FALLBACK_RESPONSE_TEMPLATE
from dotenv import load_dotenv
from tenacity import retry, wait_exponential, stop_after_attempt

load_dotenv()
logger = logging.getLogger("driftveil.chat")

# Safe initialization
api_key = os.getenv("GEMINI_API_KEY", "").strip()
gemini_client = genai.Client(api_key=api_key) if api_key else None

def parse_user_intent(message: str) -> Dict[str, Any]:
    """
    Intent parser that extracts intervention type, magnitude, and horizon
    from natural language, with richer support for general advisory questions.
    """
    msg_lower = message.lower()

    # 1. Horizon (minutes)
    horizon = 60  # default 1 hr
    if "min" in msg_lower:
        match = re.search(r'(\d+)\s*min', msg_lower)
        if match: horizon = int(match.group(1))
    elif "hour" in msg_lower or "hr" in msg_lower:
        match = re.search(r'(\d+)\s*(hour|hr)', msg_lower)
        if match: horizon = int(match.group(1)) * 60

    # 2. Intervention Type — order matters, be specific first
    is_conversational = False
    
    if "stop" in msg_lower or "halt" in msg_lower or "shut" in msg_lower:
        intervention_type = "stop"
    elif "rpm" in msg_lower:
        intervention_type = "reduce_rpm"
    elif "inspect" in msg_lower or "check" in msg_lower or "maintenance" in msg_lower:
        intervention_type = "inspection"
    elif "cool" in msg_lower or "temperature" in msg_lower or "heat" in msg_lower:
        intervention_type = "reduce_load"
    elif "vibrat" in msg_lower or "vib" in msg_lower:
        intervention_type = "reduce_rpm"
    elif any(k in msg_lower for k in ["safe", "action", "do", "first", "recommend", "advice", "suggest", "what should"]):
        # General advisory — simulate stopping as the safest action
        intervention_type = "stop"
        horizon = 30
    elif "load" in msg_lower:
        intervention_type = "reduce_load"
    else:
        # If no simulation keywords are found, treat it as general human conversation
        intervention_type = "inspection"
        is_conversational = True

    # 3. Magnitude
    magnitude = 15  # slightly more dramatic default
    percent_match = re.search(r'(\d+)\s*%', msg_lower)
    if percent_match:
        magnitude = int(percent_match.group(1))

    return {
        "intervention_type": intervention_type,
        "magnitude": magnitude,
        "horizon_minutes": horizon,
        "is_conversational": is_conversational
    }

async def get_sensor_data_tool(machine_id: str, start: int = -1, limit: int = 10) -> list:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"http://127.0.0.1:8001/tools/get_sensor_data", params={"start": start, "limit": limit, "machine_id": machine_id})
            if resp.status_code == 200:
                return resp.json().get("data", [])
        except Exception as e:
            logger.error(f"MCP tool error: {e}")
    return []

async def get_machines_tool() -> list:
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"http://127.0.0.1:8001/tools/get_machines")
            if resp.status_code == 200:
                return resp.json().get("machines", [])
        except Exception as e:
            logger.error(f"MCP tool error: {e}")
    return []

MCP_TOOLS = [
    types.Tool(
        function_declarations=[
            types.FunctionDeclaration(
                name="get_sensor_data",
                description="Fetch raw historical telemetry sensor data for a machine.",
                parameters=types.Schema(
                    type=types.Type.OBJECT,
                    properties={
                        "machine_id": types.Schema(type=types.Type.STRING),
                        "start": types.Schema(type=types.Type.INTEGER, description="-1 for latest data, 0 for oldest"),
                        "limit": types.Schema(type=types.Type.INTEGER)
                    },
                    required=["machine_id"]
                )
            ),
            types.FunctionDeclaration(
                name="get_machines",
                description="Fetch the latest live status, temperature, and vibration of all machines.",
            )
        ]
    )
]

@retry(wait=wait_exponential(multiplier=1, min=2, max=10), stop=stop_after_attempt(3))
async def call_gemini(messages):
    return await gemini_client.aio.models.generate_content(
        model='gemini-3-flash-preview',
        contents=messages,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            tools=MCP_TOOLS
        )
    )

async def run_chat_turn(session_id: str, message: str, machine_context: dict) -> Tuple[str, dict, str]:
    """
    Returns (assistant_message, simulation_object, recommendation_text)
    """
    # 1. Parse rules 
    intent = parse_user_intent(message)
    msg_lower = message.lower()
    


    # ── 2. Run Mathematical Simulation Engine ──
    sim_result = simulate_what_if(machine_context, intent)
    
    # ── 3. Request LLM Narrative ──
    if not gemini_client:
        logger.warning("No GEMINI_API_KEY. Using fallback simulation response.")
        fallback = FALLBACK_RESPONSE_TEMPLATE(sim_result)
        return fallback["what_happens"], sim_result, fallback["recommended_action"]
        
    prompt_payload = build_context_prompt(machine_context, sim_result, message)
    
    messages = [{"role": "user", "parts": [types.Part.from_text(text=prompt_payload)]}]
    
    try:
        while True:
            response = await call_gemini(messages)
            
            if response.function_calls:
                # Append model's function calls to history
                messages.append({"role": "model", "parts": response.parts})
                
                func_responses = []
                for fc in response.function_calls:
                    logger.info(f"LLM called tool: {fc.name} with args {fc.args}")
                    if fc.name == "get_sensor_data":
                        args = {k: v for k, v in fc.args.items()}
                        res = await get_sensor_data_tool(**args)
                    elif fc.name == "get_machines":
                        res = await get_machines_tool()
                    else:
                        res = {"error": "unknown function"}
                        
                    func_responses.append(
                        types.Part.from_function_response(name=fc.name, response={"result": res})
                    )
                
                # Append tool results back to history
                messages.append({"role": "user", "parts": func_responses})
            else:
                # LLM finished with final JSON string
                raw_output = response.text.strip()
                break
        
        # Cleanup potential markdown fences
        if raw_output.startswith("```"):
            raw_output = raw_output.split("```")[1]
            if raw_output.startswith("json"):
                raw_output = raw_output[4:]
            raw_output = raw_output.strip()
            
        parsed_json = json.loads(raw_output)
        
    except Exception as e:
        logger.error(f"LLM failed or returned invalid JSON: {e}")
        fallback = FALLBACK_RESPONSE_TEMPLATE(sim_result)
        return fallback["what_happens"], sim_result, fallback["recommended_action"]
        
    return parsed_json["what_happens"], sim_result, parsed_json["recommended_action"]
