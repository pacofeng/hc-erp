package com.hcerp.erp.account;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import com.hcerp.erp.auth.AccountActivationService;
import com.hcerp.erp.assignment.AccountRole;
import com.hcerp.erp.assignment.AccountRoleRepository;
import com.hcerp.erp.common.Enums.RoleStatus;
import com.hcerp.erp.role.Role;
import com.hcerp.erp.role.RoleRepository;
import com.hcerp.erp.security.ErpUserDetails;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountRepository accounts;
    private final EmployeeRepository employees;
    private final RoleRepository roles;
    private final AccountRoleRepository accountRoles;
    private final AccountActivationService accountActivationService;

    public AccountController(AccountRepository accounts, EmployeeRepository employees, RoleRepository roles,
            AccountRoleRepository accountRoles,
            AccountActivationService accountActivationService) {
        this.accounts = accounts;
        this.employees = employees;
        this.roles = roles;
        this.accountRoles = accountRoles;
        this.accountActivationService = accountActivationService;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('ACCOUNT_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<AccountView> list() {
        return accounts.findAllByOrderByUsernameAsc().stream().map(AccountView::from).toList();
    }

    @PostMapping
    @Transactional
    @PreAuthorize("hasAuthority('ACCOUNT_CREATE') or hasRole('SYSTEM_ADMIN')")
    public AccountActivationInvitation create(@Valid @RequestBody AccountRequest request,
                                              @AuthenticationPrincipal ErpUserDetails user) {
        if (request.employeeId() == null) {
            throw new IllegalArgumentException("Employee is required for new accounts");
        }
        if (accounts.existsByEmployeeId(request.employeeId())) {
            throw new IllegalArgumentException("该员工已有账号");
        }
        Account account = new Account();
        apply(account, request, true);
        account.accountType = AccountType.USER;
        account.mustChangePassword = true;
        account.status = AccountStatus.PENDING_ACTIVATION;
        String activationToken = accountActivationService.issue(account);
        Account saved = accounts.save(account);
        assignRoles(saved.id, request.roleIds(), user);
        return new AccountActivationInvitation(saved.id, activationToken, saved.activationExpiresAt);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public AccountView update(@PathVariable UUID id, @Valid @RequestBody AccountRequest request) {
        Account account = accounts.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
        apply(account, request, false);
        return AccountView.from(accounts.save(account));
    }

    @PostMapping("/{id}/unlock")
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public AccountView unlock(@PathVariable UUID id) {
        Account account = accounts.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
        if (account.status != AccountStatus.LOCKED) {
            throw new IllegalArgumentException("该账号当前未被锁定");
        }
        unlockAccount(account);
        return AccountView.from(accounts.save(account));
    }

    @PostMapping("/{id}/reset-security-questions")
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public AccountView resetSecurityQuestions(@PathVariable UUID id,
                                              @AuthenticationPrincipal ErpUserDetails user) {
        if (id.equals(user.accountId())) {
            throw new IllegalArgumentException("请在设置页面更新自己的安全问题");
        }
        Account account = accounts.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
        clearSecurityQuestions(account);
        account.passwordResetTokenHash = null;
        account.passwordResetTokenExpiresAt = null;
        account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
        return AccountView.from(accounts.save(account));
    }

    @PostMapping("/{id}/reset-access")
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public AccountActivationInvitation resetAccess(@PathVariable UUID id,
                                                    @AuthenticationPrincipal ErpUserDetails user) {
        if (user != null && id.equals(user.accountId())) {
            throw new IllegalArgumentException("请在设置页面更新自己的账号信息");
        }
        Account account = accounts.findById(id).orElseThrow(() -> new NotFoundException("Account not found"));
        if (account.status == AccountStatus.TERMINATED) {
            throw new IllegalArgumentException("停用账号不能重置访问权限");
        }
        account.status = AccountStatus.PENDING_ACTIVATION;
        account.passwordHash = null;
        account.mustChangePassword = true;
        account.lockedUntil = null;
        clearSecurityQuestions(account);
        account.passwordResetTokenHash = null;
        account.passwordResetTokenExpiresAt = null;
        account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
        String activationToken = accountActivationService.issue(account);
        Account saved = accounts.save(account);
        return new AccountActivationInvitation(saved.id, activationToken, saved.activationExpiresAt);
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

    private void apply(Account account, AccountRequest request, boolean creating) {
        if (creating) {
            var employee = employees.findById(request.employeeId())
                    .orElseThrow(() -> new NotFoundException("Employee not found"));
            if (employee.status != EmployeeStatus.ACTIVE) {
                throw new IllegalArgumentException("Account can only be created for an active employee");
            }
            account.employeeId = request.employeeId();
        }
        if (!creating) {
            if (request.status() == null) throw new IllegalArgumentException("Account status is required");
            boolean isBeingUnlocked = account.status == AccountStatus.LOCKED
                    && request.status() == AccountStatus.ACTIVE;
            account.status = request.status();
            if (isBeingUnlocked) unlockAccount(account);
        }
        if (creating) account.preferredLanguage = "zh-CN";
    }

    private void unlockAccount(Account account) {
        account.status = AccountStatus.ACTIVE;
        account.failedLoginCount = 0;
        account.lockedUntil = null;
    }

    private void clearSecurityQuestions(Account account) {
        account.securityQuestion1 = null;
        account.securityAnswerHash1 = null;
        account.securityQuestion2 = null;
        account.securityAnswerHash2 = null;
        account.securityQuestion3 = null;
        account.securityAnswerHash3 = null;
        account.securityQuestionsConfigured = false;
    }

    private void assignRoles(UUID accountId, List<UUID> roleIds, ErpUserDetails user) {
        Set<UUID> uniqueRoleIds = roleIds == null ? Set.of() : new LinkedHashSet<>(roleIds);
        if (uniqueRoleIds.isEmpty()) return;

        List<Role> selectedRoles = roles.findAllById(uniqueRoleIds);
        if (selectedRoles.size() != uniqueRoleIds.size()
                || selectedRoles.stream().anyMatch(role -> role.status != RoleStatus.ACTIVE)) {
            throw new IllegalArgumentException("所选角色不存在或已停用");
        }

        selectedRoles.forEach(role -> {
            AccountRole link = new AccountRole();
            link.accountId = accountId;
            link.roleId = role.id;
            link.createdBy = user == null ? null : user.accountId();
            accountRoles.save(link);
        });
    }

    public record AccountRequest(
            UUID employeeId,
            String username,
            String password,
            AccountStatus status,
            List<UUID> roleIds,
            @Size(max = 30000000, message = "Avatar must be 20MB or smaller")
            @Pattern(regexp = "^data:image/(png|jpeg|gif|webp|bmp);base64,[A-Za-z0-9+/=]+$", message = "Avatar must be an uploaded image file")
            String avatar) {
    }

    public record AccountActivationInvitation(UUID accountId, String activationToken,
                                              OffsetDateTime activationExpiresAt) {
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
