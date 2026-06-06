package com.hcerp.erp.department;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.DepartmentCode;
import com.hcerp.erp.common.Enums.DepartmentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "departments")
public class Department {
    @Id
    public UUID id;
    @Enumerated(EnumType.STRING)
    public DepartmentCode code;
    public String name;
    public UUID managerId;
    @Enumerated(EnumType.STRING)
    public DepartmentStatus status = DepartmentStatus.ACTIVE;
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
