package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model Alert → PostgreSQL table "Alert"
 */
@Data
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
}
