package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model SensorReading → PostgreSQL table "SensorReading"
 */
@Data
@Entity
@Table(name = "SensorReading")
public class SensorReading {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "time", nullable = false)
    private LocalDateTime time;

    @Column(name = "machineId", nullable = false)
    private String machineId;

    @Column(name = "temperature", nullable = false)
    private double temperature;

    @Column(name = "vibration", nullable = false)
    private double vibration;

    @Column(name = "rpm")
    private Integer rpm;

    @PrePersist
    public void prePersist() {
        if (time == null) time = LocalDateTime.now();
    }
}
