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

import com.hcerp.erp.common.Enums.DepartmentCode;
import com.hcerp.erp.common.Enums.DepartmentStatus;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/departments")
@PreAuthorize("hasRole('SYSTEM_ADMIN') or hasAuthority('EMPLOYEE_VIEW')")
public class DepartmentController {
    private final DepartmentRepository departments;

    public DepartmentController(DepartmentRepository departments) {
        this.departments = departments;
    }

    @GetMapping
    public List<Department> list() {
        return departments.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Department create(@Valid @RequestBody DepartmentRequest request) {
        Department department = new Department();
        apply(department, request);
        return departments.save(department);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    public Department update(@PathVariable UUID id, @Valid @RequestBody DepartmentRequest request) {
        Department department = departments.findById(id).orElseThrow(() -> new NotFoundException("Department not found"));
        apply(department, request);
        return departments.save(department);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SYSTEM_ADMIN')")
    @Transactional
    public void delete(@PathVariable UUID id) {
        if (!departments.existsById(id)) {
            throw new NotFoundException("Department not found");
        }
        departments.clearEmployeeDepartmentReferences(id);
        departments.deleteById(id);
    }

    private void apply(Department department, DepartmentRequest request) {
        department.code = request.code();
        department.name = request.name();
        department.managerId = request.managerId();
        department.status = request.status();
    }

    public record DepartmentRequest(
            @NotNull DepartmentCode code,
            @NotBlank String name,
            UUID managerId,
            @NotNull DepartmentStatus status) {
    }
}
