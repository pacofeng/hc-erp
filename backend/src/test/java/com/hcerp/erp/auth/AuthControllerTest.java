package com.hcerp.erp.auth;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.UUID;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.security.AuthenticationCookieService;
import com.hcerp.erp.security.ErpUserDetails;
import com.hcerp.erp.security.JwtService;
import com.hcerp.erp.security.LoginProtectionService;

import jakarta.servlet.http.HttpServletResponse;

class AuthControllerTest {
    @Test
    void rejectsPasswordChangeWhenCurrentPasswordDoesNotMatch() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AccountRepository accounts = mock(AccountRepository.class);
        Account account = account();
        when(encoder.matches("wrong-password", account.passwordHash)).thenReturn(false);
        AuthController controller = controller(accounts, encoder);

        ResponseStatusException exception = assertThrows(ResponseStatusException.class,
                () -> controller.changePassword(new ErpUserDetails(account, java.util.List.of()),
                        new AuthController.ChangePasswordRequest("wrong-password", "Newpassword1!", "Newpassword1!"),
                        mock(HttpServletResponse.class)));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatusCode());
        verify(accounts, never()).save(account);
    }

    @Test
    void changesPasswordAndInvalidatesExistingSessionsWhenCurrentPasswordMatches() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AccountRepository accounts = mock(AccountRepository.class);
        Account account = account();
        when(encoder.matches("current-password", account.passwordHash)).thenReturn(true);
        when(encoder.encode("Newpassword1!")).thenReturn("new-password-hash");
        AuthController controller = controller(accounts, encoder);

        controller.changePassword(new ErpUserDetails(account, java.util.List.of()),
                new AuthController.ChangePasswordRequest("current-password", "Newpassword1!", "Newpassword1!"),
                mock(HttpServletResponse.class));

        assertEquals("new-password-hash", account.passwordHash);
        assertEquals(3, account.passwordVersion);
        verify(accounts).save(account);
    }

    @Test
    void changesSecurityQuestionsAfterVerifyingCurrentPasswordAndClearsResetToken() {
        PasswordEncoder encoder = mock(PasswordEncoder.class);
        AccountRepository accounts = mock(AccountRepository.class);
        Account account = account();
        account.passwordResetTokenHash = "reset-token-hash";
        account.passwordResetTokenExpiresAt = java.time.OffsetDateTime.now().plusMinutes(10);
        when(encoder.matches("current-password", account.passwordHash)).thenReturn(true);
        when(encoder.encode(org.mockito.ArgumentMatchers.anyString())).thenReturn("answer-hash");
        AuthController controller = controller(accounts, encoder);

        controller.changeSecurityQuestions(
                new ErpUserDetails(account, List.of()),
                new AuthController.ChangeSecurityQuestionsRequest("current-password", List.of(
                        new AuthController.SecurityQuestionAnswer("What city were you born in?", "Guangzhou"),
                        new AuthController.SecurityQuestionAnswer("What was the name of your first school?", "No. 1 School"),
                        new AuthController.SecurityQuestionAnswer("What was your childhood nickname?", "Little Feng"))));

        assertEquals("BIRTH_CITY", account.securityQuestion1);
        assertEquals("FIRST_SCHOOL", account.securityQuestion2);
        assertEquals("CHILDHOOD_NICKNAME", account.securityQuestion3);
        assertEquals("answer-hash", account.securityAnswerHash1);
        assertNull(account.passwordResetTokenHash);
        assertNull(account.passwordResetTokenExpiresAt);
        verify(accounts).save(account);
    }

    private static AuthController controller(AccountRepository accounts, PasswordEncoder encoder) {
        return new AuthController(
                mock(AuthenticationManager.class),
                new JwtService("test-signing-key-must-be-at-least-thirty-two-characters", 30),
                accounts,
                encoder,
                new SecurityQuestionService(encoder),
                new AuthenticationCookieService(false, "Lax", "", 30),
                new LoginProtectionService(10, 600, 300),
                new LoginCaptchaService(),
                new AccountActivationService());
    }

    private static Account account() {
        Account account = new Account();
        account.id = UUID.randomUUID();
        account.username = "demo-user";
        account.passwordHash = "current-password-hash";
        account.passwordVersion = 2;
        return account;
    }
}
