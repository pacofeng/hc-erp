package com.hcerp.erp.order;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    public UUID id;
    public String customerName;
    public String contractNumber;
    public String machineModels;
    public String machineModelConfigurations;
    public String machineConfiguration;
    public String voltage;
    public String xyMotor;
    public String zMotor;
    public String packaging;
    public String nameplate;
    public String systemHeading;
    public String systemLanguage;
    public String deliveryMethod;
    public Boolean customized;
    public String customRequirements;
    public String equipment;
    public Boolean photoBeforePacking;
    public String beamStyle;
    public String manualLanguage;
    public String remarks;
    public LocalDate expectedDate;
    public LocalDate completedDate;
    public String preparedBy;
    public String reviewedBy;
    public LocalDate orderDate;
    public String status;
    public String createdBy;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        createdAt = OffsetDateTime.now();
        updatedAt = createdAt;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
