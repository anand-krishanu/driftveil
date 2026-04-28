package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model Machine → PostgreSQL table "Machine"
 * All column names match Prisma's camelCase field names exactly.
 */
@Data
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
}
