package com.hcerp.erp.notification;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "notifications")
public class AppNotification {
    @Id
    public UUID id;
    public UUID accountId;
    public String title;
    public String content;
    public String type;
    @Column(name = "is_read")
    public boolean read;
    public OffsetDateTime readAt;
    public OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
