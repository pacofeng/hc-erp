package com.hcerp.erp.notification;

import java.util.UUID;

import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

public interface NotificationPushPublisher {
    SseEmitter subscribe(UUID accountId);

    void publishAfterCommit(AppNotification notification);
}
