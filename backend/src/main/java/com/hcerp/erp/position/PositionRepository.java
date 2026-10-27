package com.hcerp.erp.position;

import java.util.UUID;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.hcerp.erp.common.Enums.DepartmentStatus;

public interface PositionRepository extends JpaRepository<Position, UUID> {
    List<Position> findByStatusOrderByNameAsc(DepartmentStatus status);
}
