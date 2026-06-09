package com.hcerp.erp.department;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.hcerp.erp.common.Enums.DepartmentCode;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByCode(DepartmentCode code);

    @Modifying
    @Query(value = "UPDATE employees SET department_id = NULL WHERE department_id = :departmentId", nativeQuery = true)
    void clearEmployeeDepartmentReferences(@Param("departmentId") UUID departmentId);
}
