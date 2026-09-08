package com.hcerp.erp.role;

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

import com.hcerp.erp.common.Enums.RoleStatus;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

@RestController
@RequestMapping("/api/roles")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class RoleController {
    private final RoleRepository roles;

    public RoleController(RoleRepository roles) {
        this.roles = roles;
    }

    @GetMapping
    public List<Role> list() {
        return roles.findAll();
    }

    @PostMapping
    public Role create(@Valid @RequestBody RoleRequest request) {
        String code = request.code().trim().toUpperCase();
        if (roles.existsByCode(code)) {
            throw new IllegalArgumentException("Role code already exists");
        }
        Role role = new Role();
        apply(role, request);
        return roles.save(role);
    }

    @PutMapping("/{id}")
    public Role update(@PathVariable UUID id, @Valid @RequestBody RoleRequest request) {
        Role role = roles.findById(id).orElseThrow(() -> new NotFoundException("Role not found"));
        String code = request.code().trim().toUpperCase();
        if (roles.existsByCodeAndIdNot(code, id)) {
            throw new IllegalArgumentException("Role code already exists");
        }
        apply(role, request);
        return roles.save(role);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        if (!roles.existsById(id)) {
            throw new NotFoundException("Role not found");
        }
        roles.deleteById(id);
    }

    private void apply(Role role, RoleRequest request) {
        role.name = request.name().trim();
        role.code = request.code().trim().toUpperCase();
        role.status = request.status();
        role.description = request.description();
    }

    public record RoleRequest(
            @NotBlank String name,
            @NotBlank @Pattern(regexp = "^[A-Z_]+$", message = "Code can only contain uppercase letters and underscores")
            String code,
            @NotNull RoleStatus status,
            String description) {
    }
}
