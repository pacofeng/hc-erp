package com.hcerp.erp.role;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByCode(String code);
    boolean existsByCode(String code);
    boolean existsByCodeAndIdNot(String code, UUID id);
}
