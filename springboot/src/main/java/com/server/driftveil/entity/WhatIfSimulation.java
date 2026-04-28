package com.server.driftveil.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model WhatIfSimulation → PostgreSQL table "WhatIfSimulation"
 */
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMachineId() { return machineId; }
    public void setMachineId(String machineId) { this.machineId = machineId; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getUserQuestion() { return userQuestion; }
    public void setUserQuestion(String userQuestion) { this.userQuestion = userQuestion; }

    public String getScenarioJson() { return scenarioJson; }
    public void setScenarioJson(String scenarioJson) { this.scenarioJson = scenarioJson; }

    public String getResultJson() { return resultJson; }
    public void setResultJson(String resultJson) { this.resultJson = resultJson; }

    public String getRiskLevel() { return riskLevel; }
    public void setRiskLevel(String riskLevel) { this.riskLevel = riskLevel; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
