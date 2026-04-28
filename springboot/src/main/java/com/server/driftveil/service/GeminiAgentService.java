package com.server.driftveil.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.server.driftveil.dto.AlertResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;

/**
 * Port of Python's agent_root_cause() + run_agent_pipeline() from main.py.
 *
 * Called by FeedWebSocketHandler when CUSUM drift is detected.
 * Calls the Gemini REST API directly (no extra SDK needed — just the API key).
 *
 * Flow:
 *   1. Fetch failure fingerprints from McpToolService (replaces MCP HTTP call)
 *   2. Build diagnosis prompt with drifting rows + detection stats + fingerprints
 *   3. Call Gemini with JSON structured output schema
 *   4. Parse and return AlertResponse
 *   5. Fallback gracefully if no API key or Gemini fails
 */
@Service
public class GeminiAgentService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    private static final int MAX_RETRIES = 3;

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final McpToolService mcpToolService;
    private final ObjectMapper   mapper = new ObjectMapper();
    private final RestTemplate   restTemplate = new RestTemplate();

    public GeminiAgentService(McpToolService mcpToolService) {
        this.mcpToolService = mcpToolService;
    }

    /**
     * Main entry point — called from FeedWebSocketHandler on drift detection.
     * Mirrors Python's run_agent_pipeline() + agent_root_cause().
     *
     * @param driftingRows    Last 15 sensor rows showing drift
     * @param detectionStats  Output from FeedService.detectDrift()
     * @return AlertResponse  Structured diagnosis result
     */
    public AlertResponse runRootCauseAnalysis(List<Map<String, Object>> driftingRows,
                                              Map<String, Object> detectionStats) {
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("[GeminiAgent] No API key — returning offline fallback.");
            return AlertResponse.offlineFallback();
        }

        // Fetch fingerprints via McpToolService (replaces Python's HTTP call to mcp_server)
        List<Map<String, Object>> fingerprints;
        try {
            fingerprints = mcpToolService.getFingerprints();
        } catch (Exception e) {
            System.err.println("[GeminiAgent] Failed to fetch fingerprints: " + e.getMessage());
            fingerprints = List.of();
        }

        String prompt = buildDiagnosisPrompt(driftingRows, detectionStats, fingerprints);

        // Retry loop — mirrors Python @retry(stop_after_attempt(3))
        for (int attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                AlertResponse result = callGeminiStructured(prompt);
                System.out.printf("[GeminiAgent] Root cause analysis complete (attempt %d): %s%n",
                        attempt, result.title());
                return result;
            } catch (Exception e) {
                System.err.printf("[GeminiAgent] Attempt %d/%d failed: %s%n",
                        attempt, MAX_RETRIES, e.getMessage());
                if (attempt < MAX_RETRIES) {
                    try {
                        // Exponential backoff: 2s, 4s, 8s (mirrors Python wait_exponential)
                        Thread.sleep(2000L * attempt);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                    }
                }
            }
        }

        System.err.println("[GeminiAgent] All retries exhausted — returning error fallback.");
        return AlertResponse.errorFallback();
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    /**
     * Calls the Gemini REST API with a JSON response schema.
     * Mirrors Python's gemini_client.aio.models.generate_content(..., response_schema=AlertResponseModel).
     */
    private AlertResponse callGeminiStructured(String prompt) throws Exception {
        String url = GEMINI_API_URL + apiKey;

        // Build request body with structured output schema
        Map<String, Object> requestBody = new LinkedHashMap<>();

        // Contents
        requestBody.put("contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
        ));

        // Generation config — request JSON with schema
        Map<String, Object> responseSchema = buildAlertResponseSchema();
        requestBody.put("generationConfig", Map.of(
                "temperature",        0.2,
                "responseMimeType",   "application/json",
                "responseSchema",     responseSchema
        ));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);

        if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
            throw new RuntimeException("Gemini returned non-2xx: " + response.getStatusCode());
        }

        // Parse the Gemini response
        JsonNode root = mapper.readTree(response.getBody());
        String text = root
                .path("candidates").get(0)
                .path("content").path("parts").get(0)
                .path("text").asText();

        return mapper.readValue(text, AlertResponse.class);
    }

    /**
     * Builds the JSON Schema object for AlertResponse — tells Gemini the exact
     * fields and types it must output. Mirrors Python's Pydantic response_schema.
     */
    private Map<String, Object> buildAlertResponseSchema() {
        Map<String, Object> props = new LinkedHashMap<>();
        props.put("title",         Map.of("type", "string", "description", "Short title of the fault (max 6 words)"));
        props.put("eta_days",      Map.of("type", "integer", "description", "Estimated days until critical failure"));
        props.put("action",        Map.of("type", "string",  "description", "The single most important action for the operator (1-2 sentences)"));
        props.put("severity",      Map.of("type", "string",  "description", "low, medium, or high"));
        props.put("confidence",    Map.of("type", "string",  "description", "low, medium, or high"));
        props.put("diagnosis_raw", Map.of("type", "string",  "description", "Verbose technical explanation of WHY this fingerprint matches and the full diagnosis."));

        return Map.of(
                "type",       "object",
                "properties", props,
                "required",   List.of("title", "eta_days", "action", "severity", "confidence", "diagnosis_raw")
        );
    }

    /**
     * Builds the diagnosis prompt.
     * Mirrors Python's prompt string in agent_root_cause().
     */
    private String buildDiagnosisPrompt(List<Map<String, Object>> driftingRows,
                                         Map<String, Object> detectionStats,
                                         List<Map<String, Object>> fingerprints) {
        String dataSummary  = toJsonSafe(driftingRows);
        String statsSummary = toJsonSafe(detectionStats);
        String fpSummary    = toJsonSafe(fingerprints);

        return "You are an expert industrial equipment diagnostics AI.\n\n" +
               "SENSOR READINGS (last 15 rows showing drift):\n" + dataSummary + "\n\n" +
               "DETECTION STATISTICS:\n" + statsSummary + "\n\n" +
               "KNOWN FAILURE FINGERPRINTS (from engineering database):\n" + fpSummary + "\n\n" +
               "Instructions:\n" +
               "1. Analyze the sensor trends (temperature and vibration over time).\n" +
               "2. Match the drift pattern to the MOST LIKELY failure fingerprint.\n" +
               "3. Provide a verbose `diagnosis_raw` explaining WHY this fingerprint matches " +
               "(temperature slope, vibration behavior).\n" +
               "4. Estimate how many days until critical failure.\n" +
               "5. Provide a short `title` and a recommended `action`.\n\n" +
               "Be concise but technically precise. This diagnosis goes to a plant operator.";
    }

    private String toJsonSafe(Object obj) {
        try { return mapper.writeValueAsString(obj); }
        catch (Exception e) { return "[]"; }
    }
}
