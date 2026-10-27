package com.hcerp.erp.position;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.DepartmentStatus;
import com.hcerp.erp.department.DepartmentStatusConverter;

import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "positions")
public class Position {
    @Id
    public UUID id;
    public String name;
    public String description;
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
