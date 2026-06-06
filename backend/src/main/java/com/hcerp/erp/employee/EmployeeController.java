package com.hcerp.erp.employee;

import java.time.OffsetDateTime;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.common.Enums.EmployeeStatus;
import com.hcerp.erp.common.Enums.GenderType;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/employees")
public class EmployeeController {
    private final EmployeeRepository employees;

    public EmployeeController(EmployeeRepository employees) {
        this.employees = employees;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<Employee> list() {
        return employees.findByDeletedAtIsNullOrderByEmployeeNoAsc();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('EMPLOYEE_CREATE') or hasRole('SYSTEM_ADMIN')")
    public Employee create(@Valid @RequestBody EmployeeRequest request) {
        Employee employee = new Employee();
        apply(employee, request);
        return employees.save(employee);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_EDIT') or hasRole('SYSTEM_ADMIN')")
    public Employee update(@PathVariable UUID id, @Valid @RequestBody EmployeeRequest request) {
        Employee employee = employees.findById(id).orElseThrow(() -> new NotFoundException("Employee not found"));
        apply(employee, request);
        return employees.save(employee);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('EMPLOYEE_DELETE') or hasRole('SYSTEM_ADMIN')")
    public void delete(@PathVariable UUID id) {
        Employee employee = employees.findById(id).orElseThrow(() -> new NotFoundException("Employee not found"));
        employee.deletedAt = OffsetDateTime.now();
        employees.save(employee);
    }

    private void apply(Employee employee, EmployeeRequest request) {
        employee.employeeNo = request.employeeNo();
        employee.firstName = request.firstName();
        employee.lastName = request.lastName();
        employee.gender = request.gender();
        employee.displayName = request.displayName();
        employee.phone = request.phone();
        employee.departmentId = request.departmentId();
        employee.managerId = request.managerId();
        employee.jobTitle = request.jobTitle();
        employee.hireDate = request.hireDate();
        employee.terminationDate = request.terminationDate();
        employee.status = request.status();
    }

    public record EmployeeRequest(
            @NotBlank String employeeNo,
            @NotBlank String firstName,
            @NotBlank String lastName,
            @NotNull GenderType gender,
            String displayName,
            String phone,
            UUID departmentId,
            UUID managerId,
            String jobTitle,
            LocalDate hireDate,
            LocalDate terminationDate,
            @NotNull EmployeeStatus status) {
    }
}
