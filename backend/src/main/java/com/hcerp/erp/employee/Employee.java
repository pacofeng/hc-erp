package com.hcerp.erp.employee;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.GenderType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "employees")
public class Employee {
    @Id
    public UUID id;
    public String employeeNo;
    public String firstName;
    public String lastName;
    @Enumerated(EnumType.STRING)
    public GenderType gender;
    public String displayName;
    public String phone;
    public UUID departmentId;
    public UUID managerId;
    public String jobTitle;
    public LocalDate hireDate;
    public LocalDate terminationDate;
    @Enumerated(EnumType.STRING)
    public EmployeeStatus status = EmployeeStatus.ACTIVE;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
    public OffsetDateTime deletedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (displayName == null || displayName.isBlank()) displayName = firstName + " " + lastName;
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        if (displayName == null || displayName.isBlank()) displayName = firstName + " " + lastName;
        updatedAt = OffsetDateTime.now();
    }
}
