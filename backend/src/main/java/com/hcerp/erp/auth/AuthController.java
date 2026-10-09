package com.hcerp.erp.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.common.Enums.AccountStatus;
import com.hcerp.erp.security.AuthenticationCookieService;
import com.hcerp.erp.security.ErpUserDetails;
import com.hcerp.erp.security.JwtService;
import com.hcerp.erp.security.LoginProtectionService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AccountRepository accounts;
    private final PasswordEncoder passwordEncoder;
    private final SecurityQuestionService securityQuestionService;
    private final AuthenticationCookieService authenticationCookieService;
    private final LoginProtectionService loginProtection;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AccountRepository accounts,
                          PasswordEncoder passwordEncoder, SecurityQuestionService securityQuestionService,
                          AuthenticationCookieService authenticationCookieService, LoginProtectionService loginProtection) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.securityQuestionService = securityQuestionService;
        this.authenticationCookieService = authenticationCookieService;
        this.loginProtection = loginProtection;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest,
                                     HttpServletResponse servletResponse) {
        String clientIp = clientIp(servletRequest);
        loginProtection.check("login", request.username(), clientIp);
        unlockIfExpired(request.username());
        var auth = authenticate(request, clientIp);
        ErpUserDetails user = (ErpUserDetails) auth.getPrincipal();
        var account = user.account();
        account.lastLoginAt = OffsetDateTime.now();
        account.lastLoginIp = servletRequest.getRemoteAddr();
        account.failedLoginCount = 0;
        accounts.save(account);
        return sessionResponse(user, servletResponse);
    }

    @GetMapping("/csrf")
    public Map<String, String> csrf(CsrfToken csrfToken) {
        return Map.of("token", csrfToken.getToken());
    }

    @PostMapping("/logout")
    public void logout(HttpServletResponse servletResponse) {
        authenticationCookieService.clear(servletResponse);
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal ErpUserDetails user) {
        return sessionPayload(user);
    }

    @GetMapping("/session")
    public ResponseEntity<Map<String, Object>> session(@AuthenticationPrincipal ErpUserDetails user) {
        if (user == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(sessionPayload(user));
    }

    private Map<String, Object> sessionPayload(ErpUserDetails user) {
        return Map.of(
                "accountId", user.accountId(),
                "username", user.getUsername(),
                "employeeId", user.account().employeeId == null ? "" : user.account().employeeId,
                "language", user.account().preferredLanguage,
                "mustChangePassword", Boolean.TRUE.equals(user.account().mustChangePassword),
                "securityQuestionsConfigured", Boolean.TRUE.equals(user.account().securityQuestionsConfigured),
                "authorities", user.getAuthorities().stream().map(Object::toString).toList());
    }

    @PutMapping("/change-password")
    public Map<String, Object> changePassword(@AuthenticationPrincipal ErpUserDetails user,
                                              @Valid @RequestBody ChangePasswordRequest request,
                                              HttpServletResponse servletResponse) {
        validatePasswordStrength(request.newPassword(), request.confirmPassword());
        var account = user.account();
        account.passwordHash = passwordEncoder.encode(request.newPassword());
        account.passwordChangedAt = OffsetDateTime.now();
        account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
        account.mustChangePassword = false;
        accounts.save(account);
        return sessionResponse(user, servletResponse);
    }

    @PutMapping("/language")
    public Map<String, Object> updateLanguage(@AuthenticationPrincipal ErpUserDetails user,
                                              @Valid @RequestBody LanguageRequest request) {
        if (!request.language().equals("zh-CN")) {
            throw new IllegalArgumentException("Unsupported language");
        }
        var account = user.account();
        account.preferredLanguage = request.language();
        accounts.save(account);
        return Map.of("language", account.preferredLanguage);
    }

    @GetMapping("/security-questions/options")
    public Map<String, Object> securityQuestionOptions() {
        return Map.of("questions", securityQuestionService.questionTexts());
    }

    @PutMapping("/security-questions")
    public Map<String, Object> updateSecurityQuestions(@AuthenticationPrincipal ErpUserDetails user,
                                                       @Valid @RequestBody SecurityQuestionSetupRequest request) {
        if (request.answers().size() < 3) {
            throw new IllegalArgumentException("At least 3 security questions are required");
        }
        var selectedQuestions = request.answers().stream().map(SecurityQuestionAnswer::question).distinct().toList();
        if (selectedQuestions.size() < 3) {
            throw new IllegalArgumentException("Security questions must be unique");
        }
        for (SecurityQuestionAnswer answer : request.answers()) {
            securityQuestionService.questionCode(answer.question());
            if (answer.answer() == null || answer.answer().trim().isBlank()) {
                throw new IllegalArgumentException("Security question answers are required");
            }
        }
        var account = user.account();
        account.securityQuestion1 = securityQuestionService.questionCode(request.answers().get(0).question());
        account.securityAnswerHash1 = securityQuestionService.hashAnswer(request.answers().get(0).answer());
        account.securityQuestion2 = securityQuestionService.questionCode(request.answers().get(1).question());
        account.securityAnswerHash2 = securityQuestionService.hashAnswer(request.answers().get(1).answer());
        account.securityQuestion3 = securityQuestionService.questionCode(request.answers().get(2).question());
        account.securityAnswerHash3 = securityQuestionService.hashAnswer(request.answers().get(2).answer());
        account.securityQuestionsConfigured = true;
        accounts.save(account);
        return Map.of("securityQuestionsConfigured", true);
    }

    @PostMapping("/forgot-password/questions")
    public ForgotPasswordQuestionsResponse forgotPasswordQuestions(
            @Valid @RequestBody ForgotPasswordQuestionsRequest request, HttpServletRequest servletRequest) {
        String clientIp = clientIp(servletRequest);
        loginProtection.check("forgot-password", request.username(), clientIp);
        var account = accounts.findByUsername(request.username())
                .orElseThrow(() -> failedForgotPassword(request.username(), clientIp));
        if (!Boolean.TRUE.equals(account.securityQuestionsConfigured)) {
            throw failedForgotPassword(request.username(), clientIp);
        }
        int questionIndex = ThreadLocalRandom.current().nextInt(3);
        String question = switch (questionIndex) {
            case 0 -> securityQuestionService.questionText(account.securityQuestion1);
            case 1 -> securityQuestionService.questionText(account.securityQuestion2);
            default -> securityQuestionService.questionText(account.securityQuestion3);
        };
        return new ForgotPasswordQuestionsResponse(questionIndex, question);
    }

    @PostMapping("/forgot-password/verify")
    public Map<String, Object> verifyForgotPasswordAnswers(
            @Valid @RequestBody ForgotPasswordVerifyRequest request, HttpServletRequest servletRequest) {
        String clientIp = clientIp(servletRequest);
        loginProtection.check("forgot-password", request.username(), clientIp);
        var account = accounts.findByUsername(request.username())
                .orElseThrow(() -> failedForgotPassword(request.username(), clientIp));
        if (!Boolean.TRUE.equals(account.securityQuestionsConfigured)) {
            throw failedForgotPassword(request.username(), clientIp);
        }
        String expectedAnswerHash = switch (request.questionIndex()) {
            case 0 -> account.securityAnswerHash1;
            case 1 -> account.securityAnswerHash2;
            case 2 -> account.securityAnswerHash3;
            default -> throw new IllegalArgumentException("Unsupported security question");
        };
        if (!securityQuestionService.matchesAnswer(request.answer(), expectedAnswerHash)) {
            throw failedForgotPassword(request.username(), clientIp);
        }
        String resetToken = securityQuestionService.createResetToken(account);
        accounts.save(account);
        return Map.of("resetToken", resetToken);
    }

    @PostMapping("/forgot-password/reset")
    public Map<String, Object> resetForgottenPassword(@Valid @RequestBody ForgotPasswordResetRequest request,
                                                       HttpServletRequest servletRequest) {
        String clientIp = clientIp(servletRequest);
        loginProtection.check("forgot-password", request.username(), clientIp);
        validatePasswordStrength(request.newPassword(), request.confirmPassword());
        var account = accounts.findByUsername(request.username())
                .orElseThrow(() -> failedForgotPassword(request.username(), clientIp));
        if (!securityQuestionService.matchesResetToken(account, request.resetToken())) {
            throw failedForgotPassword(request.username(), clientIp);
        }
        account.passwordHash = passwordEncoder.encode(request.newPassword());
        account.passwordChangedAt = OffsetDateTime.now();
        account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
        account.mustChangePassword = false;
        securityQuestionService.clearResetToken(account);
        accounts.save(account);
        return Map.of("success", true);
    }

    private Map<String, Object> sessionResponse(ErpUserDetails user, HttpServletResponse servletResponse) {
        authenticationCookieService.write(servletResponse, jwtService.createToken(user));
        return Map.of(
                "accountId", user.account().id,
                "username", user.account().username,
                "employeeId", user.account().employeeId == null ? "" : user.account().employeeId,
                "language", user.account().preferredLanguage,
                "mustChangePassword", Boolean.TRUE.equals(user.account().mustChangePassword),
                "securityQuestionsConfigured", Boolean.TRUE.equals(user.account().securityQuestionsConfigured),
                "authorities", user.getAuthorities().stream().map(Object::toString).toList());
    }

    private org.springframework.security.core.Authentication authenticate(LoginRequest request, String clientIp) {
        try {
            return authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        } catch (AuthenticationException exception) {
            recordFailedLogin(request.username(), clientIp);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "用户名或密码错误");
        }
    }

    private void unlockIfExpired(String username) {
        accounts.findByUsername(username).ifPresent(account -> {
            if (account.status == AccountStatus.LOCKED && account.lockedUntil != null
                    && !account.lockedUntil.isAfter(OffsetDateTime.now())) {
                account.status = AccountStatus.ACTIVE;
                account.failedLoginCount = 0;
                account.lockedUntil = null;
                accounts.save(account);
            }
        });
    }

    private void recordFailedLogin(String username, String clientIp) {
        loginProtection.recordFailure("login", username, clientIp);
        accounts.findByUsername(username).ifPresent(account -> {
            if (account.status != AccountStatus.ACTIVE) return;
            int failedAttempts = (account.failedLoginCount == null ? 0 : account.failedLoginCount) + 1;
            account.failedLoginCount = failedAttempts;
            if (failedAttempts >= 5) {
                account.status = AccountStatus.LOCKED;
                account.lockedUntil = OffsetDateTime.now().plusMinutes(15);
            }
            accounts.save(account);
        });
    }

    private ResponseStatusException failedForgotPassword(String username, String clientIp) {
        loginProtection.recordFailure("forgot-password", username, clientIp);
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "账号或安全问题验证失败");
    }

    private static String clientIp(HttpServletRequest request) {
        return request.getRemoteAddr();
    }

    private void validatePasswordStrength(String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("Passwords do not match");
        }
        boolean hasLetter = newPassword.chars().anyMatch(Character::isLetter);
        boolean hasDigit = newPassword.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = newPassword.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (newPassword.length() < 8 || !(hasLetter && hasDigit && hasSpecial)) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters and include letters, numbers, and special characters");
        }
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record LanguageRequest(@NotBlank String language) {
    }

    public record SecurityQuestionAnswer(@NotBlank String question, @NotBlank String answer) {
    }

    public record SecurityQuestionSetupRequest(@NotNull @Size(min = 3) List<@Valid SecurityQuestionAnswer> answers) {
    }

    public record ForgotPasswordQuestionsRequest(@NotBlank String username) {
    }

    public record ForgotPasswordQuestionsResponse(Integer questionIndex, String question) {
    }

    public record ForgotPasswordVerifyRequest(@NotBlank String username, @NotNull Integer questionIndex,
                                              @NotBlank String answer) {
    }

    public record ForgotPasswordResetRequest(@NotBlank String username, @NotBlank String resetToken,
                                             @NotBlank String newPassword, @NotBlank String confirmPassword) {
    }

    public record ChangePasswordRequest(@NotBlank String newPassword, @NotBlank String confirmPassword) {
    }
}
