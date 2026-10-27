package com.hcerp.erp.account;

import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.hcerp.erp.auth.AccountActivationService;
import com.hcerp.erp.assignment.AccountRoleRepository;
import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.RoleStatus;
import com.hcerp.erp.employee.Employee;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.role.Role;
import com.hcerp.erp.role.RoleRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AccountControllerNotificationTest {
    @Test void createsPendingAccountWithActivationToken() {
        AccountRepository accounts = mock(AccountRepository.class);
        EmployeeRepository employees = mock(EmployeeRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        AccountRoleRepository accountRoles = mock(AccountRoleRepository.class);
        AccountController controller = new AccountController(
                accounts, employees, roles, accountRoles, new AccountActivationService());
        UUID employeeId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Employee employee = new Employee();
        employee.id = employeeId;
        employee.status = EmployeeStatus.ACTIVE;
        when(employees.findById(employeeId)).thenReturn(java.util.Optional.of(employee));
        when(accounts.existsByEmployeeId(employeeId)).thenReturn(false);
        when(accounts.save(any(Account.class))).thenAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            account.id = accountId;
            return account;
        });
        var invitation = controller.create(new AccountController.AccountRequest(
                employeeId, null, null, null, null, null), null);

        assertEquals(accountId, invitation.accountId());
        assertFalse(invitation.activationToken().isBlank());
        assertNotNull(invitation.activationExpiresAt());
        verify(accounts).save(argThat(account ->
                account.status == AccountStatus.PENDING_ACTIVATION
                        && account.username == null
                        && account.passwordHash == null));
    }

    @Test void assignsSelectedActiveRolesWhenCreatingAnAccount() {
        AccountRepository accounts = mock(AccountRepository.class);
        EmployeeRepository employees = mock(EmployeeRepository.class);
        RoleRepository roles = mock(RoleRepository.class);
        AccountRoleRepository accountRoles = mock(AccountRoleRepository.class);
        AccountController controller = new AccountController(
                accounts, employees, roles, accountRoles, new AccountActivationService());
        UUID employeeId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        UUID roleId = UUID.randomUUID();
        Employee employee = new Employee();
        employee.id = employeeId;
        employee.status = EmployeeStatus.ACTIVE;
        Role role = new Role();
        role.id = roleId;
        role.status = RoleStatus.ACTIVE;
        when(employees.findById(employeeId)).thenReturn(java.util.Optional.of(employee));
        when(accounts.existsByEmployeeId(employeeId)).thenReturn(false);
        when(accounts.save(any(Account.class))).thenAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            account.id = accountId;
            return account;
        });
        when(roles.findAllById(any())).thenReturn(java.util.List.of(role));

        controller.create(new AccountController.AccountRequest(
                employeeId, null, null, null, java.util.List.of(roleId), null), null);

        verify(accountRoles).save(argThat(link ->
                link.accountId.equals(accountId) && link.roleId.equals(roleId)));
    }

    @Test void clearsLoginFailuresWhenAnAdminUnlocksAnAccountThroughStatusUpdate() {
        AccountRepository accounts = mock(AccountRepository.class);
        AccountController controller = new AccountController(
                accounts, mock(EmployeeRepository.class), mock(RoleRepository.class),
                mock(AccountRoleRepository.class), new AccountActivationService());
        UUID accountId = UUID.randomUUID();
        Account account = new Account();
        account.id = accountId;
        account.status = AccountStatus.LOCKED;
        account.failedLoginCount = 5;
        account.lockedUntil = OffsetDateTime.now().plusMinutes(10);
        when(accounts.findById(accountId)).thenReturn(java.util.Optional.of(account));
        when(accounts.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        controller.update(accountId, new AccountController.AccountRequest(
                null, null, null, AccountStatus.ACTIVE, null, null));

        assertEquals(AccountStatus.ACTIVE, account.status);
        assertEquals(0, account.failedLoginCount);
        assertNull(account.lockedUntil);
    }

    @Test void resetsAccountAccessWithoutChangingUsername() {
        AccountRepository accounts = mock(AccountRepository.class);
        AccountController controller = new AccountController(
                accounts, mock(EmployeeRepository.class), mock(RoleRepository.class),
                mock(AccountRoleRepository.class), new AccountActivationService());
        UUID accountId = UUID.randomUUID();
        Account account = new Account();
        account.id = accountId;
        account.username = "existing-user";
        account.passwordHash = "previous-password-hash";
        account.status = AccountStatus.ACTIVE;
        account.securityQuestionsConfigured = true;
        account.securityQuestion1 = "birth-city";
        account.securityAnswerHash1 = "previous-answer-hash";
        account.passwordVersion = 4;
        when(accounts.findById(accountId)).thenReturn(java.util.Optional.of(account));
        when(accounts.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        var invitation = controller.resetAccess(accountId, null);

        assertEquals("existing-user", account.username);
        assertEquals(AccountStatus.PENDING_ACTIVATION, account.status);
        assertNull(account.passwordHash);
        assertFalse(account.securityQuestionsConfigured);
        assertNull(account.securityQuestion1);
        assertNull(account.securityAnswerHash1);
        assertEquals(5, account.passwordVersion);
        assertFalse(invitation.activationToken().isBlank());
        assertNotNull(account.activationTokenHash);
        assertNotNull(account.activationExpiresAt);
    }
}
