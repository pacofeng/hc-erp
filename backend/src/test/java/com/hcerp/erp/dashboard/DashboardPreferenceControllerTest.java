package com.hcerp.erp.dashboard;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import tools.jackson.databind.ObjectMapper;
import com.hcerp.erp.account.Account;
import com.hcerp.erp.security.ErpUserDetails;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class DashboardPreferenceControllerTest {
    private final DashboardPreferenceRepository repository = mock(DashboardPreferenceRepository.class);
    private final DashboardPreferenceController controller = new DashboardPreferenceController(repository, new ObjectMapper());
    private final UUID accountId = UUID.randomUUID();
    private final ErpUserDetails user = new ErpUserDetails(account(accountId), List.of());

    @Test void returnsEmptyPreferencesWhenAccountHasNoSavedConfiguration() {
        when(repository.findById(accountId)).thenReturn(Optional.empty());

        var response = controller.get(user);

        assertEquals(List.of(), response.panels());
        assertEquals(List.of(), response.collapsedPanels());
    }

    @Test void savesOnlyKnownPanelsAndCollapsedVisiblePanels() {
        when(repository.findById(accountId)).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var response = controller.update(
                user,
                new DashboardPreferenceController.DashboardPreferenceRequest(
                        List.of("orders", "employees", "orders", "unknown"),
                        List.of("employees", "unknown")));

        assertEquals(List.of("orders", "employees"), response.panels());
        assertEquals(List.of("employees"), response.collapsedPanels());
        verify(repository).findById(accountId);
    }

    private static Account account(UUID id) {
        Account account = new Account();
        account.id = id;
        return account;
    }
}
