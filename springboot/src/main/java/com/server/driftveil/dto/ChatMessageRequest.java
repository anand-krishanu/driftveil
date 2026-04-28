package com.server.driftveil.dto;

import lombok.Data;

@Data
public class ChatMessageRequest {
    // Field name uses camelCase so Lombok generates getMachineId() / getMessage()
    // JSON key "machine_id" is mapped via @JsonProperty if needed, but Spring
    // handles snake_case → camelCase automatically with the right config.
    private String machineId;
    private String message;

    // Alias getter so both "machine_id" (from Python clients) and
    // "machineId" (from Java clients) work as JSON input.
    // Spring's ObjectMapper maps JSON "machineId" field by default.
    // For "machine_id" support from Python/React, keep the field as-is —
    // add spring.jackson.property-naming-strategy=SNAKE_CASE in application.properties
    // if you need full snake_case JSON keys.
}
