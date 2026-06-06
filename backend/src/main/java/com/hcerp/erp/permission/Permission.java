package com.hcerp.erp.permission;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.ModuleCode;
import com.hcerp.erp.common.Enums.PermissionCode;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "permissions")
public class Permission {
    @Id
    public UUID id;
    @Enumerated(EnumType.STRING)
    public PermissionCode code;
    public String name;
    public String description;
    @Enumerated(EnumType.STRING)
    public ModuleCode moduleCode;
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
