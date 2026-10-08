package com.hcerp.erp.preference;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "table_preferences")
public class TablePreference {
    @Id
    public UUID accountId;

    @Column(nullable = false)
    public String columnVisibility = "{}";

    @Column(nullable = false)
    public String columnOrder = "{}";

    public OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void updateTimestamp() {
        updatedAt = OffsetDateTime.now();
    }
}
