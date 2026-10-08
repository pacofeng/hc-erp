package com.hcerp.erp.account;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.employee.Employee;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.notification.AppNotification;
import com.hcerp.erp.notification.NotificationPushPublisher;
import com.hcerp.erp.notification.NotificationRepository;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AccountControllerNotificationTest {
    @Test void createsWelcomeNotificationForNewAccount() {
        AccountRepository accounts = mock(AccountRepository.class);
        EmployeeRepository employees = mock(EmployeeRepository.class);
        PasswordEncoder passwordEncoder = mock(PasswordEncoder.class);
        NotificationRepository notifications = mock(NotificationRepository.class);
        NotificationPushPublisher notificationPushes = mock(NotificationPushPublisher.class);
        AccountController controller = new AccountController(accounts, employees, passwordEncoder, notifications, notificationPushes);
        UUID employeeId = UUID.randomUUID();
        UUID accountId = UUID.randomUUID();
        Employee employee = new Employee();
        employee.id = employeeId;
        employee.status = EmployeeStatus.ACTIVE;
        when(employees.findById(employeeId)).thenReturn(java.util.Optional.of(employee));
        when(passwordEncoder.encode("Welcome1!")).thenReturn("hash");
        when(accounts.save(any(Account.class))).thenAnswer(invocation -> {
            Account account = invocation.getArgument(0);
            account.id = accountId;
            return account;
        });
        when(notifications.save(any(AppNotification.class))).thenAnswer(invocation -> invocation.getArgument(0));

        controller.create(new AccountController.AccountRequest(
                employeeId, "new-user", "Welcome1!", AccountStatus.ACTIVE, null));

        ArgumentCaptor<AppNotification> notification = ArgumentCaptor.forClass(AppNotification.class);
        verify(notifications).save(notification.capture());
        verify(notificationPushes).publishAfterCommit(any(AppNotification.class));
        assertEquals(accountId, notification.getValue().accountId);
        assertEquals("欢迎使用恒昌 ERP", notification.getValue().title);
        assertTrue(notification.getValue().content.contains("new-user"));
    }
}
