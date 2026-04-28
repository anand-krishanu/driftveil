package com.server.driftveil.service;

import com.server.driftveil.entity.FailureFingerprint;
import com.server.driftveil.entity.Machine;
import com.server.driftveil.entity.SensorReading;
import com.server.driftveil.repository.FailureFingerprintRepository;
import com.server.driftveil.repository.MachineRepository;
import com.server.driftveil.repository.SensorReadingRepository;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * In-process replacement for mcp_server.py (was running on port 8001).
 *
 * Instead of making HTTP calls to a separate Python server, these methods
 * are called directly in Java — zero network latency, zero extra process.
 *
 * Tools exposed (mirrors Python MCP tool definitions):
 *   - getSensorData(machineId, start, limit)  → /tools/get_sensor_data
 *   - getFingerprints()                       → /tools/get_fingerprints
 *   - getMachines()                           → /tools/get_machines
 */
@Service
public class McpToolService {

    private final SensorReadingRepository sensorRepo;
    private final FailureFingerprintRepository fingerprintRepo;
    private final MachineRepository machineRepo;

    public McpToolService(SensorReadingRepository sensorRepo,
                          FailureFingerprintRepository fingerprintRepo,
                          MachineRepository machineRepo) {
        this.sensorRepo      = sensorRepo;
        this.fingerprintRepo = fingerprintRepo;
        this.machineRepo     = machineRepo;
    }

    // ── Tool 1: get_sensor_data ───────────────────────────────────────────────

    /**
     * Mirrors Python mcp_server.py → GET /tools/get_sensor_data
     *
     * @param machineId  Machine identifier (e.g. MCH-03)
     * @param start      Row offset (-1 = latest `limit` rows, 0+ = from offset)
     * @param limit      Number of rows to return (max 200)
     * @return List of sensor row maps (timestamp, temperature, vibration)
     */
    public List<Map<String, Object>> getSensorData(String machineId, int start, int limit) {
        List<SensorReading> readings;

        if (start == -1) {
            // Latest `limit` rows, reversed to chronological order — mirrors Python logic
            readings = sensorRepo.findTopByMachineIdOrderByTimeDesc(machineId, limit);
            Collections.reverse(readings);
        } else {
            readings = sensorRepo.findByMachineIdOrderByTimeAsc(machineId);
            int end = Math.min(start + limit, readings.size());
            if (start >= readings.size()) return List.of();
            readings = readings.subList(start, end);
        }

        List<Map<String, Object>> rows = new ArrayList<>();
        for (int i = 0; i < readings.size(); i++) {
            SensorReading r = readings.get(i);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("row_index",   start == -1 ? -1 : start + i);
            row.put("timestamp",   r.getTime().toString());
            row.put("temperature", r.getTemperature());
            row.put("vibration",   r.getVibration());
            rows.add(row);
        }
        return rows;
    }

    // ── Tool 2: get_fingerprints ──────────────────────────────────────────────

    /**
     * Mirrors Python mcp_server.py → GET /tools/get_fingerprints
     *
     * @return List of failure fingerprint maps with pattern data and prescriptions
     */
    public List<Map<String, Object>> getFingerprints() {
        List<FailureFingerprint> fps = fingerprintRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (FailureFingerprint f : fps) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",                 f.getId());
            row.put("issue",              f.getIssueName());
            row.put("pattern",            f.getPatternData());
            row.put("severity",           f.getSeverity().toLowerCase());
            row.put("eta_days_range",     f.getEtaDays() != null
                    ? f.getEtaDays() + "-" + (f.getEtaDays() + 7)
                    : "Unknown");
            row.put("recommended_action", f.getActionPrescription());
            result.add(row);
        }
        return result;
    }

    // ── Tool 3: get_machines ──────────────────────────────────────────────────

    /**
     * Mirrors Python mcp_server.py → GET /tools/get_machines
     *
     * @return List of machine status maps with latest sensor readings
     */
    public List<Map<String, Object>> getMachines() {
        List<Machine> machines = machineRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Machine m : machines) {
            // Get the latest reading for this machine
            List<SensorReading> readings = sensorRepo.findByMachineIdOrderByTimeAsc(m.getId());
            SensorReading latest = readings.isEmpty() ? null : readings.get(readings.size() - 1);

            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id",             m.getId());
            row.put("name",           m.getName());
            row.put("line",           m.getLine());
            row.put("location",       m.getLocation());
            row.put("status",         m.getStatus());
            row.put("base_health",    m.getBaseHealth());
            row.put("temp",           latest != null ? latest.getTemperature() : null);
            row.put("vib",            latest != null ? latest.getVibration()   : null);
            row.put("last_timestamp", latest != null ? latest.getTime().toString() : null);
            result.add(row);
        }
        return result;
    }
}
