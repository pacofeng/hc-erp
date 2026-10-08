package com.hcerp.erp.notification;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<AppNotification, UUID> {
    List<AppNotification> findTop10ByAccountIdOrderByCreatedAtDesc(UUID accountId);
    Page<AppNotification> findByAccountId(UUID accountId, Pageable pageable);
    long countByAccountIdAndReadFalse(UUID accountId);
    Optional<AppNotification> findByIdAndAccountId(UUID id, UUID accountId);
}
