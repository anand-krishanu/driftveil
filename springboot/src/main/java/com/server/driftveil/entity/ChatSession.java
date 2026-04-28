package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model ChatSession → PostgreSQL table "ChatSession"
 */
@Data
@Entity
@Table(name = "ChatSession")
public class ChatSession {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "machineId", nullable = false)
    private String machineId;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
