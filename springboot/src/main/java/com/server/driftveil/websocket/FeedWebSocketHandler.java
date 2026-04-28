package com.server.driftveil.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.server.driftveil.dto.AlertResponse;
import com.server.driftveil.service.FeedService;
import com.server.driftveil.service.GeminiAgentService;
import com.server.driftveil.service.MachineService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Raw WebSocket handler — mirrors Python's @app.websocket("/ws/feed/{machine_id}").
 * Path: /ws/feed/{machine_id}
 * Streams at 2Hz (500ms) using @Scheduled.
 */
@Component
public class FeedWebSocketHandler extends TextWebSocketHandler {

    private static final int CHUNK_SIZE = 1;

    private final FeedService        feedService;
    private final MachineService      machineService;
    private final GeminiAgentService  geminiAgentService;
    private final ObjectMapper        mapper = new ObjectMapper();

    // Track active sessions: machineId → WebSocketSession
    private final ConcurrentHashMap<String, WebSocketSession> sessions = new ConcurrentHashMap<>();

    public FeedWebSocketHandler(FeedService feedService,
                                 MachineService machineService,
                                 GeminiAgentService geminiAgentService) {
        this.feedService        = feedService;
        this.machineService     = machineService;
        this.geminiAgentService = geminiAgentService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String machineId = extractMachineId(session);
        sessions.put(machineId, session);
        System.out.println("[WS] Connected for " + machineId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String machineId = extractMachineId(session);
        sessions.remove(machineId);
        System.out.println("[WS] Disconnected from " + machineId);
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) {
        // Client can send messages — handled if needed in future
    }

    /**
     * The 2Hz loop — runs every 500ms, processes all active machine sessions.
     * Mirrors the asyncio.sleep(0.5) loop in Python's websocket_feed().
     */
    @Scheduled(fixedDelay = 500)
    public void tick() {
        sessions.forEach((machineId, session) -> {
            if (!session.isOpen()) {
                sessions.remove(machineId);
                return;
            }
            try {
                MachineStreamState st = feedService.getOrCreateState(machineId);

                if (!st.isRunning() || st.getAllRows().isEmpty()) return;

                int cursor = st.getCursor();
                int total  = st.getAllRows().size();

                if (cursor >= total) {
                    // Feed finished
                    Map<String, Object> payload = new LinkedHashMap<>();
                    payload.put("finished",       true);
                    payload.put("cursor",         cursor);
                    payload.put("total",          total);
                    payload.put("drift_detected", st.isDriftDetected());
                    payload.put("alert",          st.getAlert());
                    sendJson(session, payload);
                    st.setRunning(false);
                    return;
                }

                // Advance cursor
                Map<String, Object> currentRow = st.getAllRows().get(cursor);
                st.getSentRows().add(currentRow);
                st.setCursor(cursor + CHUNK_SIZE);

                // Agent 2: CUSUM detection
                Map<String, Object> detectionStats = feedService.detectDrift(st.getSentRows());

                // Trigger AI pipeline if drift detected for the first time
                boolean newDrift = (Boolean) detectionStats.getOrDefault("drift_detected", false);
                if (newDrift && !st.isDriftDetected() && !st.isAgentRunning()) {
                    st.setDriftDetected(true);
                    st.setAgentRunning(true);
                    System.out.println("[ALERT] DRIFT DETECTED at row " + cursor + " for " + machineId);

                    // Capture last 15 drifting rows for the agent
                    List<Map<String, Object>> driftingRows = new ArrayList<>(
                            st.getSentRows().subList(
                                    Math.max(0, st.getSentRows().size() - 15),
                                    st.getSentRows().size()
                            )
                    );
                    Map<String, Object> capturedStats = new LinkedHashMap<>(detectionStats);

                    // Run agent pipeline asynchronously — doesn't block the 2Hz loop
                    // Mirrors Python's asyncio.create_task(run_agent_pipeline(...))
                    new Thread(() -> {
                        try {
                            System.out.println("[GeminiAgent] Starting root-cause analysis for " + machineId);
                            AlertResponse diagnosis = geminiAgentService.runRootCauseAnalysis(
                                    driftingRows, capturedStats);

                            // Convert AlertResponse to alert map for WebSocket payload
                            Map<String, Object> alert = new LinkedHashMap<>();
                            alert.put("title",      diagnosis.title());
                            alert.put("eta_days",   diagnosis.etaDays());
                            alert.put("action",     diagnosis.action());
                            alert.put("severity",   diagnosis.severity());
                            alert.put("confidence", diagnosis.confidence());

                            st.setAlert(alert);
                            st.setDiagnosisRaw(diagnosis.diagnosisRaw());
                            st.setAgentRunning(false);

                            // Push alert instantly when Gemini finishes
                            // Mirrors Python: await websocket.send_json({"type": "agent_update", ...})
                            Map<String, Object> agentPayload = new LinkedHashMap<>();
                            agentPayload.put("type",          "agent_update");
                            agentPayload.put("alert",         alert);
                            agentPayload.put("diagnosis_raw", diagnosis.diagnosisRaw());
                            sendJson(session, agentPayload);

                            System.out.println("[GeminiAgent] Pushed agent_update for " + machineId);
                        } catch (Exception e) {
                            st.setAgentRunning(false);
                            System.err.println("[ERROR] Gemini agent pipeline failed: " + e.getMessage());
                        }
                    }).start();
                }

                // Send normal row tick
                Map<String, Object> payload = new LinkedHashMap<>();
                payload.put("type",            "row_data");
                payload.put("row",             currentRow);
                payload.put("cursor",          st.getCursor());
                payload.put("total",           total);
                payload.put("finished",        false);
                payload.put("drift_detected",  st.isDriftDetected());
                payload.put("detection_stats", detectionStats);
                payload.put("alert",           st.getAlert());
                payload.put("diagnosis_raw",   st.getDiagnosisRaw());
                sendJson(session, payload);

            } catch (Exception e) {
                System.err.println("[WS ERROR] " + machineId + ": " + e.getMessage());
            }
        });
    }

    private void sendJson(WebSocketSession session, Object payload) {
        try {
            if (session.isOpen()) {
                session.sendMessage(new TextMessage(mapper.writeValueAsString(payload)));
            }
        } catch (Exception e) {
            System.err.println("[WS] Send error: " + e.getMessage());
        }
    }

    // Extracts machine_id from path: /ws/feed/MCH-01 → MCH-01
    private String extractMachineId(WebSocketSession session) {
        String path = Objects.requireNonNull(session.getUri()).getPath();
        String[] parts = path.split("/");
        return parts[parts.length - 1];
    }
}
