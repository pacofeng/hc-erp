package com.hcerp.erp.security;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

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

    @Test
    void requiresCaptchaAfterThreeFailuresFromTheSameIp() {
        LoginProtectionService protection = new LoginProtectionService(10, 600);

        protection.recordFailure("login", "first-account", "127.0.0.1");
        protection.recordFailure("login", "second-account", "127.0.0.1");
        assertFalse(protection.requiresCaptcha("login", "127.0.0.1"));

        protection.recordFailure("login", "third-account", "127.0.0.1");

        assertTrue(protection.requiresCaptcha("login", "127.0.0.1"));
        assertFalse(protection.requiresCaptcha("login", "127.0.0.2"));
    }
}
