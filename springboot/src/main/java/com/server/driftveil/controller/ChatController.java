package com.server.driftveil.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.server.driftveil.dto.ChatMessageRequest;
import com.server.driftveil.entity.ChatMessage;
import com.server.driftveil.entity.ChatSession;
import com.server.driftveil.entity.WhatIfSimulation;
import com.server.driftveil.repository.ChatMessageRepository;
import com.server.driftveil.repository.ChatSessionRepository;
import com.server.driftveil.repository.WhatIfSimulationRepository;
import com.server.driftveil.service.ChatOrchestratorService;
import com.server.driftveil.service.FeedService;
import com.server.driftveil.websocket.MachineStreamState;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Ports chat REST endpoints from Python main.py:
 *   POST /api/chat/sessions
 *   GET  /api/chat/sessions/{session_id}/messages
 *   POST /api/chat/sessions/{session_id}/message
 *   POST /api/chat/simulate
 */
@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatSessionRepository        sessionRepo;
    private final ChatMessageRepository        messageRepo;
    private final WhatIfSimulationRepository   simRepo;
    private final ChatOrchestratorService      chatOrchestrator;
    private final FeedService                  feedService;
    private final ObjectMapper                 objectMapper = new ObjectMapper();

    public ChatController(ChatSessionRepository sessionRepo,
                          ChatMessageRepository messageRepo,
                          WhatIfSimulationRepository simRepo,
                          ChatOrchestratorService chatOrchestrator,
                          FeedService feedService) {
        this.sessionRepo      = sessionRepo;
        this.messageRepo      = messageRepo;
        this.simRepo          = simRepo;
        this.chatOrchestrator = chatOrchestrator;
        this.feedService      = feedService;
    }

    // ── POST /api/chat/sessions ───────────────────────────────────────────────
    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(@RequestBody Map<String, String> body) {
        String machineId = body.getOrDefault("machine_id", "");
        ChatSession session = new ChatSession();
        session.setId(UUID.randomUUID().toString());
        session.setMachineId(machineId);
        sessionRepo.save(session);
        return ResponseEntity.ok(Map.of("session_id", session.getId()));
    }

    // ── GET /api/chat/sessions/{sessionId}/messages ───────────────────────────
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<Map<String, Object>> getMessages(@PathVariable String sessionId) {
        List<ChatMessage> msgs = messageRepo.findBySessionIdOrderByCreatedAtAsc(sessionId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ChatMessage m : msgs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("role",         m.getRole());
            row.put("content",      m.getContent());
            row.put("simulationId", m.getSimulationId());
            result.add(row);
        }
        return ResponseEntity.ok(Map.of("messages", result));
    }

    // ── POST /api/chat/sessions/{sessionId}/message ───────────────────────────
    @PostMapping("/sessions/{sessionId}/message")
    public ResponseEntity<Map<String, Object>> sendMessage(
            @PathVariable String sessionId,
            @RequestBody ChatMessageRequest req) {

        String machineId = req.getMachineId();
        String userText  = req.getMessage();

        // 1. Save user message
        messageRepo.save(buildMessage(sessionId, "user", userText, null));

        // 2. Build machine context from live FeedService state (mirrors Python's get_state())
        Map<String, Object> machineContext = buildMachineContext(machineId);

        // 3. Run chat turn via Java orchestrator (replaces pythonAiClient.simulateChat)
        ChatOrchestratorService.ChatTurnResult result =
                chatOrchestrator.runChatTurn(sessionId, userText, machineContext);

        String assistantReply = result.assistantMessage();
        Map<String, Object> simulationObj  = result.simulation();
        String recommendation = result.recommendation();
        String riskLevel      = str(simulationObj.getOrDefault("risk_level", "low"), "low");
        String resultJsonStr  = toJsonSafe(simulationObj);

        // 4. Save simulation record
        WhatIfSimulation sim = new WhatIfSimulation();
        sim.setId(UUID.randomUUID().toString());
        sim.setMachineId(machineId);
        sim.setSessionId(sessionId);
        sim.setUserQuestion(userText);
        sim.setScenarioJson("{}");
        sim.setResultJson(resultJsonStr);
        sim.setRiskLevel(riskLevel);
        simRepo.save(sim);

        // 5. Save assistant reply (linked to simulation)
        messageRepo.save(buildMessage(sessionId, "assistant", assistantReply, sim.getId()));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("assistant_message", assistantReply);
        response.put("simulation",        simulationObj);
        response.put("recommendation",    recommendation);
        return ResponseEntity.ok(response);
    }

    // ── POST /api/chat/simulate ────────────────────────────────────────────────
    /** Direct simulation — no DB saves. Mirrors Python's simulate_direct(). */
    @PostMapping("/simulate")
    public ResponseEntity<Map<String, Object>> simulateDirect(@RequestBody ChatMessageRequest req) {
        Map<String, Object> machineContext = buildMachineContext(req.getMachineId());
        ChatOrchestratorService.ChatTurnResult result =
                chatOrchestrator.runChatTurn("direct", req.getMessage(), machineContext);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("assistant_message", result.assistantMessage());
        response.put("simulation",        result.simulation());
        response.put("recommendation",    result.recommendation());
        return ResponseEntity.ok(response);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Builds live machine context from FeedService in-memory state.
     * Mirrors Python's get_state() + agent_detection() calls in send_chat_message().
     */
    private Map<String, Object> buildMachineContext(String machineId) {
        MachineStreamState st = feedService.getOrCreateState(machineId);
        List<Map<String, Object>> rows = st.getSentRows().isEmpty() ? List.of() :
                st.getSentRows().subList(
                        Math.max(0, st.getSentRows().size() - 30),
                        st.getSentRows().size());
        Map<String, Object> detectionStats = feedService.detectDrift(rows);

        Map<String, Object> ctx = new LinkedHashMap<>();
        ctx.put("machine_id",      machineId);
        ctx.put("moving_avg_temp", detectionStats.getOrDefault("moving_avg_temp", 60.5));
        ctx.put("slope_temp",      detectionStats.getOrDefault("slope_temp", 0.0));
        ctx.put("slope_vib",       detectionStats.getOrDefault("slope_vib", 0.0));
        ctx.put("cusum_score",     detectionStats.getOrDefault("cusum_score", 0.0));
        ctx.put("latest_vib",      st.getSentRows().isEmpty() ? 0.3 :
                st.getSentRows().get(st.getSentRows().size() - 1).getOrDefault("vibration", 0.3));
        return ctx;
    }

    private ChatMessage buildMessage(String sessionId, String role, String content, String simulationId) {
        ChatMessage msg = new ChatMessage();
        msg.setId(UUID.randomUUID().toString());
        msg.setSessionId(sessionId);
        msg.setRole(role);
        msg.setContent(content);
        msg.setSimulationId(simulationId);
        return msg;
    }

    /** Converts any Object to a valid JSON string using Jackson. */
    private String toJsonSafe(Object obj) {
        try { return objectMapper.writeValueAsString(obj); }
        catch (Exception e) { return "{}"; }
    }

    /** Null-safe string extraction with a fallback default. */
    private String str(Object val, String fallback) {
        return val != null ? val.toString() : fallback;
    }
}
