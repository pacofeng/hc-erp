package com.hcerp.erp.notification;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.hcerp.erp.common.NotFoundException;
import com.hcerp.erp.security.ErpUserDetails;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationRepository notifications;
    private final NotificationPushPublisher notificationPushes;

    public NotificationController(NotificationRepository notifications, NotificationPushPublisher notificationPushes) {
        this.notifications = notifications;
        this.notificationPushes = notificationPushes;
    }

    @GetMapping
    public NotificationFeed list(@AuthenticationPrincipal ErpUserDetails user) {
        UUID accountId = user.accountId();
        return new NotificationFeed(
                notifications.findTop10ByAccountIdOrderByCreatedAtDesc(accountId).stream()
                        .map(NotificationView::from)
                        .toList(),
                notifications.countByAccountIdAndReadFalse(accountId));
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@AuthenticationPrincipal ErpUserDetails user) {
        return notificationPushes.subscribe(user.accountId());
    }

    @GetMapping("/all")
    public Page<NotificationView> listAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal ErpUserDetails user) {
        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        return notifications.findByAccountId(user.accountId(), pageable).map(NotificationView::from);
    }

    @PatchMapping("/{id}/read")
    @Transactional
    public NotificationView markRead(@PathVariable UUID id, @AuthenticationPrincipal ErpUserDetails user) {
        AppNotification notification = notifications.findByIdAndAccountId(id, user.accountId())
                .orElseThrow(() -> new NotFoundException("通知不存在"));
        if (!notification.read) {
            notification.read = true;
            notification.readAt = OffsetDateTime.now();
        }
        return NotificationView.from(notifications.save(notification));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal ErpUserDetails user) {
        AppNotification notification = notifications.findByIdAndAccountId(id, user.accountId())
                .orElseThrow(() -> new NotFoundException("通知不存在"));
        notifications.delete(notification);
    }

    public record NotificationFeed(List<NotificationView> notifications, long unreadCount) {
    }

    public record NotificationView(
            UUID id,
            String title,
            String content,
            String type,
            boolean read,
            OffsetDateTime readAt,
            OffsetDateTime createdAt) {
        static NotificationView from(AppNotification notification) {
            return new NotificationView(
                    notification.id,
                    notification.title,
                    notification.content,
                    notification.type,
                    notification.read,
                    notification.readAt,
                    notification.createdAt);
        }
    }
}
