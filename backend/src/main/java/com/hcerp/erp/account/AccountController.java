package com.hcerp.erp.account;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.common.Enums.AccountType;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/accounts")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class AccountController {
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;

    public AccountController(AccountRepository accounts, PasswordEncoder passwordEncoder) {
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    public List<AccountView> list() {
        return accounts.findAllByOrderByUsernameAsc().stream().map(AccountView::from).toList();
    }

    @PostMapping
    public AccountView create(@Valid @RequestBody AccountRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Password is required for new accounts");
        }
        Account account = new Account();
        apply(account, request);
        account.passwordHash = passwordEncoder.encode(request.password());
        account.passwordChangedAt = OffsetDateTime.now();
        return AccountView.from(accounts.save(account));
    }

    @PutMapping("/{id}")
    public AccountView update(@PathVariable UUID id, @Valid @RequestBody AccountRequest request) {
        Account account = accounts.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
        apply(account, request);
        if (request.password() != null && !request.password().isBlank()) {
            account.passwordHash = passwordEncoder.encode(request.password());
            account.passwordChangedAt = OffsetDateTime.now();
        }
        return AccountView.from(accounts.save(account));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        if (!accounts.existsById(id)) {
            throw new NotFoundException("Account not found");
        }
        accounts.clearAccountRoleCreatedByReferences(id);
        accounts.clearRolePermissionCreatedByReferences(id);
        accounts.deleteById(id);
    }

    private void apply(Account account, AccountRequest request) {
        account.employeeId = request.employeeId();
        account.username = request.username();
        account.status = request.status();
        account.accountType = request.accountType();
        account.mustChangePassword = Boolean.TRUE.equals(request.mustChangePassword());
        String preferredLanguage = request.preferredLanguage() == null || request.preferredLanguage().isBlank()
                ? "zh-CN"
                : request.preferredLanguage();
        if (!preferredLanguage.equals("en") && !preferredLanguage.equals("zh-CN")) {
            throw new IllegalArgumentException("Unsupported language");
        }
        account.preferredLanguage = preferredLanguage;
    }

    public record AccountRequest(
            UUID employeeId,
            @NotBlank String username,
            String password,
            @NotNull AccountStatus status,
            @NotNull AccountType accountType,
            Boolean mustChangePassword,
            String preferredLanguage) {
    }

    public record AccountView(UUID id, UUID employeeId, String username, AccountStatus status, AccountType accountType,
                              Integer failedLoginCount, Boolean mustChangePassword, String preferredLanguage,
                              OffsetDateTime lastLoginAt) {
        static AccountView from(Account account) {
            return new AccountView(account.id, account.employeeId, account.username, account.status, account.accountType,
                    account.failedLoginCount, account.mustChangePassword, account.preferredLanguage, account.lastLoginAt);
        }
    }
}
