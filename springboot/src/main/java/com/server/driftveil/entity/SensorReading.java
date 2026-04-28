package com.server.driftveil.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model SensorReading → PostgreSQL table "SensorReading"
 */
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

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public LocalDateTime getTime() { return time; }
    public void setTime(LocalDateTime time) { this.time = time; }

    public String getMachineId() { return machineId; }
    public void setMachineId(String machineId) { this.machineId = machineId; }

    public double getTemperature() { return temperature; }
    public void setTemperature(double temperature) { this.temperature = temperature; }

    public double getVibration() { return vibration; }
    public void setVibration(double vibration) { this.vibration = vibration; }

    public Integer getRpm() { return rpm; }
    public void setRpm(Integer rpm) { this.rpm = rpm; }
}
