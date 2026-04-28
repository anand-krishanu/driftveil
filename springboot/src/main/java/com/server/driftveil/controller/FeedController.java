package com.server.driftveil.controller;

import com.server.driftveil.service.FeedService;
import com.server.driftveil.service.MachineService;
import com.server.driftveil.websocket.MachineStreamState;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Ports feed-related REST endpoints from Python main.py:
 *   POST /api/start-feed
 *   POST /api/reset
 *   GET  /health
 */
@RestController
public class FeedController {

    private final FeedService feedService;
    private final MachineService machineService;

    public FeedController(FeedService feedService, MachineService machineService) {
        this.feedService    = feedService;
        this.machineService = machineService;
    }

    /**
     * POST /api/start-feed?machine_id=MCH-01
     * Resets state and loads all sensor rows into memory.
     * Mirrors Python's start_feed() endpoint.
     */
    @PostMapping("/api/start-feed")
    public ResponseEntity<Map<String, Object>> startFeed(@RequestParam String machine_id) {
        MachineStreamState st = feedService.getOrCreateState(machine_id);
        st.reset();
        st.setRunning(true);

        // Load rows from DB into memory (mirrors Python's load_all_rows_from_mcp)
        st.setAllRows(machineService.loadAllRows(machine_id));
        System.out.println("[Feed] Started — " + st.getAllRows().size() + " rows loaded for " + machine_id);

        return ResponseEntity.ok(Map.of(
            "status",     "started",
            "machine_id", machine_id,
            "total_rows", st.getAllRows().size()
        ));
    }

    /**
     * POST /api/reset
     * Clears all in-memory states. Mirrors Python's reset() endpoint.
     */
    @PostMapping("/api/reset")
    public ResponseEntity<Map<String, String>> reset() {
        feedService.resetAll();
        return ResponseEntity.ok(Map.of("status", "reset complete"));
    }

    /**
     * GET /health
     * Health check. Mirrors Python's health() endpoint.
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health(
            @RequestParam(defaultValue = "MCH-03") String machine_id) {
        MachineStreamState st = feedService.getOrCreateState(machine_id);
        return ResponseEntity.ok(Map.of(
            "status",  "ok",
            "server",  "DriftVeil Spring Boot Backend",
            "running", st.isRunning(),
            "cursor",  st.getCursor()
        ));
    }
}
