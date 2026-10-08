package com.hcerp.erp.preference;

import java.util.LinkedHashMap;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.security.ErpUserDetails;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import tools.jackson.core.JacksonException;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/table-preferences")
public class TablePreferenceController {
    private static final Set<String> VALID_TABLES = Set.of(
            "employees", "departments", "accounts", "roles", "permissions",
            "customers", "products", "orders", "notifications");
    private static final int MAX_HIDDEN_COLUMNS_PER_TABLE = 30;
    private static final int MAX_COLUMNS_PER_TABLE = 40;

    private final TablePreferenceRepository preferences;
    private final ObjectMapper objectMapper;

    public TablePreferenceController(TablePreferenceRepository preferences, ObjectMapper objectMapper) {
        this.preferences = preferences;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public TablePreferenceResponse get(@AuthenticationPrincipal ErpUserDetails user) {
        return preferences.findById(user.accountId())
                .map(this::toResponse)
                .orElseGet(TablePreferenceResponse::empty);
    }

    @PutMapping
    @Transactional
    public TablePreferenceResponse update(
            @AuthenticationPrincipal ErpUserDetails user,
            @Valid @RequestBody TablePreferenceRequest request) {
        TablePreference preference = preferences.findById(user.accountId())
                .orElseGet(TablePreference::new);
        preference.accountId = user.accountId();
        preference.columnVisibility = writeVisibility(sanitizeVisibility(request.columnVisibility()));
        preference.columnOrder = writeOrder(sanitizeOrder(request.columnOrder()));
        return toResponse(preferences.save(preference));
    }

    private TablePreferenceResponse toResponse(TablePreference preference) {
        return new TablePreferenceResponse(readVisibility(preference.columnVisibility), readOrder(preference.columnOrder));
    }

    private Map<String, Map<String, Boolean>> readVisibility(String value) {
        try {
            return sanitizeVisibility(objectMapper.readValue(value, new TypeReference<Map<String, Map<String, Boolean>>>() { }));
        } catch (JacksonException exception) {
            return Map.of();
        }
    }

    private Map<String, List<String>> readOrder(String value) {
        try {
            return sanitizeOrder(objectMapper.readValue(value, new TypeReference<Map<String, List<String>>>() { }));
        } catch (JacksonException exception) {
            return Map.of();
        }
    }

    private String writeVisibility(Map<String, Map<String, Boolean>> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法保存表格列配置", exception);
        }
    }

    private String writeOrder(Map<String, List<String>> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法保存表格列配置", exception);
        }
    }

    private Map<String, Map<String, Boolean>> sanitizeVisibility(Map<String, Map<String, Boolean>> values) {
        Map<String, Map<String, Boolean>> result = new LinkedHashMap<>();
        if (values == null) return result;
        values.forEach((table, columns) -> {
            if (!VALID_TABLES.contains(table) || columns == null) return;
            Map<String, Boolean> hiddenColumns = new LinkedHashMap<>();
            columns.forEach((column, visible) -> {
                if (hiddenColumns.size() < MAX_HIDDEN_COLUMNS_PER_TABLE
                        && column != null
                        && column.matches("[A-Za-z_][A-Za-z0-9_]*")
                        && Boolean.FALSE.equals(visible)) {
                    hiddenColumns.put(column, false);
                }
            });
            if (!hiddenColumns.isEmpty()) result.put(table, hiddenColumns);
        });
        return result;
    }

    private Map<String, List<String>> sanitizeOrder(Map<String, List<String>> values) {
        Map<String, List<String>> result = new LinkedHashMap<>();
        if (values == null) return result;
        values.forEach((table, columns) -> {
            if (!VALID_TABLES.contains(table) || columns == null) return;
            List<String> order = new ArrayList<>();
            columns.forEach(column -> {
                if (order.size() < MAX_COLUMNS_PER_TABLE
                        && column != null
                        && column.matches("[A-Za-z_][A-Za-z0-9_]*")
                        && !order.contains(column)) {
                    order.add(column);
                }
            });
            if (!order.isEmpty()) result.put(table, order);
        });
        return result;
    }

    public record TablePreferenceRequest(
            @NotNull Map<String, Map<String, Boolean>> columnVisibility,
            @NotNull Map<String, List<String>> columnOrder) {
    }

    public record TablePreferenceResponse(
            Map<String, Map<String, Boolean>> columnVisibility,
            Map<String, List<String>> columnOrder) {
        static TablePreferenceResponse empty() {
            return new TablePreferenceResponse(Map.of(), Map.of());
        }
    }
}
