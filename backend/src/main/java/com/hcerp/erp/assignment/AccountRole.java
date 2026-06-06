package com.hcerp.erp.assignment;

import java.time.OffsetDateTime;
import java.util.UUID;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "account_roles")
public class AccountRole {
    @Id
    public UUID id;
    public UUID accountId;
    public UUID roleId;
    public OffsetDateTime createdAt;
    public UUID createdBy;

    @PrePersist
    void onCreate() {
        if (id == null) id = UUID.randomUUID();
        if (createdAt == null) createdAt = OffsetDateTime.now();
    }
}
