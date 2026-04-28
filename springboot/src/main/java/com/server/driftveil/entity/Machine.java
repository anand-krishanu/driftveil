package com.server.driftveil.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model Machine → PostgreSQL table "Machine"
 * All column names match Prisma's camelCase field names exactly.
 */
@Entity
@Table(name = "Machine")
public class Machine {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "line")
    private String line;

    @Column(name = "location")
    private String location;

    @Column(name = "baseHealth", nullable = false)
    private int baseHealth = 100;

    @Column(name = "status", nullable = false)
    private String status = "NORMAL";

    @Column(name = "installedAt")
    private LocalDateTime installedAt;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getLine() { return line; }
    public void setLine(String line) { this.line = line; }

    public String getLocation() { return location; }
    public void setLocation(String location) { this.location = location; }

    public int getBaseHealth() { return baseHealth; }
    public void setBaseHealth(int baseHealth) { this.baseHealth = baseHealth; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public LocalDateTime getInstalledAt() { return installedAt; }
    public void setInstalledAt(LocalDateTime installedAt) { this.installedAt = installedAt; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
