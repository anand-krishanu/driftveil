package com.server.driftveil.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Port of chat_orchestrator.py — the AI chat "Brain" for operator Q&A.
 *
 * Handles the full Gemini function-calling loop:
 *   1. Parse operator intent from their message
 *   2. Run mathematical what-if simulation
 *   3. Call Gemini with MCP tool declarations
 *   4. Dispatch any tool calls Gemini makes → McpToolService
 *   5. Feed tool results back to Gemini
 *   6. Return final narrative + simulation object
 *
 * Mirrors Python's run_chat_turn(session_id, message, machine_context).
 */
@Service
public class ChatOrchestratorService {

    private static final String GEMINI_API_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=";

    @Value("${gemini.api.key:}")
    private String apiKey;

    private final McpToolService         mcpToolService;
    private final SimulationEngineService simulationEngine;
    private final PromptTemplateService  promptTemplates;
    private final ObjectMapper           mapper = new ObjectMapper();
    private final RestTemplate           restTemplate = new RestTemplate();

    public ChatOrchestratorService(McpToolService mcpToolService,
                                   SimulationEngineService simulationEngine,
                                   PromptTemplateService promptTemplates) {
        this.mcpToolService   = mcpToolService;
        this.simulationEngine = simulationEngine;
        this.promptTemplates  = promptTemplates;
    }

    /**
     * Main entry point — mirrors Python's run_chat_turn().
     *
     * @param sessionId      Chat session ID
     * @param message        Operator's natural language question
     * @param machineContext Live machine stats (moving_avg_temp, slope_temp, etc.)
     * @return [assistantMessage, simulationObject, recommendationText]
     */
    public ChatTurnResult runChatTurn(String sessionId, String message, Map<String, Object> machineContext) {
        // 1. Parse intent
        Map<String, Object> intent = parseUserIntent(message);

        // 2. Run math simulation
        Map<String, Object> simResult = simulationEngine.simulateWhatIf(machineContext, intent);

        // 3. Check if Gemini is available
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("[ChatOrchestrator] No API key — using fallback narrative.");
            Map<String, Object> fallback = promptTemplates.buildFallbackResponse(simResult);
            return new ChatTurnResult(
                    fallback.get("what_happens").toString(),
                    simResult,
                    fallback.get("recommended_action").toString()
            );
        }

        // 4. Build context prompt and run Gemini with MCP tools
        String promptPayload = promptTemplates.buildContextPrompt(machineContext, simResult, message);

        try {
            String finalJson = runGeminiWithToolLoop(promptPayload);

            // Parse JSON response
            String cleaned = cleanJsonFences(finalJson);
            JsonNode parsed = mapper.readTree(cleaned);

            String whatHappens = parsed.path("what_happens").asText(
                    "I've analyzed the situation based on the current telemetry.");
            String recommendation = parsed.path("recommended_action").asText(
                    "Monitor the system closely.");

            return new ChatTurnResult(whatHappens, simResult, recommendation);

        } catch (Exception e) {
            System.err.println("[ChatOrchestrator] Gemini call failed: " + e.getMessage());
            Map<String, Object> fallback = promptTemplates.buildFallbackResponse(simResult);
            return new ChatTurnResult(
                    fallback.get("what_happens").toString(),
                    simResult,
                    fallback.get("recommended_action").toString()
            );
        }
    }

    // ── Intent Parser (mirrors Python parse_user_intent) ─────────────────────

    /**
     * Extracts intervention type, magnitude, and horizon from natural language.
     * Mirrors Python's parse_user_intent(message).
     */
    public Map<String, Object> parseUserIntent(String message) {
        String msg = message.toLowerCase();

        // 1. Horizon (minutes)
        int horizon = 60; // default 1 hour
        Matcher minMatch = Pattern.compile("(\\d+)\\s*min").matcher(msg);
        Matcher hrMatch  = Pattern.compile("(\\d+)\\s*(hour|hr)").matcher(msg);
        if (minMatch.find()) {
            horizon = Integer.parseInt(minMatch.group(1));
        } else if (hrMatch.find()) {
            horizon = Integer.parseInt(hrMatch.group(1)) * 60;
        }

        // 2. Intervention type (order matters — specific first)
        String interventionType;
        boolean isConversational = false;

        if (msg.contains("stop") || msg.contains("halt") || msg.contains("shut")) {
            interventionType = "stop";
        } else if (msg.contains("rpm")) {
            interventionType = "reduce_rpm";
        } else if (msg.contains("inspect") || msg.contains("check") || msg.contains("maintenance")) {
            interventionType = "inspection";
        } else if (msg.contains("cool") || msg.contains("temperature") || msg.contains("heat")) {
            interventionType = "reduce_load";
        } else if (msg.contains("vibrat") || msg.contains("vib")) {
            interventionType = "reduce_rpm";
        } else if (containsAny(msg, "safe", "action", "first", "recommend", "advice", "suggest", "what should")) {
            interventionType = "stop";
            horizon = 30;
        } else if (msg.contains("load")) {
            interventionType = "reduce_load";
        } else {
            interventionType = "inspection";
            isConversational = true;
        }

        // 3. Magnitude
        int magnitude = 15;
        Matcher pctMatch = Pattern.compile("(\\d+)\\s*%").matcher(msg);
        if (pctMatch.find()) {
            magnitude = Integer.parseInt(pctMatch.group(1));
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("intervention_type",  interventionType);
        result.put("magnitude",          magnitude);
        result.put("horizon_minutes",    horizon);
        result.put("is_conversational",  isConversational);
        return result;
    }

    // ── Gemini Tool-Calling Loop ──────────────────────────────────────────────

    /**
     * Handles the multi-turn Gemini function-calling loop.
     * Mirrors Python's while True loop in run_chat_turn.
     *
     * 1. Send message to Gemini with MCP tool declarations
     * 2. If Gemini responds with function_calls → dispatch → feed results back
     * 3. If Gemini responds with text → done
     */
    private String runGeminiWithToolLoop(String promptPayload) throws Exception {
        String url = GEMINI_API_URL + apiKey;

        // Build initial message history
        List<Map<String, Object>> contents = new ArrayList<>();
        contents.add(Map.of(
                "role",  "user",
                "parts", List.of(Map.of("text", promptPayload))
        ));

        // Tool declarations — mirrors Python MCP_TOOLS definitions
        List<Map<String, Object>> tools = buildMcpToolDeclarations();

        for (int turn = 0; turn < 5; turn++) { // max 5 turns to prevent infinite loop
            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("system_instruction", Map.of(
                    "parts", List.of(Map.of("text", PromptTemplateService.SYSTEM_PROMPT))
            ));
            requestBody.put("contents", contents);
            requestBody.put("tools", tools);
            requestBody.put("generationConfig", Map.of("temperature", 0.2));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<String> response = restTemplate.postForEntity(url, entity, String.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new RuntimeException("Gemini error: " + response.getStatusCode());
            }

            JsonNode root = mapper.readTree(response.getBody());
            JsonNode candidate = root.path("candidates").get(0);
            JsonNode content   = candidate.path("content");
            JsonNode parts     = content.path("parts");

            // Check for function calls
            boolean hasFunctionCall = false;
            List<Map<String, Object>> toolResponses = new ArrayList<>();

            for (JsonNode part : parts) {
                if (part.has("functionCall")) {
                    hasFunctionCall = true;
                    String funcName = part.path("functionCall").path("name").asText();
                    JsonNode argsNode = part.path("functionCall").path("args");

                    System.out.println("[ChatOrchestrator] Gemini called tool: " + funcName);
                    Object toolResult = dispatchTool(funcName, argsNode);

                    toolResponses.add(Map.of(
                            "functionResponse", Map.of(
                                    "name",     funcName,
                                    "response", Map.of("result", toolResult)
                            )
                    ));
                }
            }

            if (hasFunctionCall) {
                // Append model's function call turn to history
                List<Map<String, Object>> modelParts = new ArrayList<>();
                for (JsonNode part : parts) {
                    if (part.has("functionCall")) {
                        modelParts.add(mapper.convertValue(part, Map.class));
                    }
                }
                contents.add(Map.of("role", "model", "parts", modelParts));

                // Append tool results as user turn
                contents.add(Map.of("role", "user", "parts", toolResponses));

            } else {
                // Gemini finished — return text
                return parts.get(0).path("text").asText("");
            }
        }

        throw new RuntimeException("Gemini tool loop exceeded max turns.");
    }

    /**
     * Dispatches a tool call from Gemini to McpToolService.
     * Mirrors Python's if fc.name == "get_sensor_data": / elif fc.name == "get_machines":
     */
    private Object dispatchTool(String funcName, JsonNode argsNode) {
        return switch (funcName) {
            case "get_sensor_data" -> {
                String machineId = argsNode.path("machine_id").asText("MCH-03");
                int    start     = argsNode.path("start").asInt(-1);
                int    limit     = argsNode.path("limit").asInt(10);
                yield  mcpToolService.getSensorData(machineId, start, limit);
            }
            case "get_machines" -> mcpToolService.getMachines();
            default -> Map.of("error", "unknown tool: " + funcName);
        };
    }

    /**
     * Builds the MCP tool declarations for Gemini.
     * Mirrors Python's MCP_TOOLS list with FunctionDeclaration objects.
     */
    private List<Map<String, Object>> buildMcpToolDeclarations() {
        Map<String, Object> getSensorDataDecl = new LinkedHashMap<>();
        getSensorDataDecl.put("name", "get_sensor_data");
        getSensorDataDecl.put("description", "Fetch raw historical telemetry sensor data for a machine.");
        getSensorDataDecl.put("parameters", Map.of(
                "type", "object",
                "properties", Map.of(
                        "machine_id", Map.of("type", "string", "description", "Machine ID, e.g. MCH-03"),
                        "start",      Map.of("type", "integer", "description", "-1 for latest data, 0 for oldest"),
                        "limit",      Map.of("type", "integer", "description", "Number of rows to return")
                ),
                "required", List.of("machine_id")
        ));

        Map<String, Object> getMachinesDecl = new LinkedHashMap<>();
        getMachinesDecl.put("name", "get_machines");
        getMachinesDecl.put("description",
                "Fetch the latest live status, temperature, and vibration of all machines.");

        return List.of(
                Map.of("functionDeclarations", List.of(getSensorDataDecl, getMachinesDecl))
        );
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private boolean containsAny(String text, String... keywords) {
        for (String kw : keywords) if (text.contains(kw)) return true;
        return false;
    }

    private String cleanJsonFences(String raw) {
        if (raw == null) return "{}";
        raw = raw.strip();
        if (raw.startsWith("```")) {
            String[] parts = raw.split("```");
            if (parts.length > 1) {
                raw = parts[1];
                if (raw.startsWith("json")) raw = raw.substring(4);
                raw = raw.strip();
            }
        }
        return raw;
    }

    // ── Result DTO ────────────────────────────────────────────────────────────

    /**
     * Equivalent of Python's Tuple[str, dict, str] return from run_chat_turn().
     */
    public record ChatTurnResult(
            String assistantMessage,
            Map<String, Object> simulation,
            String recommendation
    ) {}
}
