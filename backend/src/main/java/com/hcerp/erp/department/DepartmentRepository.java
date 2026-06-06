package com.hcerp.erp.department;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcerp.erp.common.Enums.DepartmentCode;

public interface DepartmentRepository extends JpaRepository<Department, UUID> {
    boolean existsByCode(DepartmentCode code);
}
