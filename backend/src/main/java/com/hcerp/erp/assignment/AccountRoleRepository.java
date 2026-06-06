package com.hcerp.erp.assignment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AccountRoleRepository extends JpaRepository<AccountRole, UUID> {
    List<AccountRole> findByAccountId(UUID accountId);
    Optional<AccountRole> findByAccountIdAndRoleId(UUID accountId, UUID roleId);
    void deleteByAccountIdAndRoleId(UUID accountId, UUID roleId);
}
