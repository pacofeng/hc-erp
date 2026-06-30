package com.hcerp.erp.permission;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, UUID id);
}
