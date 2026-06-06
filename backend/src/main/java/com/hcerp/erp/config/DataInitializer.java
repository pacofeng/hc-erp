package com.hcerp.erp.config;

import java.time.OffsetDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.assignment.AccountRole;
import com.hcerp.erp.assignment.AccountRoleRepository;
import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.common.Enums.AccountType;
import com.hcerp.erp.common.Enums.DepartmentCode;
import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.GenderType;
import com.hcerp.erp.common.Enums.RoleCode;
import com.hcerp.erp.department.DepartmentRepository;
import com.hcerp.erp.employee.Employee;
import com.hcerp.erp.employee.EmployeeRepository;
import com.hcerp.erp.role.RoleRepository;

@Configuration
public class DataInitializer {
    @Bean
    CommandLineRunner seedAdmin(
            DepartmentRepository departments,
            EmployeeRepository employees,
            AccountRepository accounts,
            RoleRepository roles,
            AccountRoleRepository accountRoles,
            PasswordEncoder passwordEncoder) {
        return args -> {
            if (accounts.existsByUsername("admin")) return;

            Employee employee = new Employee();
            employee.employeeNo = "EMP-0001";
            employee.firstName = "System";
            employee.lastName = "Admin";
            employee.gender = GenderType.MALE;
            employee.status = EmployeeStatus.ACTIVE;
            employee.departmentId = departments.findAll().stream()
                    .filter(d -> d.code == DepartmentCode.ADMIN)
                    .findFirst()
                    .map(d -> d.id)
                    .orElse(null);
            employees.save(employee);

            Account account = new Account();
            account.employeeId = employee.id;
            account.username = "admin";
            account.passwordHash = passwordEncoder.encode("admin123");
            account.status = AccountStatus.ACTIVE;
            account.accountType = AccountType.SYSTEM;
            account.passwordChangedAt = OffsetDateTime.now();
            accounts.save(account);

            roles.findByCode(RoleCode.SYSTEM_ADMIN).ifPresent(role -> {
                AccountRole link = new AccountRole();
                link.accountId = account.id;
                link.roleId = role.id;
                link.createdBy = account.id;
                accountRoles.save(link);
            });
        };
    }
}
