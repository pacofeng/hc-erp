package com.hcerp.erp.employee;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    List<Employee> findAllByOrderByEmployeeNoAsc();
    boolean existsByEmployeeNo(String employeeNo);

    @Modifying
    @Query(value = """
            UPDATE account_roles
            SET created_by = NULL
            WHERE created_by IN (SELECT id FROM accounts WHERE employee_id = :employeeId)
            """, nativeQuery = true)
    void clearAccountRoleCreatedByReferences(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query(value = """
            UPDATE role_permissions
            SET created_by = NULL
            WHERE created_by IN (SELECT id FROM accounts WHERE employee_id = :employeeId)
            """, nativeQuery = true)
    void clearRolePermissionCreatedByReferences(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query(value = "DELETE FROM accounts WHERE employee_id = :employeeId", nativeQuery = true)
    void deleteAccountsByEmployeeId(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query(value = "UPDATE departments SET manager_id = NULL WHERE manager_id = :employeeId", nativeQuery = true)
    void clearDepartmentManagerReferences(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query(value = "UPDATE employees SET manager_id = NULL WHERE manager_id = :employeeId", nativeQuery = true)
    void clearEmployeeManagerReferences(@Param("employeeId") UUID employeeId);
}
