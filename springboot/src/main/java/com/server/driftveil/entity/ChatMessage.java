package com.server.driftveil.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

/**
 * Maps to Prisma model ChatMessage → PostgreSQL table "ChatMessage"
 */
@Data
@Entity
@Table(name = "ChatMessage")
public class ChatMessage {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "sessionId", nullable = false)
    private String sessionId;

    @Column(name = "role", nullable = false)
    private String role;

    @Column(name = "content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Column(name = "createdAt", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "simulationId")
    private String simulationId;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
