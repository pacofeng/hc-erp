package com.hcerp.erp.employee;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EmployeeRepository extends JpaRepository<Employee, UUID> {
    interface OrderAssigneeProjection {
        UUID getId();
        String getFullName();
    }

    List<Employee> findAllByOrderByEmployeeNoAsc();
    boolean existsByEmployeeNo(String employeeNo);

    @Query(value = """
            SELECT DISTINCT e.id AS id, e.full_name AS fullName
            FROM employees e
            JOIN accounts a ON a.employee_id = e.id
            WHERE e.status = '在职'
              AND a.status = '启用'
              AND (
                EXISTS (
                    SELECT 1
                    FROM account_roles ar
                    JOIN roles r ON r.id = ar.role_id
                    WHERE ar.account_id = a.id
                      AND r.status = 'ACTIVE'
                      AND r.code = :roleCode
                )
                OR EXISTS (
                    SELECT 1
                    FROM account_roles ar
                    JOIN roles r ON r.id = ar.role_id
                    JOIN role_permissions rp ON rp.role_id = r.id
                    JOIN permissions p ON p.id = rp.permission_id
                    WHERE ar.account_id = a.id
                      AND r.status = 'ACTIVE'
                      AND p.code = :permissionCode
                )
              )
            ORDER BY e.full_name
            """, nativeQuery = true)
    List<OrderAssigneeProjection> findOrderAssignees(
            @Param("roleCode") String roleCode,
            @Param("permissionCode") String permissionCode);

    @Query(value = """
            SELECT e.full_name
            FROM employees e
            JOIN accounts a ON a.employee_id = e.id
            WHERE a.username = :username
            """, nativeQuery = true)
    Optional<String> findFullNameByAccountUsername(@Param("username") String username);

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
    @Query(value = "UPDATE accounts SET status = '停用', updated_at = NOW() WHERE employee_id = :employeeId", nativeQuery = true)
    void terminateAccountsByEmployeeId(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query(value = "UPDATE departments SET manager_id = NULL WHERE manager_id = :employeeId", nativeQuery = true)
    void clearDepartmentManagerReferences(@Param("employeeId") UUID employeeId);

    @Modifying
    @Query(value = "UPDATE employees SET manager_id = NULL WHERE manager_id = :employeeId", nativeQuery = true)
    void clearEmployeeManagerReferences(@Param("employeeId") UUID employeeId);
}
