package com.hcerp.erp.employee;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface EmergencyContactRepository extends JpaRepository<EmergencyContact, UUID> {
    Optional<EmergencyContact> findByEmployeeId(UUID employeeId);
    List<EmergencyContact> findByEmployeeIdIn(Collection<UUID> employeeIds);
    void deleteByEmployeeId(UUID employeeId);
}
