package com.hcerp.erp.employee;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.GenderType;
import com.hcerp.erp.common.Enums.MarriedStatus;

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
    public String fullName;
    @Enumerated(EnumType.STRING)
    public GenderType gender;
    public LocalDate dateOfBirth;
    @Enumerated(EnumType.STRING)
    public MarriedStatus marriedStatus = MarriedStatus.SINGLE;
    public String addressProvince;
    public String addressCity;
    public String addressDistrict;
    public String address;
    public String phone;
    public String photo;
    public UUID departmentId;
    public UUID managerId;
    public String jobTitle;
    public LocalDate hireDate;
    public LocalDate terminationDate;
    @Enumerated(EnumType.STRING)
    public EmployeeStatus status = EmployeeStatus.ACTIVE;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (marriedStatus == null) marriedStatus = MarriedStatus.SINGLE;
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        if (marriedStatus == null) marriedStatus = MarriedStatus.SINGLE;
        updatedAt = OffsetDateTime.now();
    }
}
