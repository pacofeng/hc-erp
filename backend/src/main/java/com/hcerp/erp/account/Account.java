package com.hcerp.erp.account;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.common.Enums.AccountType;

import jakarta.persistence.Column;
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
    public String preferredLanguage = "zh-CN";
    public String avatar;
    public Boolean securityQuestionsConfigured = false;
    @Column(name = "security_question_1")
    public String securityQuestion1;
    @Column(name = "security_answer_hash_1")
    public String securityAnswerHash1;
    @Column(name = "security_question_2")
    public String securityQuestion2;
    @Column(name = "security_answer_hash_2")
    public String securityAnswerHash2;
    @Column(name = "security_question_3")
    public String securityQuestion3;
    @Column(name = "security_answer_hash_3")
    public String securityAnswerHash3;
    public Integer passwordVersion = 0;
    public String passwordResetTokenHash;
    public OffsetDateTime passwordResetTokenExpiresAt;
    public OffsetDateTime passwordChangedAt;
    public OffsetDateTime lastLoginAt;
    public String lastLoginIp;
    public OffsetDateTime createdAt;
    public OffsetDateTime updatedAt;

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
