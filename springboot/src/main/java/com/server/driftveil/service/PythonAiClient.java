package com.server.driftveil.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * HTTP client that delegates AI agent calls to the Python FastAPI backend.
 * Called by Spring Boot when drift is detected — Python handles Gemini logic.
 */
@Service
public class PythonAiClient {

    @Value("${python.ai.url:http://localhost:8000}")
    private String pythonUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Calls Python's /api/chat/simulate with machineId and message.
     * Returns a typed Map<String, Object> for easy use in controllers.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> simulateChat(String machineId, String message) {
        try {
            String url = pythonUrl + "/api/chat/simulate";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            Map<String, String> body = Map.of("machine_id", machineId, "message", message);
            HttpEntity<Map<String, String>> entity = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getBody() != null) {
                return (Map<String, Object>) response.getBody();
            }
        } catch (Exception e) {
            System.err.println("[PythonAiClient] simulateChat failed: " + e.getMessage());
        }
        // Fallback when Python is unreachable
        Map<String, Object> fallback = new LinkedHashMap<>();
        fallback.put("assistant_message", "Python AI service is not reachable. Start it on port 8000.");
        fallback.put("simulation", Map.of("risk_level", "low"));
        fallback.put("recommendation", "Start the Python backend: uvicorn main:app --port 8000");
        return fallback;
    }

    /**
     * Future: delegates drift agent pipeline to Python.
     * Add POST /api/run-agents to Python main.py to enable this.
     */
    public Map<String, Object> runDriftAgents(String machineId, Object driftingRows, Object detectionStats) {
        // TODO: call Python when /api/run-agents is ready
        Map<String, Object> placeholder = new LinkedHashMap<>();
        placeholder.put("title",      "Drift Detected");
        placeholder.put("eta_days",   7);
        placeholder.put("action",     "Connect Python agent: POST http://localhost:8000/api/run-agents");
        placeholder.put("severity",   "medium");
        placeholder.put("confidence", "medium");
        return placeholder;
    }
}
