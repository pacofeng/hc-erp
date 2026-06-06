package com.hcerp.erp.account;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.common.Enums.AccountType;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "accounts")
public class Account {
    @Id
    public UUID id;
    public UUID employeeId;
    public String username;
    public String passwordHash;
    @Enumerated(EnumType.STRING)
    public AccountStatus status = AccountStatus.ACTIVE;
    @Enumerated(EnumType.STRING)
    public AccountType accountType = AccountType.USER;
    public Integer failedLoginCount = 0;
    public Boolean mustChangePassword = false;
    public OffsetDateTime passwordChangedAt;
    public OffsetDateTime lastLoginAt;
    public String lastLoginIp;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;
    public OffsetDateTime deletedAt;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
