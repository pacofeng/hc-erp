package com.hcerp.erp.notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.PageImpl;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.security.ErpUserDetails;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class NotificationControllerTest {
    private final NotificationRepository repository = mock(NotificationRepository.class);
    private final NotificationPushPublisher notificationPushes = mock(NotificationPushPublisher.class);
    private final NotificationController controller = new NotificationController(repository, notificationPushes);
    private final UUID accountId = UUID.randomUUID();
    private final ErpUserDetails user = new ErpUserDetails(account(accountId), List.of());

    @Test void listsLatestNotificationsAndUnreadCountForCurrentAccount() {
        AppNotification notification = new AppNotification();
        notification.id = UUID.randomUUID();
        notification.accountId = accountId;
        notification.title = "欢迎使用恒昌 ERP";
        notification.content = "欢迎";
        when(repository.findTop10ByAccountIdOrderByCreatedAtDesc(accountId)).thenReturn(List.of(notification));
        when(repository.countByAccountIdAndReadFalse(accountId)).thenReturn(1L);

        NotificationController.NotificationFeed feed = controller.list(user);

        assertEquals(1, feed.notifications().size());
        assertEquals(1, feed.unreadCount());
        verify(repository).findTop10ByAccountIdOrderByCreatedAtDesc(accountId);
    }

    @Test void marksOnlyCurrentAccountsNotificationAsRead() {
        UUID notificationId = UUID.randomUUID();
        AppNotification notification = new AppNotification();
        notification.id = notificationId;
        notification.accountId = accountId;
        notification.title = "欢迎";
        notification.content = "欢迎";
        when(repository.findByIdAndAccountId(notificationId, accountId)).thenReturn(Optional.of(notification));
        when(repository.save(notification)).thenReturn(notification);

        NotificationController.NotificationView updated = controller.markRead(notificationId, user);

        assertTrue(updated.read());
        assertNotNull(updated.readAt());
        verify(repository).findByIdAndAccountId(notificationId, accountId);
    }

    @Test void listsAllNotificationsForCurrentAccount() {
        AppNotification notification = new AppNotification();
        notification.id = UUID.randomUUID();
        notification.accountId = accountId;
        notification.title = "欢迎";
        notification.content = "欢迎";
        when(repository.findByAccountId(eq(accountId), any())).thenReturn(new PageImpl<>(List.of(notification)));

        var page = controller.listAll(0, 20, user);

        assertEquals(1, page.getTotalElements());
        verify(repository).findByAccountId(eq(accountId), any());
    }

    @Test void deletesOnlyCurrentAccountsNotification() {
        UUID notificationId = UUID.randomUUID();
        AppNotification notification = new AppNotification();
        notification.id = notificationId;
        notification.accountId = accountId;
        when(repository.findByIdAndAccountId(notificationId, accountId)).thenReturn(Optional.of(notification));

        controller.delete(notificationId, user);

        verify(repository).delete(notification);
    }

    private static Account account(UUID id) {
        Account account = new Account();
        account.id = id;
        return account;
    }
}
