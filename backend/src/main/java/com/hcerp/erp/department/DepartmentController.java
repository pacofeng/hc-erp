package com.hcerp.erp.department;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.common.Enums.DepartmentStatus;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@RestController
@RequestMapping("/api/departments")
public class DepartmentController {
    private final DepartmentRepository departments;

    public DepartmentController(DepartmentRepository departments) {
        this.departments = departments;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('DEPARTMENT_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<Department> list() {
        return departments.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAuthority('DEPARTMENT_CREATE') or hasRole('SYSTEM_ADMIN')")
    public Department create(@Valid @RequestBody DepartmentRequest request) {
        String code = request.code().trim().toUpperCase();
        if (departments.existsByCode(code)) {
            throw new IllegalArgumentException("Department code already exists");
        }
        Department department = new Department();
        apply(department, request);
        return departments.save(department);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPARTMENT_EDIT') or hasRole('SYSTEM_ADMIN')")
    public Department update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest request) {
        Department department = departments.findById(id).orElseThrow(() -> new NotFoundException("Department not found"));
        applyMutableFields(department, request);
        return departments.save(department);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DEPARTMENT_DELETE') or hasRole('SYSTEM_ADMIN')")
    @Transactional
    public void delete(@PathVariable UUID id) {
        if (!departments.existsById(id)) {
            throw new NotFoundException("Department not found");
        }
        if (departments.countEmployeesByDepartmentId(id) > 0) {
            throw new IllegalArgumentException("Department cannot be deleted while employees are assigned to it");
        }
        departments.deleteById(id);
    }

    private void apply(Department department, DepartmentRequest request) {
        department.code = request.code().trim().toUpperCase();
        department.name = request.name();
        applyMutableFields(department, request);
    }

    private void applyMutableFields(Department department, DepartmentRequest request) {
        department.managerId = request.managerId();
        department.status = request.status();
    }

    public record DepartmentRequest(
            @NotBlank @Pattern(regexp = "^[A-Z0-9_-]+$", message = "Department code must be uppercase")
            String code,
            @NotBlank String name,
            UUID managerId,
            @NotNull DepartmentStatus status) {
    }
}
