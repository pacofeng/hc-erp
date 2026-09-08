package com.hcerp.erp.department;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.DepartmentStatus;

import jakarta.persistence.Entity;
import jakarta.persistence.Convert;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "departments")
public class Department {
    @Id
    public UUID id;
    public String code;
    public String name;
    public UUID managerId;
    @Convert(converter = DepartmentStatusConverter.class)
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
