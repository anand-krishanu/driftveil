package com.server.driftveil.controller;

import com.server.driftveil.dto.MachineAutoCreateRequest;
import com.server.driftveil.repository.MachineRepository;
import com.server.driftveil.repository.SensorReadingRepository;
import com.server.driftveil.service.MachineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Ports all machine-related REST endpoints from Python main.py:
 *   GET  /api/machines
 *   GET  /api/machine-types
 *   GET  /api/machine-types/{type}/preview
 *   POST /api/machines/auto
 *   GET  /api/machines/{machine_id}/history
 */
@RestController
@RequestMapping("/api")
public class MachineController {

    private final MachineService machineService;
    private final MachineRepository machineRepo;
    private final SensorReadingRepository sensorRepo;

    public MachineController(MachineService machineService,
                              MachineRepository machineRepo,
                              SensorReadingRepository sensorRepo) {
        this.machineService = machineService;
        this.machineRepo    = machineRepo;
        this.sensorRepo     = sensorRepo;
    }

    /** GET /api/machines — mirrors Python get_machines() */
    @GetMapping("/machines")
    public ResponseEntity<Map<String, Object>> getMachines() {
        List<Map<String, Object>> machines = machineService.getAllMachinesWithStatus();
        return ResponseEntity.ok(Map.of("count", machines.size(), "machines", machines));
    }

    /** GET /api/machine-types — mirrors Python get_machine_types() */
    @GetMapping("/machine-types")
    public ResponseEntity<Map<String, Object>> getMachineTypes() {
        List<Map<String, Object>> types = new ArrayList<>();
        MachineService.MACHINE_PROFILES.forEach((key, profile) -> {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("machine_type", key);
            entry.put("label",        profile.get("label"));
            entry.put("default_name", profile.get("default_name"));
            entry.put("sensor_fields", List.of("temperature", "vibration", "rpm"));
            entry.put("baseline",     profile.get("baseline"));
            entry.put("default_stream", Map.of("points", 200, "interval_seconds", 5, "scenario", "NORMAL"));
            types.add(entry);
        });
        return ResponseEntity.ok(Map.of("count", types.size(), "types", types));
    }

    /** GET /api/machine-types/{type}/preview — mirrors Python get_machine_type_preview() */
    @GetMapping("/machine-types/{machineType}/preview")
    public ResponseEntity<?> getMachineTypePreview(
            @PathVariable String machineType,
            @RequestParam(defaultValue = "NORMAL") String scenario,
            @RequestParam(defaultValue = "60") int points) {

        String typeKey     = machineType.toUpperCase();
        String scenarioKey = scenario.toUpperCase();

        if (!MachineService.MACHINE_PROFILES.containsKey(typeKey))
            return ResponseEntity.notFound().build();
        if (!MachineService.SCENARIO_SETTINGS.containsKey(scenarioKey))
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid scenario: " + scenario));

        // Generate preview rows (not persisted)
        var rows = machineService.generateStreamRows(typeKey, scenarioKey, Math.min(points, 400), "PREVIEW");
        List<Map<String, Object>> sample = new ArrayList<>();
        for (int i = 0; i < Math.min(8, rows.size()); i++) {
            var r = rows.get(i);
            sample.add(Map.of(
                "time", r.getTime().toString(),
                "temperature", r.getTemperature(),
                "vibration", r.getVibration(),
                "rpm", r.getRpm()
            ));
        }

        return ResponseEntity.ok(Map.of(
            "machine_type", typeKey,
            "scenario",     scenarioKey,
            "points",       points,
            "sensor_fields", List.of("temperature", "vibration", "rpm"),
            "baseline",     MachineService.MACHINE_PROFILES.get(typeKey).get("baseline"),
            "sample",       sample
        ));
    }

    /** POST /api/machines/auto — mirrors Python create_machine_auto() */
    @PostMapping("/machines/auto")
    public ResponseEntity<?> createMachineAuto(@RequestBody MachineAutoCreateRequest req) {
        try {
            Map<String, Object> result = machineService.createMachineAuto(req);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    /** GET /api/machines/{machine_id}/history — mirrors Python get_machine_history() */
    @GetMapping("/machines/{machineId}/history")
    public ResponseEntity<Map<String, Object>> getMachineHistory(
            @PathVariable String machineId,
            @RequestParam(defaultValue = "0") int start,
            @RequestParam(defaultValue = "200") int limit) {

        if (!machineRepo.existsById(machineId))
            return ResponseEntity.notFound().build();

        List<Map<String, Object>> data = machineService.getSensorHistory(machineId, start, limit);
        return ResponseEntity.ok(Map.of(
            "machine_id", machineId,
            "start",      start,
            "limit",      limit,
            "count",      data.size(),
            "data",       data
        ));
    }
}
