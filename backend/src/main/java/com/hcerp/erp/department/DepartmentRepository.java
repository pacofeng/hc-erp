package com.hcerp.erp.department;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByCode(String code);

    @Query(value = "SELECT COUNT(*) FROM employees WHERE department_id = :departmentId", nativeQuery = true)
    long countEmployeesByDepartmentId(@Param("departmentId") UUID departmentId);
}
