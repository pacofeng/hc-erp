package com.hcerp.erp.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

class LoginProtectionServiceTest {
    @Test
    void blocksFurtherAttemptsAfterConfiguredLimit() {
        LoginProtectionService protection = new LoginProtectionService(2, 600);

        assertDoesNotThrow(() -> protection.check("login", "admin", "127.0.0.1"));
        protection.recordFailure("login", "admin", "127.0.0.1");
        protection.recordFailure("login", "admin", "127.0.0.1");

        assertThrows(ResponseStatusException.class,
                () -> protection.check("login", "admin", "127.0.0.1"));
    }
}
