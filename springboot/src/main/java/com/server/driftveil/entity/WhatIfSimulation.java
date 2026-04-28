package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model WhatIfSimulation → PostgreSQL table "WhatIfSimulation"
 */
@Data
@Entity
@Table(name = "WhatIfSimulation")
public class WhatIfSimulation {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "machineId", nullable = false)
    private String machineId;

    @Column(name = "sessionId")
    private String sessionId;

    @Column(name = "userQuestion", columnDefinition = "TEXT", nullable = false)
    private String userQuestion;

    @Column(name = "scenarioJson", columnDefinition = "TEXT", nullable = false)
    private String scenarioJson;

    @Column(name = "resultJson", columnDefinition = "TEXT", nullable = false)
    private String resultJson;

    @Column(name = "riskLevel", nullable = false)
    private String riskLevel;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
