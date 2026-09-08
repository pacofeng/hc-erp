package com.hcerp.erp.account;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.NotFoundException;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.security.ErpUserDetails;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountRepository accounts;
    private final EmployeeRepository employees;
    private final PasswordEncoder passwordEncoder;

    public AccountController(AccountRepository accounts, EmployeeRepository employees, PasswordEncoder passwordEncoder) {
        this.accounts = accounts;
        this.employees = employees;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ACCOUNT_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<AccountView> list() {
        return accounts.findAllByOrderByUsernameAsc().stream().map(AccountView::from).toList();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ACCOUNT_CREATE') or hasRole('SYSTEM_ADMIN')")
    public AccountView create(@Valid @RequestBody AccountRequest request) {
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("Password is required for new accounts");
        }
        if (request.employeeId() == null) {
            throw new IllegalArgumentException("Employee is required for new accounts");
        }
        if (accounts.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already exists");
        }
        validatePasswordStrength(request.password());
        Account account = new Account();
        apply(account, request, true);
        account.accountType = AccountType.USER;
        account.mustChangePassword = true;
        account.passwordHash = passwordEncoder.encode(request.password());
        account.passwordChangedAt = OffsetDateTime.now();
        return AccountView.from(accounts.save(account));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public AccountView update(@PathVariable UUID id, @Valid @RequestBody AccountRequest request) {
        Account account = accounts.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
        apply(account, request, false);
        if (request.password() != null && !request.password().isBlank()) {
            validatePasswordStrength(request.password());
            account.passwordHash = passwordEncoder.encode(request.password());
            account.passwordChangedAt = OffsetDateTime.now();
            account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
            account.mustChangePassword = true;
        }
        return AccountView.from(accounts.save(account));
    }

    @DeleteMapping("/{id}")
    @Transactional
    @PreAuthorize("hasAuthority('ACCOUNT_DELETE') or hasRole('SYSTEM_ADMIN')")
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal ErpUserDetails user) {
        if (id.equals(user.accountId())) {
            throw new IllegalArgumentException("You cannot delete your own account");
        }
        if (!accounts.existsById(id)) {
            throw new NotFoundException("Account not found");
        }
        accounts.clearAccountRoleCreatedByReferences(id);
        accounts.clearRolePermissionCreatedByReferences(id);
        accounts.deleteById(id);
    }

    private void validatePasswordStrength(String password) {
        boolean hasLetter = password.chars().anyMatch(Character::isLetter);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = password.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (password.length() < 8 || !(hasLetter && hasDigit && hasSpecial)) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters and include letters, numbers, and special characters");
        }
    }

    private void apply(Account account, AccountRequest request, boolean creating) {
        if (creating) {
            var employee = employees.findById(request.employeeId())
                    .orElseThrow(() -> new NotFoundException("Employee not found"));
            if (employee.status != EmployeeStatus.ACTIVE) {
                throw new IllegalArgumentException("Account can only be created for an active employee");
            }
        }
        account.employeeId = request.employeeId();
        if (creating) {
            account.username = request.username();
        }
        account.status = request.status();
        account.avatar = request.avatar();
        account.preferredLanguage = "zh-CN";
    }

    public record AccountRequest(
            UUID employeeId,
            @NotBlank String username,
            String password,
            @NotNull AccountStatus status,
            @Size(max = 30000000, message = "Avatar must be 20MB or smaller")
            @Pattern(regexp = "^data:image/(png|jpeg|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$", message = "Avatar must be an uploaded image file")
            String avatar) {
    }

    public record AccountView(UUID id, UUID employeeId, String username, AccountStatus status, AccountType accountType,
                              Integer failedLoginCount, Boolean mustChangePassword, String preferredLanguage,
                              String avatar, Boolean securityQuestionsConfigured, OffsetDateTime lastLoginAt) {
        static AccountView from(Account account) {
            return new AccountView(account.id, account.employeeId, account.username, account.status, account.accountType,
                    account.failedLoginCount, account.mustChangePassword, account.preferredLanguage,
                    account.avatar, account.securityQuestionsConfigured, account.lastLoginAt);
        }
    }
}
