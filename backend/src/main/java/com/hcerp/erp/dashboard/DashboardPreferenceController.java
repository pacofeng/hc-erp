package com.hcerp.erp.dashboard;

import java.util.LinkedHashSet;
import java.util.List;
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
@RequestMapping("/api/dashboard/preferences")
public class DashboardPreferenceController {
    private static final Set<String> VALID_PANELS = Set.of("employees", "orders");

    private final DashboardPreferenceRepository preferences;
    private final ObjectMapper objectMapper;

    public DashboardPreferenceController(
            DashboardPreferenceRepository preferences,
            ObjectMapper objectMapper) {
        this.preferences = preferences;
        this.objectMapper = objectMapper;
    }

    @GetMapping
    public DashboardPreferenceResponse get(@AuthenticationPrincipal ErpUserDetails user) {
        return preferences.findById(user.accountId())
                .map(this::toResponse)
                .orElseGet(DashboardPreferenceResponse::empty);
    }

    @PutMapping
    @Transactional
    public DashboardPreferenceResponse update(
            @AuthenticationPrincipal ErpUserDetails user,
            @Valid @RequestBody DashboardPreferenceRequest request) {
        List<String> panels = sanitize(request.panels());
        Set<String> panelSet = Set.copyOf(panels);
        List<String> collapsedPanels = sanitize(request.collapsedPanels()).stream()
                .filter(panelSet::contains)
                .toList();
        DashboardPreference preference = preferences.findById(user.accountId())
                .orElseGet(DashboardPreference::new);
        preference.accountId = user.accountId();
        preference.panels = write(panels);
        preference.collapsedPanels = write(collapsedPanels);
        return toResponse(preferences.save(preference));
    }

    private DashboardPreferenceResponse toResponse(DashboardPreference preference) {
        return new DashboardPreferenceResponse(read(preference.panels), read(preference.collapsedPanels));
    }

    private List<String> sanitize(List<String> values) {
        return new LinkedHashSet<>(values).stream()
                .filter(VALID_PANELS::contains)
                .toList();
    }

    private List<String> read(String value) {
        try {
            return sanitize(objectMapper.readValue(value, new TypeReference<List<String>>() { }));
        } catch (JacksonException exception) {
            return List.of();
        }
    }

    private String write(List<String> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JacksonException exception) {
            throw new IllegalStateException("无法保存仪表盘配置", exception);
        }
    }

    public record DashboardPreferenceRequest(
            @NotNull List<String> panels,
            @NotNull List<String> collapsedPanels) {
    }

    public record DashboardPreferenceResponse(List<String> panels, List<String> collapsedPanels) {
        static DashboardPreferenceResponse empty() {
            return new DashboardPreferenceResponse(List.of(), List.of());
        }
    }
}
