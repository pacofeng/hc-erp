package com.hcerp.erp.permission;

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

import com.hcerp.erp.common.Enums.ModuleCode;
import com.hcerp.erp.common.Enums.PermissionCode;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/permissions")
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class PermissionController {
    private final PermissionRepository permissions;

    public PermissionController(PermissionRepository permissions) {
        this.permissions = permissions;
    }

    @GetMapping
    public List<Permission> list() {
        return permissions.findAll();
    }

    @PostMapping
    public Permission create(@Valid @RequestBody PermissionRequest request) {
        Permission permission = new Permission();
        apply(permission, request);
        return permissions.save(permission);
    }

    @PutMapping("/{id}")
    public Permission update(@PathVariable UUID id, @Valid @RequestBody PermissionRequest request) {
        Permission permission = permissions.findById(id).orElseThrow(() -> new NotFoundException("Permission not found"));
        apply(permission, request);
        return permissions.save(permission);
    }

    @DeleteMapping("/{id}")
    @Transactional
    public void delete(@PathVariable UUID id) {
        if (!permissions.existsById(id)) {
            throw new NotFoundException("Permission not found");
        }
        permissions.deleteById(id);
    }

    private void apply(Permission permission, PermissionRequest request) {
        permission.code = request.code();
        permission.name = request.name();
        permission.description = request.description();
        permission.moduleCode = request.moduleCode();
    }

    public record PermissionRequest(@NotNull PermissionCode code, @NotBlank String name, String description,
                                    @NotNull ModuleCode moduleCode) {
    }
}
