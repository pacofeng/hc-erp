package com.hcerp.erp.account;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    Optional<Account> findByUsername(String username);
    List<Account> findAllByOrderByUsernameAsc();
    boolean existsByUsername(String username);

    @Query(value = """
            SELECT r.code
            FROM roles r
            JOIN account_roles ar ON ar.role_id = r.id
            WHERE ar.account_id = :accountId AND r.status = 'ACTIVE'
            """, nativeQuery = true)
    List<String> findRoleCodes(@Param("accountId") UUID accountId);

    @Query(value = """
            SELECT p.code
            FROM permissions p
            JOIN role_permissions rp ON rp.permission_id = p.id
            JOIN account_roles ar ON ar.role_id = rp.role_id
            JOIN roles r ON r.id = ar.role_id
            WHERE ar.account_id = :accountId AND r.status = 'ACTIVE'
            """, nativeQuery = true)
    List<String> findPermissionCodes(@Param("accountId") UUID accountId);

    @Modifying
    @Query(value = "UPDATE account_roles SET created_by = NULL WHERE created_by = :accountId", nativeQuery = true)
    void clearAccountRoleCreatedByReferences(@Param("accountId") UUID accountId);

    @Modifying
    @Query(value = "UPDATE role_permissions SET created_by = NULL WHERE created_by = :accountId", nativeQuery = true)
    void clearRolePermissionCreatedByReferences(@Param("accountId") UUID accountId);
}
