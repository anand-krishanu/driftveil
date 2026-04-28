package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;

/**
 * Maps to Prisma model FailureFingerprint → PostgreSQL table "FailureFingerprint"
 */
@Data
@Entity
@Table(name = "FailureFingerprint")
public class FailureFingerprint {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "issueName", nullable = false)
    private String issueName;

    @Column(name = "severity", nullable = false)
    private String severity;

    @Column(name = "patternData", columnDefinition = "TEXT", nullable = false)
    private String patternData;

    @Column(name = "etaDays")
    private Integer etaDays;

    @Column(name = "actionPrescription", columnDefinition = "TEXT")
    private String actionPrescription;
}
