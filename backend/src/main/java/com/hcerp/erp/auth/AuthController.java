package com.hcerp.erp.auth;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.common.NotFoundException;
import com.hcerp.erp.security.ErpUserDetails;
import com.hcerp.erp.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;
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

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AccountRepository accounts,
                          PasswordEncoder passwordEncoder, SecurityQuestionService securityQuestionService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.securityQuestionService = securityQuestionService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest) {
        var auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));
        ErpUserDetails user = (ErpUserDetails) auth.getPrincipal();
        var account = user.account();
        account.lastLoginAt = OffsetDateTime.now();
        account.lastLoginIp = servletRequest.getRemoteAddr();
        account.failedLoginCount = 0;
        accounts.save(account);
        return Map.of(
                "token", jwtService.createToken(user),
                "accountId", account.id,
                "username", account.username,
                "language", account.preferredLanguage,
                "securityQuestionsConfigured", Boolean.TRUE.equals(account.securityQuestionsConfigured),
                "authorities", user.getAuthorities().stream().map(Object::toString).toList());
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal ErpUserDetails user) {
        return Map.of(
                "accountId", user.accountId(),
                "username", user.getUsername(),
                "employeeId", user.account().employeeId == null ? "" : user.account().employeeId,
                "language", user.account().preferredLanguage,
                "securityQuestionsConfigured", Boolean.TRUE.equals(user.account().securityQuestionsConfigured),
                "authorities", user.getAuthorities().stream().map(Object::toString).toList());
    }

    @PutMapping("/language")
    public Map<String, Object> updateLanguage(@AuthenticationPrincipal ErpUserDetails user,
                                              @Valid @RequestBody LanguageRequest request) {
        if (!request.language().equals("en") && !request.language().equals("zh-CN")) {
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
            @Valid @RequestBody ForgotPasswordQuestionsRequest request) {
        var account = accounts.findByUsername(request.username())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        if (!Boolean.TRUE.equals(account.securityQuestionsConfigured)) {
            throw new IllegalArgumentException("Security questions are not configured for this account");
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
            @Valid @RequestBody ForgotPasswordVerifyRequest request) {
        var account = accounts.findByUsername(request.username())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        if (!Boolean.TRUE.equals(account.securityQuestionsConfigured)) {
            throw new IllegalArgumentException("Security questions are not configured for this account");
        }
        String expectedAnswerHash = switch (request.questionIndex()) {
            case 0 -> account.securityAnswerHash1;
            case 1 -> account.securityAnswerHash2;
            case 2 -> account.securityAnswerHash3;
            default -> throw new IllegalArgumentException("Unsupported security question");
        };
        if (!securityQuestionService.matchesAnswer(request.answer(), expectedAnswerHash)) {
            throw new IllegalArgumentException("Security answers are incorrect");
        }
        String resetToken = securityQuestionService.createResetToken(account);
        accounts.save(account);
        return Map.of("resetToken", resetToken);
    }

    @PostMapping("/forgot-password/reset")
    public Map<String, Object> resetForgottenPassword(@Valid @RequestBody ForgotPasswordResetRequest request) {
        validatePasswordStrength(request.newPassword(), request.confirmPassword());
        var account = accounts.findByUsername(request.username())
                .orElseThrow(() -> new NotFoundException("Account not found"));
        if (!securityQuestionService.matchesResetToken(account, request.resetToken())) {
            throw new IllegalArgumentException("Reset token is invalid or expired");
        }
        account.passwordHash = passwordEncoder.encode(request.newPassword());
        account.passwordChangedAt = OffsetDateTime.now();
        account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
        securityQuestionService.clearResetToken(account);
        accounts.save(account);
        return Map.of("success", true);
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
}
