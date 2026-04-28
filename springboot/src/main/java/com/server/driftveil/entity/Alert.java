package com.server.driftveil.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model Alert → PostgreSQL table "Alert"
 */
@Entity
@Table(name = "Alert")
public class Alert {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "machineId", nullable = false)
    private String machineId;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "severity", nullable = false)
    private String severity;

    @Column(name = "confidence")
    private Integer confidence;

    @Column(name = "etaDays")
    private Integer etaDays;

    @Column(name = "action")
    private String action;

    @Column(name = "rawDiagnosis", columnDefinition = "TEXT")
    private String rawDiagnosis;

    @Column(name = "cusumScore")
    private Double cusumScore;

    @Column(name = "resolved", nullable = false)
    private boolean resolved = false;

    @PrePersist
    public void prePersist() {
        if (timestamp == null) timestamp = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getMachineId() { return machineId; }
    public void setMachineId(String machineId) { this.machineId = machineId; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public Integer getConfidence() { return confidence; }
    public void setConfidence(Integer confidence) { this.confidence = confidence; }

    public Integer getEtaDays() { return etaDays; }
    public void setEtaDays(Integer etaDays) { this.etaDays = etaDays; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getRawDiagnosis() { return rawDiagnosis; }
    public void setRawDiagnosis(String rawDiagnosis) { this.rawDiagnosis = rawDiagnosis; }

    public Double getCusumScore() { return cusumScore; }
    public void setCusumScore(Double cusumScore) { this.cusumScore = cusumScore; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
}
