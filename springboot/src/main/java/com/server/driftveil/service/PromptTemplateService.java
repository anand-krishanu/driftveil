package com.server.driftveil.service;

import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Port of prompt_templates.py.
 *
 * Centralizes all Gemini prompt strings and template-building logic.
 */
@Service
public class PromptTemplateService {

    // ── System Prompt (mirrors Python SYSTEM_PROMPT) ──────────────────────────
    public static final String SYSTEM_PROMPT =
            "You are an industrial reliability assistant. Your job is to translate statistical " +
            "projections into clear, actionable advice for plant operators, and to answer any " +
            "questions about the machine's state.\n\n" +
            "Rules:\n" +
            "1. You MUST answer the user's question, whether it is a simulation request, a general " +
            "question, or a request for data.\n" +
            "2. Use the provided JSON simulation results AND call the MCP tools (e.g. get_sensor_data, " +
            "get_machines) to fetch live data to inform your answer.\n" +
            "3. DO NOT hallucinate numbers. Rely on the MCP tools provided.\n" +
            "4. Be direct, authoritative, and concise. Operators reading this are in active production.\n\n" +
            "You must reply strictly in the following JSON format without any markdown code fences.\n\n" +
            "{\n" +
            "  \"summary\": \"1 sentence recap of the user's query\",\n" +
            "  \"what_happens\": \"Your main response to the user. This can be an explanation, an answer " +
            "to their question, or the outcome of a simulation.\",\n" +
            "  \"risk_level\": \"low | medium | high\",\n" +
            "  \"recommended_action\": \"The exact next physical step the operator should take, or general advice\",\n" +
            "  \"assumptions\": \"List of variables that could invalidate this projection, or data sources used\",\n" +
            "  \"confidence\": \"low | medium | high\"\n" +
            "}";

    public static final String REPAIR_PROMPT =
            "The output you provided was not valid JSON or broke the schema. " +
            "Return ONLY valid JSON matching the exact schema requested originally. No markdown blocks.";

    // ── Context Prompt (mirrors Python build_context_prompt) ──────────────────

    /**
     * Builds the user-turn prompt payload for the chat orchestrator.
     * Mirrors Python's build_context_prompt(context, simulation_result, user_question).
     */
    public String buildContextPrompt(Map<String, Object> context,
                                     Map<String, Object> simResult,
                                     String userQuestion) {
        // Manually build the JSON to avoid extra Jackson import here; context already has simple types
        return String.format(
                "{\n" +
                "  \"machine_context\": %s,\n" +
                "  \"simulation_output\": %s,\n" +
                "  \"operator_question\": %s\n" +
                "}",
                mapToJson(context),
                mapToJson(simResult),
                "\"" + userQuestion.replace("\"", "\\\"") + "\""
        );
    }

    // ── Fallback Template (mirrors Python FALLBACK_RESPONSE_TEMPLATE) ─────────

    /**
     * Generates a rich mock narrative for when the Gemini API key is missing.
     * Mirrors Python's FALLBACK_RESPONSE_TEMPLATE(sim_result).
     */
    public Map<String, Object> buildFallbackResponse(Map<String, Object> simResult) {
        String intervention = simResult.getOrDefault("intervention_type", "inspect")
                .toString().replace("_", " ");
        double maxTemp  = toDouble(simResult.getOrDefault("projected_max_temperature", 70.0));
        String risk     = simResult.getOrDefault("risk_level", "medium").toString();
        int    horizon  = toInt(simResult.getOrDefault("horizon_minutes", 60));

        String narrative = String.format(
                "Based on the live telemetry, if you %s, the system projects the peak temperature " +
                "will reach %.1f°C within the %d minute horizon. ", intervention, maxTemp, horizon);

        String action;
        if ("high".equals(risk)) {
            narrative += "This remains in the critical danger zone and will likely trigger forced " +
                         "auto-shutdowns to prevent stator damage.";
            action = "Halt production immediately to perform thermal inspection.";
        } else if ("medium".equals(risk)) {
            narrative += "This keeps the asset within stable operating bounds, but requires close " +
                         "monitoring as the CUSUM drift remains elevated.";
            action = "Implement the adjustment and monitor the heat dissipation curve.";
        } else {
            narrative += "This intervention is effective. The parameter slopes are flattened safely " +
                         "below SCADA thresholds.";
            action = "Proceed with the adjustment. No further downtime anticipated.";
        }

        return Map.of(
                "summary",            "Simulating " + intervention + " over " + horizon + "m.",
                "what_happens",       narrative,
                "risk_level",         risk,
                "recommended_action", action,
                "assumptions",        "Calculated via offline deterministic math engine (Demo Mode).",
                "confidence",         "high"
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String mapToJson(Map<String, Object> map) {
        if (map == null || map.isEmpty()) return "{}";
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        for (Map.Entry<String, Object> e : map.entrySet()) {
            if (!first) sb.append(", ");
            first = false;
            sb.append("\"").append(e.getKey()).append("\": ");
            Object v = e.getValue();
            if (v instanceof String s) sb.append("\"").append(s.replace("\"", "\\\"")).append("\"");
            else sb.append(v);
        }
        sb.append("}");
        return sb.toString();
    }

    private double toDouble(Object v) {
        if (v instanceof Number n) return n.doubleValue();
        try { return Double.parseDouble(v.toString()); } catch (Exception e) { return 0.0; }
    }

    private int toInt(Object v) {
        if (v instanceof Number n) return n.intValue();
        try { return Integer.parseInt(v.toString()); } catch (Exception e) { return 0; }
    }
}
