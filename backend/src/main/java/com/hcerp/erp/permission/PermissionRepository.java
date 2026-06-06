package com.hcerp.erp.permission;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcerp.erp.common.Enums.PermissionCode;

public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    Optional<Permission> findByCode(PermissionCode code);
    boolean existsByCode(PermissionCode code);
}
