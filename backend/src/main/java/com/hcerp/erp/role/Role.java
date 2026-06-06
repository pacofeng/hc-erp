package com.hcerp.erp.role;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.RoleCode;
import com.hcerp.erp.common.Enums.RoleStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "roles")
public class Role {
    @Id
    public UUID id;
    public String name;
    @Enumerated(EnumType.STRING)
    public RoleCode code;
    @Enumerated(EnumType.STRING)
    public RoleStatus status = RoleStatus.ACTIVE;
    public String description;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
