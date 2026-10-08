package com.hcerp.erp.notification;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class NotificationPushService implements NotificationPushPublisher {
    private final ConcurrentHashMap<UUID, CopyOnWriteArrayList<SseEmitter>> subscribers = new ConcurrentHashMap<>();

    public SseEmitter subscribe(UUID accountId) {
        SseEmitter emitter = new SseEmitter(0L);
        CopyOnWriteArrayList<SseEmitter> accountSubscribers = subscribers.computeIfAbsent(
                accountId,
                ignored -> new CopyOnWriteArrayList<>());
        accountSubscribers.add(emitter);
        emitter.onCompletion(() -> remove(accountId, emitter));
        emitter.onTimeout(() -> remove(accountId, emitter));
        emitter.onError(error -> remove(accountId, emitter));
        try {
            emitter.send(SseEmitter.event().name("connected").data("connected"));
        } catch (IOException exception) {
            remove(accountId, emitter);
            emitter.completeWithError(exception);
        }
        return emitter;
    }

    public void publishAfterCommit(AppNotification notification) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish(notification);
                }
            });
            return;
        }
        publish(notification);
    }

    private void publish(AppNotification notification) {
        if (notification == null || notification.accountId == null) return;
        for (SseEmitter emitter : subscribers.getOrDefault(notification.accountId, new CopyOnWriteArrayList<>())) {
            try {
                emitter.send(SseEmitter.event().name("notification").data("new"));
            } catch (IOException exception) {
                remove(notification.accountId, emitter);
                emitter.completeWithError(exception);
            }
        }
    }

    private void remove(UUID accountId, SseEmitter emitter) {
        subscribers.computeIfPresent(accountId, (ignored, accountSubscribers) -> {
            accountSubscribers.remove(emitter);
            return accountSubscribers.isEmpty() ? null : accountSubscribers;
        });
    }
}
