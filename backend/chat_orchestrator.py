import re
import json
import logging
from typing import Dict, Any, Tuple
from google import genai
from google.genai import types
import os

from simulation_engine import simulate_what_if
from prompt_templates import SYSTEM_PROMPT, build_context_prompt, REPAIR_PROMPT, FALLBACK_RESPONSE_TEMPLATE
from dotenv import load_dotenv

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

async def run_chat_turn(session_id: str, message: str, machine_context: dict) -> Tuple[str, dict, str]:
    """
    Returns (assistant_message, simulation_object, recommendation_text)
    """
    # 1. Parse rules 
    intent = parse_user_intent(message)
    
    msg_lower = message.lower()
    
    # ── 1. Conversational Short-Circuit Responses ──
    # If the user asks a non-simulation question, answer directly like an AI!
    if "hello" in msg_lower or "hi" == msg_lower.strip():
        return "Hello! I am your DriftVeil AI operator assistant. How can I help you mitigate this equipment issue today?", {}, ""
    elif "name" in msg_lower and ("machine" in msg_lower or "my" in msg_lower):
        m_id = machine_context.get('machine_id', 'this machine')
        return f"You are currently analyzing {m_id}, generating live telemetry.", {}, "Please ask me to simulate an intervention."
    elif "who are you" in msg_lower or "what are you" in msg_lower:
        return "I am an industrial reliability AI. I run math simulations to project how your interventions will affect machine temperature and vibration before you actually perform them.", {}, ""
    elif "thank" in msg_lower:
        return "You're very welcome! Let me know if you need to run any more simulations.", {}, ""
    elif intent.get("is_conversational", False):
        # Fallback conversational response for general questions 
        return "I am focused entirely on preventing equipment failure right now. Please ask me to simulate a specific intervention like 'reduce load by 20%' or ask 'what is the safest action?' to proceed.", {}, ""

    # ── 2. Run Mathematical Simulation Engine ──
    sim_result = simulate_what_if(machine_context, intent)
    
    # ── 3. Request LLM Narrative ──
    if not gemini_client:
        logger.warning("No GEMINI_API_KEY. Using fallback simulation response.")
        fallback = FALLBACK_RESPONSE_TEMPLATE(sim_result)
        return fallback["what_happens"], sim_result, fallback["recommended_action"]
        
    prompt_payload = build_context_prompt(machine_context, sim_result, message)
    
    try:
        response = await gemini_client.aio.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt_payload,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
                temperature=0.2,
                response_mime_type="application/json",
            )
        )
        
        raw_output = response.text.strip()
        
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
