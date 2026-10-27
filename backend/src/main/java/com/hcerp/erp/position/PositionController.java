package com.hcerp.erp.position;

import java.util.Comparator;
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

import com.hcerp.erp.common.Enums.DepartmentStatus;
import com.hcerp.erp.common.NotFoundException;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

@RestController
@RequestMapping("/api/positions")
public class PositionController {
    private final PositionRepository positions;

    public PositionController(PositionRepository positions) {
        this.positions = positions;
    }

    @GetMapping
    @PreAuthorize("hasAuthority('POSITION_VIEW') or hasRole('SYSTEM_ADMIN')")
    public List<Position> list() {
        return sortOtherLast(positions.findAll());
    }

    @GetMapping("/active")
    @PreAuthorize("hasAnyAuthority('POSITION_VIEW', 'EMPLOYEE_VIEW', 'EMPLOYEE_CREATE', 'EMPLOYEE_EDIT') or hasRole('SYSTEM_ADMIN')")
    public List<Position> activePositions() {
        return sortOtherLast(positions.findByStatusOrderByNameAsc(DepartmentStatus.ACTIVE));
    }

    @PostMapping
    @PreAuthorize("hasAuthority('POSITION_CREATE') or hasRole('SYSTEM_ADMIN')")
    public Position create(@Valid @RequestBody PositionRequest request) {
        Position position = new Position();
        apply(position, request);
        return positions.save(position);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('POSITION_EDIT') or hasRole('SYSTEM_ADMIN')")
    public Position update(@PathVariable UUID id, @Valid @RequestBody PositionRequest request) {
        Position position = positions.findById(id).orElseThrow(() -> new NotFoundException("Position not found"));
        apply(position, request);
        return positions.save(position);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('POSITION_DELETE') or hasRole('SYSTEM_ADMIN')")
    public void delete(@PathVariable UUID id) {
        if (!positions.existsById(id)) {
            throw new NotFoundException("Position not found");
        }
        positions.deleteById(id);
    }

    private void apply(Position position, PositionRequest request) {
        position.name = request.name().trim();
        position.description = request.description();
        position.status = request.status();
    }

    private List<Position> sortOtherLast(List<Position> values) {
        return values.stream()
                .sorted(Comparator.comparing((Position position) -> isOther(position.name))
                        .thenComparing(position -> position.name, Comparator.nullsLast(String::compareTo)))
                .toList();
    }

    private boolean isOther(String name) {
        return "其它".equals(name) || "其他".equals(name);
    }

    public record PositionRequest(
            @NotBlank String name,
            String description,
            @NotNull DepartmentStatus status) {
    }
}
