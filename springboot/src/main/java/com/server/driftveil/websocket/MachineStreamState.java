package com.server.driftveil.websocket;

import lombok.Data;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Per-machine in-memory state — mirrors Python's `states` dict in main.py.
 */
@Data
public class MachineStreamState {
    private int cursor = 0;
    private boolean running = false;
    private boolean driftDetected = false;
    private boolean agentRunning = false;
    private List<Map<String, Object>> allRows = new ArrayList<>();
    private List<Map<String, Object>> sentRows = new ArrayList<>();
    private Map<String, Object> alert = null;
    private String diagnosisRaw = null;

    public void reset() {
        cursor = 0;
        running = false;
        driftDetected = false;
        agentRunning = false;
        allRows = new ArrayList<>();
        sentRows = new ArrayList<>();
        alert = null;
        diagnosisRaw = null;
    }
}
