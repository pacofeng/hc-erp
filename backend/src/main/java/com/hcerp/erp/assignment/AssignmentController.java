package com.hcerp.erp.assignment;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.security.ErpUserDetails;

@RestController
@RequestMapping("/api/assignments")
public class AssignmentController {
    private final AccountRoleRepository accountRoles;
    private final RolePermissionRepository rolePermissions;

    public AssignmentController(AccountRoleRepository accountRoles, RolePermissionRepository rolePermissions) {
        this.accountRoles = accountRoles;
        this.rolePermissions = rolePermissions;
    }

    @GetMapping("/accounts/{accountId}/roles")
    @PreAuthorize("hasAuthority('ACCOUNT_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<AccountRole> accountRoles(@PathVariable UUID accountId) {
        return accountRoles.findByAccountId(accountId);
    }

    @PostMapping("/accounts/{accountId}/roles/{roleId}")
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasAuthority('ACCOUNT_CREATE') or hasRole('SYSTEM_ADMIN')")
    public AccountRole addAccountRole(@PathVariable UUID accountId, @PathVariable UUID roleId,
                                      @AuthenticationPrincipal ErpUserDetails user) {
        return accountRoles.findByAccountIdAndRoleId(accountId, roleId).orElseGet(() -> {
            AccountRole link = new AccountRole();
            link.accountId = accountId;
            link.roleId = roleId;
            link.createdBy = user.accountId();
            return accountRoles.save(link);
        });
    }

    @DeleteMapping("/accounts/{accountId}/roles/{roleId}")
    @Transactional
    @PreAuthorize("hasAuthority('ACCOUNT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public void deleteAccountRole(@PathVariable UUID accountId, @PathVariable UUID roleId) {
        accountRoles.deleteByAccountIdAndRoleId(accountId, roleId);
    }

    @GetMapping("/roles/{roleId}/permissions")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public List<RolePermission> rolePermissions(@PathVariable UUID roleId) {
        return rolePermissions.findByRoleId(roleId);
    }

    @PostMapping("/roles/{roleId}/permissions/{permissionId}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public RolePermission addRolePermission(@PathVariable UUID roleId, @PathVariable UUID permissionId,
                                            @AuthenticationPrincipal ErpUserDetails user) {
        return rolePermissions.findByRoleIdAndPermissionId(roleId, permissionId).orElseGet(() -> {
            RolePermission link = new RolePermission();
            link.roleId = roleId;
            link.permissionId = permissionId;
            link.createdBy = user.accountId();
            return rolePermissions.save(link);
        });
    }

    @DeleteMapping("/roles/{roleId}/permissions/{permissionId}")
    @Transactional
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public void deleteRolePermission(@PathVariable UUID roleId, @PathVariable UUID permissionId) {
        rolePermissions.deleteByRoleIdAndPermissionId(roleId, permissionId);
    }
}
