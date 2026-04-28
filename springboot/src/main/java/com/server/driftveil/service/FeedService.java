package com.server.driftveil.service;

import com.server.driftveil.websocket.MachineStreamState;
import org.apache.commons.math3.stat.regression.SimpleRegression;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.LinkedHashMap;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Ports Python's agent_detection() using Apache Commons Math.
 * Maintains per-machine in-memory state (mirrors Python's `states` dict).
 */
@Service
public class FeedService {

    private static final int    DRIFT_WINDOW          = 15;
    private static final double DRIFT_SLOPE_THRESHOLD = 0.15;
    private static final double BASELINE_MEAN         = 60.5;

    // Shared in-memory state per machine — thread-safe
    private final ConcurrentHashMap<String, MachineStreamState> states = new ConcurrentHashMap<>();

    public MachineStreamState getOrCreateState(String machineId) {
        return states.computeIfAbsent(machineId, id -> new MachineStreamState());
    }

    public void resetAll() {
        states.clear();
    }

    /**
     * Ports Python's agent_detection() exactly.
     * Uses Commons Math SimpleRegression for slope (replaces np.polyfit).
     */
    public Map<String, Object> detectDrift(List<Map<String, Object>> rows) {
        Map<String, Object> result = new LinkedHashMap<>();

        if (rows.size() < DRIFT_WINDOW) {
            result.put("drift_detected", false);
            result.put("reason", "Not enough data yet");
            return result;
        }

        List<Map<String, Object>> window = rows.subList(rows.size() - DRIFT_WINDOW, rows.size());

        // Extract temp and vib arrays
        double[] temps = new double[DRIFT_WINDOW];
        double[] vibs  = new double[DRIFT_WINDOW];
        for (int i = 0; i < DRIFT_WINDOW; i++) {
            temps[i] = toDouble(window.get(i).get("temperature"));
            vibs[i]  = toDouble(window.get(i).get("vibration"));
        }

        // Linear regression slopes — replaces np.polyfit(x, y, 1)[0]
        SimpleRegression tempReg = new SimpleRegression();
        SimpleRegression vibReg  = new SimpleRegression();
        for (int i = 0; i < DRIFT_WINDOW; i++) {
            tempReg.addData(i, temps[i]);
            vibReg.addData(i,  vibs[i]);
        }
        double slopeTemp = tempReg.getSlope();
        double slopeVib  = vibReg.getSlope();

        // Moving average — replaces np.mean()
        double movingAvgTemp = 0;
        for (double t : temps) movingAvgTemp += t;
        movingAvgTemp /= temps.length;

        // CUSUM — replaces np.sum(array - baseline_mean)
        double cusum = 0;
        for (double t : temps) cusum += (t - BASELINE_MEAN);

        // Drift decision — same logic as Python
        boolean driftFlagged = (slopeTemp > DRIFT_SLOPE_THRESHOLD) && (slopeVib > 0.005);

        result.put("drift_detected",   driftFlagged);
        result.put("slope_temp",       round4(slopeTemp));
        result.put("slope_vib",        round6(slopeVib));
        result.put("moving_avg_temp",  round2(movingAvgTemp));
        result.put("cusum_score",      round2(cusum));
        result.put("window_size",      DRIFT_WINDOW);
        return result;
    }

    private double toDouble(Object val) {
        if (val instanceof Number) return ((Number) val).doubleValue();
        return Double.parseDouble(val.toString());
    }

    private double round2(double v) { return Math.round(v * 100.0) / 100.0; }
    private double round4(double v) { return Math.round(v * 10000.0) / 10000.0; }
    private double round6(double v) { return Math.round(v * 1000000.0) / 1000000.0; }
}
