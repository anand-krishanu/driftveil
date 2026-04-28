package com.server.driftveil.service;

import org.springframework.stereotype.Service;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Port of simulation_engine.py — pure math, zero AI.
 *
 * Simulates how equipment parameters evolve over a time horizon
 * given an operator intervention (reduce_load, reduce_rpm, stop, inspection).
 *
 * Called by ChatOrchestratorService before asking Gemini for narrative.
 */
@Service
public class SimulationEngineService {

    // Mirrors Python INTERVENTION_MULTIPLIERS dict
    private static final Map<String, double[]> INTERVENTION_MULTIPLIERS = Map.of(
            "reduce_load",  new double[]{0.70, 0.75},  // [temp_slope_mult, vib_slope_mult]
            "reduce_rpm",   new double[]{0.60, 0.65},
            "stop",         new double[]{0.00, 0.00},
            "inspection",   new double[]{1.00, 1.00}
    );

    /**
     * Simulates equipment projection over a time horizon.
     * Mirrors Python's simulate_what_if(context, intent).
     *
     * @param context machine live stats: moving_avg_temp, latest_vib, slope_temp, slope_vib, cusum_score
     * @param intent  parsed operator intent: intervention_type, horizon_minutes
     * @return projection map: projected_max_temperature, projected_max_vibration, risk_level, confidence, etc.
     */
    public Map<String, Object> simulateWhatIf(Map<String, Object> context, Map<String, Object> intent) {
        int    horizonMinutes    = toInt(intent.getOrDefault("horizon_minutes", 60));
        String interventionType = intent.getOrDefault("intervention_type", "reduce_load").toString();

        // 1 tick = 5 seconds — matches Python's _generate_stream_rows interval
        // ticks_forward = (horizon_minutes * 60) / 5
        int ticksForward = horizonMinutes * 12;

        // Starting conditions from live telemetry
        double startTemp  = toDouble(context.getOrDefault("moving_avg_temp", 60.5));
        double startVib   = toDouble(context.getOrDefault("latest_vib",       0.3));
        double startCusum = toDouble(context.getOrDefault("cusum_score",       0.0));
        double slopeTemp  = toDouble(context.getOrDefault("slope_temp",        0.0));
        double slopeVib   = toDouble(context.getOrDefault("slope_vib",         0.0));

        // Apply multipliers
        double[] mult = INTERVENTION_MULTIPLIERS.getOrDefault(
                interventionType, new double[]{1.0, 1.0});
        double adjSlopeTemp = slopeTemp * mult[0];
        double adjSlopeVib  = slopeVib  * mult[1];

        // Projection math — matches Python exactly
        double projMaxTemp, projMaxVib, cusumDelta;

        if ("stop".equals(interventionType)) {
            // Simulate cooling down
            projMaxTemp  = Math.max(25.0, startTemp - (ticksForward * 0.05));
            projMaxVib   = 0.0;
            cusumDelta   = -startCusum;  // resets
        } else {
            projMaxTemp  = startTemp + (adjSlopeTemp * ticksForward);
            projMaxVib   = startVib  + (adjSlopeVib  * ticksForward);
            cusumDelta   = (projMaxTemp - 60.5) * ((double) ticksForward / 60.0);
        }

        // Risk scoring — mirrors Python thresholds
        String riskLevel;
        if (projMaxTemp > 90 || projMaxVib > 0.8) {
            riskLevel = "high";
        } else if (projMaxTemp > 75 || projMaxVib > 0.5) {
            riskLevel = "medium";
        } else {
            riskLevel = "low";
        }

        // Confidence — mirrors Python: high variance → lower confidence
        double variance = toDouble(context.getOrDefault("variance", 0.0));
        String confidence = variance < 2 ? "high" : "medium";

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("horizon_minutes",            horizonMinutes);
        result.put("intervention_type",          interventionType);
        result.put("projected_max_temperature",  round2(Math.max(0, projMaxTemp)));
        result.put("projected_max_vibration",    round4(Math.max(0, projMaxVib)));
        result.put("projected_cusum_delta",      round2(cusumDelta));
        result.put("risk_level",                 riskLevel);
        result.put("confidence",                 confidence);
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0.0; }
    }

    private int toInt(Object v) {
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; }
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }
}
