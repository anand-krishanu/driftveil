package com.server.driftveil.service;

import com.server.driftveil.entity.Machine;
import com.server.driftveil.entity.SensorReading;
import com.server.driftveil.repository.MachineRepository;
import com.server.driftveil.repository.SensorReadingRepository;
import com.server.driftveil.dto.MachineAutoCreateRequest;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Ports Python's machine profile logic, _generate_stream_rows(), and machine CRUD.
 */
@Service
public class MachineService {

    private final MachineRepository machineRepo;
    private final SensorReadingRepository sensorRepo;

    // ── Machine Profiles (mirrors MACHINE_PROFILES in Python main.py) ───────
    public static final Map<String, Map<String, Object>> MACHINE_PROFILES = Map.of(
        "CENTRIFUGAL_PUMP", Map.of(
            "label", "Centrifugal Pump", "default_name", "Centrifugal Pump",
            "baseline", Map.of("temperature", 58.0, "vibration", 0.22, "rpm", 1780),
            "noise",    Map.of("temperature", 0.9,  "vibration", 0.012, "rpm", 30)
        ),
        "ROTARY_COMPRESSOR", Map.of(
            "label", "Rotary Compressor", "default_name", "Rotary Compressor",
            "baseline", Map.of("temperature", 68.0, "vibration", 0.28, "rpm", 3250),
            "noise",    Map.of("temperature", 1.1,  "vibration", 0.015, "rpm", 45)
        ),
        "CONVEYOR_GEARBOX", Map.of(
            "label", "Conveyor Gearbox", "default_name", "Conveyor Gearbox",
            "baseline", Map.of("temperature", 52.0, "vibration", 0.25, "rpm", 1200),
            "noise",    Map.of("temperature", 0.8,  "vibration", 0.010, "rpm", 20)
        ),
        "INDUSTRIAL_FAN", Map.of(
            "label", "Industrial Fan", "default_name", "Industrial Fan",
            "baseline", Map.of("temperature", 49.0, "vibration", 0.20, "rpm", 1950),
            "noise",    Map.of("temperature", 0.7,  "vibration", 0.009, "rpm", 25)
        ),
        "CNC_SPINDLE", Map.of(
            "label", "CNC Spindle", "default_name", "CNC Spindle",
            "baseline", Map.of("temperature", 45.0, "vibration", 0.12, "rpm", 6200),
            "noise",    Map.of("temperature", 0.6,  "vibration", 0.007, "rpm", 80)
        )
    );

    public static final Map<String, Map<String, Object>> SCENARIO_SETTINGS = Map.of(
        "NORMAL", Map.of("temp_rise", 2.5,  "vib_rise", 0.08, "health", 100),
        "WARN",   Map.of("temp_rise", 8.0,  "vib_rise", 0.24, "health", 90),
        "DRIFT",  Map.of("temp_rise", 18.0, "vib_rise", 0.50, "health", 80)
    );

    public MachineService(MachineRepository machineRepo, SensorReadingRepository sensorRepo) {
        this.machineRepo = machineRepo;
        this.sensorRepo = sensorRepo;
    }

    /** Returns all machines with latest sensor reading attached. */
    public List<Map<String, Object>> getAllMachinesWithStatus() {
        return machineRepo.findAll().stream().map(m -> {
            List<SensorReading> readings = sensorRepo.findByMachineIdOrderByTimeAsc(m.getId());
            SensorReading latest = readings.isEmpty() ? null : readings.get(readings.size() - 1);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", m.getId());
            row.put("name", m.getName());
            row.put("line", m.getLine());
            row.put("location", m.getLocation());
            row.put("status", m.getStatus());
            row.put("base_health", m.getBaseHealth());
            row.put("temp", latest != null ? latest.getTemperature() : null);
            row.put("vib",  latest != null ? latest.getVibration()   : null);
            row.put("last_timestamp", latest != null ? latest.getTime().toString() : null);
            return row;
        }).collect(Collectors.toList());
    }

    /** Returns a paginated list of sensor readings for a machine. */
    public List<Map<String, Object>> getSensorHistory(String machineId, int start, int limit) {
        List<SensorReading> all = sensorRepo.findByMachineIdOrderByTimeAsc(machineId);
        int end = Math.min(start + limit, all.size());
        if (start >= all.size()) return List.of();
        return all.subList(start, end).stream().map(r -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("timestamp", r.getTime().toString());
            row.put("temperature", r.getTemperature());
            row.put("vibration",   r.getVibration());
            row.put("rpm",         r.getRpm());
            return row;
        }).collect(Collectors.toList());
    }

    /** Returns all 200 rows for a machine as maps (for the feed state). */
    public List<Map<String, Object>> loadAllRows(String machineId) {
        return sensorRepo.findTop200ByMachineIdOrderByTimeAsc(machineId).stream().map(r -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("time",        r.getTime().toString());
            row.put("temperature", r.getTemperature());
            row.put("vibration",   r.getVibration());
            row.put("rpm",         r.getRpm());
            return row;
        }).collect(Collectors.toList());
    }

    /** Generates next machine ID — mirrors Python's _next_machine_id(). */
    public String nextMachineId() {
        List<Machine> all = machineRepo.findAll();
        int max = 0;
        for (Machine m : all) {
            if (m.getId().matches("MCH-\\d+")) {
                int num = Integer.parseInt(m.getId().substring(4));
                if (num > max) max = num;
            }
        }
        return String.format("MCH-%02d", max + 1);
    }

    /**
     * Creates a machine + generates + persists sensor readings.
     * Mirrors Python's create_machine_auto endpoint logic.
     */
    public Map<String, Object> createMachineAuto(MachineAutoCreateRequest req) {
        String typeKey     = req.getMachine_type().toUpperCase();
        String scenarioKey = req.getScenario().toUpperCase();

        if (!MACHINE_PROFILES.containsKey(typeKey))
            throw new IllegalArgumentException("Unknown machine_type: " + typeKey);
        if (!SCENARIO_SETTINGS.containsKey(scenarioKey))
            throw new IllegalArgumentException("Unknown scenario: " + scenarioKey);

        String machineId = (req.getMachine_id() != null && !req.getMachine_id().isBlank())
                ? req.getMachine_id().strip() : nextMachineId();

        if (machineRepo.existsById(machineId))
            throw new IllegalStateException("Machine id already exists: " + machineId);

        @SuppressWarnings("unchecked")
        Map<String, Object> profile  = MACHINE_PROFILES.get(typeKey);
        Map<String, Object> scenario = SCENARIO_SETTINGS.get(scenarioKey);
        String machineName = (req.getName() != null && !req.getName().isBlank())
                ? req.getName().strip() : profile.get("default_name") + " " + machineId;

        Machine machine = new Machine();
        machine.setId(machineId);
        machine.setName(machineName);
        machine.setLine(req.getLine() != null ? req.getLine() : "Line 1");
        machine.setLocation(req.getLocation() != null ? req.getLocation() : "Bay A-1");
        machine.setBaseHealth((int) scenario.get("health"));
        machine.setStatus("NORMAL".equals(scenarioKey) ? "NORMAL" : "WARN");
        machineRepo.save(machine);

        // Generate and persist rows
        List<SensorReading> readings = generateStreamRows(typeKey, scenarioKey, req.getPoints(), machineId);
        sensorRepo.saveAll(readings);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "created");
        result.put("machine_id", machineId);
        result.put("name", machineName);
        result.put("machine_type", typeKey);
        result.put("scenario", scenarioKey);
        return result;
    }

    /**
     * Ports Python's _generate_stream_rows() exactly.
     * Uses the same ramp/noise math to produce identical sensor data.
     */
    public List<SensorReading> generateStreamRows(String machineType, String scenario, int points, String machineId) {
        @SuppressWarnings("unchecked")
        Map<String, Object> profile      = MACHINE_PROFILES.get(machineType);
        Map<String, Object> scenarioCfg  = SCENARIO_SETTINGS.get(scenario);
        @SuppressWarnings("unchecked")
        Map<String, Object> baseline     = (Map<String, Object>) profile.get("baseline");
        @SuppressWarnings("unchecked")
        Map<String, Object> noise        = (Map<String, Object>) profile.get("noise");

        double baseTemp = ((Number) baseline.get("temperature")).doubleValue();
        double baseVib  = ((Number) baseline.get("vibration")).doubleValue();
        int    baseRpm  = ((Number) baseline.get("rpm")).intValue();
        double noiseTemp= ((Number) noise.get("temperature")).doubleValue();
        double noiseVib = ((Number) noise.get("vibration")).doubleValue();
        int    noiseRpm = ((Number) noise.get("rpm")).intValue();
        double tempRise = ((Number) scenarioCfg.get("temp_rise")).doubleValue();
        double vibRise  = ((Number) scenarioCfg.get("vib_rise")).doubleValue();

        Random rng = new Random();
        LocalDateTime startTime = LocalDateTime.now().minusSeconds((long) points * 5);
        List<SensorReading> rows = new ArrayList<>();

        for (int i = 0; i < points; i++) {
            double progress = (double) i / Math.max(points - 1, 1);
            double ramp = "DRIFT".equals(scenario)
                    ? Math.max(0.0, (i - points * 0.5) / Math.max(points * 0.5, 1))
                    : progress;

            double temp = baseTemp + tempRise * ramp + (rng.nextDouble() * 2 - 1) * noiseTemp;
            double vib  = baseVib  + vibRise  * ramp + (rng.nextDouble() * 2 - 1) * noiseVib;
            int    rpm  = baseRpm  + (int)((rng.nextDouble() * 2 - 1) * noiseRpm);

            SensorReading r = new SensorReading();
            r.setId(UUID.randomUUID().toString());
            r.setMachineId(machineId);
            r.setTime(startTime.plusSeconds((long) i * 5));
            r.setTemperature(Math.max(0, Math.round(temp * 100.0) / 100.0));
            r.setVibration(Math.max(0, Math.round(vib * 10000.0) / 10000.0));
            r.setRpm(Math.max(0, rpm));
            rows.add(r);
        }
        return rows;
    }
}
