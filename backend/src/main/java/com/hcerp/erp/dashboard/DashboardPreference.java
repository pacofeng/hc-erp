package com.hcerp.erp.dashboard;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "dashboard_preferences")
public class DashboardPreference {
    @Id
    public UUID accountId;
    @Column(nullable = false)
    public String panels = "[]";
    @Column(nullable = false)
    public String collapsedPanels = "[]";
    public OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        updatedAt = OffsetDateTime.now();
    }
}
