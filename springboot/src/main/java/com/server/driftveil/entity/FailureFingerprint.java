package com.server.driftveil.entity;

import jakarta.persistence.*;

/**
 * Maps to Prisma model FailureFingerprint → PostgreSQL table "FailureFingerprint"
 */
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getIssueName() { return issueName; }
    public void setIssueName(String issueName) { this.issueName = issueName; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getPatternData() { return patternData; }
    public void setPatternData(String patternData) { this.patternData = patternData; }

    public Integer getEtaDays() { return etaDays; }
    public void setEtaDays(Integer etaDays) { this.etaDays = etaDays; }

    public String getActionPrescription() { return actionPrescription; }
    public void setActionPrescription(String actionPrescription) { this.actionPrescription = actionPrescription; }
}
