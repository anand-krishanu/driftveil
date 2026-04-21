import math
from typing import Dict, Any, List

# Multipliers applied to the *slope* of degradation
INTERVENTION_MULTIPLIERS = {
    "reduce_load": {
        "temp_slope": 0.7,
        "vib_slope": 0.75
    },
    "reduce_rpm": {
        "temp_slope": 0.6,
        "vib_slope": 0.65
    },
    "stop": {
        "temp_slope": 0.0,
        "vib_slope": 0.0
    },
    "inspection": {
        "temp_slope": 1.0,
        "vib_slope": 1.0
    }
}

def simulate_what_if(context: Dict[str, Any], intent: Dict[str, Any]) -> Dict[str, Any]:
    """
    Simulates equipment parameters over the requested horizon.
    `context` contains live machine stats (moving_avg_temp, slope_temp, slope_vib).
    `intent` contains intervention type, magnitude, horizon in minutes.
    """
    
    # Defaults
    horizon_minutes = intent.get("horizon_minutes", 60)
    intervention_type = intent.get("intervention_type", "reduce_load")
    
    # 1 tick = 5 seconds (from _generate_stream_rows). 
    # To project accurately, ticks_forward = (horizon_minutes * 60) / 5
    ticks_forward = horizon_minutes * 12
    
    # Starting conditions from the latest telemetry
    start_temp = context.get("moving_avg_temp", 60.5)
    start_vib = context.get("latest_vib", 0.3)
    start_cusum = context.get("cusum_score", 0.0)
    
    slope_temp = context.get("slope_temp", 0.0)
    slope_vib = context.get("slope_vib", 0.0)
    
    # Apply multipliers
    mult = INTERVENTION_MULTIPLIERS.get(intervention_type, {"temp_slope": 1.0, "vib_slope": 1.0})
    adjusted_slope_temp = slope_temp * mult["temp_slope"]
    adjusted_slope_vib = slope_vib * mult["vib_slope"]
    
    # Projection math
    if intervention_type == "stop":
        # Simulating cooling down
        projected_max_temp = max(25.0, start_temp - (ticks_forward * 0.05))
        projected_max_vib = 0.0
        cusum_delta = -start_cusum # resets
    else:
        projected_max_temp = start_temp + (adjusted_slope_temp * ticks_forward)
        projected_max_vib = start_vib + (adjusted_slope_vib * ticks_forward)
        cusum_delta = (projected_max_temp - 60.5) * (ticks_forward / 60) # rough estimate of area under curve
        
    # Risk scoring
    if projected_max_temp > 90 or projected_max_vib > 0.8:
        risk_level = "high"
    elif projected_max_temp > 75 or projected_max_vib > 0.5:
        risk_level = "medium"
    else:
        risk_level = "low"
        
    # Confidence guidance
    variance = context.get("variance", 0) # High variance -> lower confidence
    confidence = "high" if variance < 2 else "medium"

    return {
        "horizon_minutes": horizon_minutes,
        "intervention_type": intervention_type,
        "projected_max_temperature": round(max(0, projected_max_temp), 2),
        "projected_max_vibration": round(max(0, projected_max_vib), 4),
        "projected_cusum_delta": round(cusum_delta, 2),
        "risk_level": risk_level,
        "confidence": confidence
    }
