package com.hcerp.erp.role;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcerp.erp.common.Enums.RoleCode;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByCode(RoleCode code);
    boolean existsByCode(RoleCode code);
}
