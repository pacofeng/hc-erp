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
import com.hcerp.erp.security.ClientIpResolver;
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
    private final LoginCaptchaService loginCaptcha;
    private final AccountActivationService accountActivationService;
    private final ClientIpResolver clientIpResolver;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AccountRepository accounts,
                          PasswordEncoder passwordEncoder, SecurityQuestionService securityQuestionService,
                          AuthenticationCookieService authenticationCookieService, LoginProtectionService loginProtection,
                          LoginCaptchaService loginCaptcha, AccountActivationService accountActivationService,
                          ClientIpResolver clientIpResolver) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.accounts = accounts;
        this.passwordEncoder = passwordEncoder;
        this.securityQuestionService = securityQuestionService;
        this.authenticationCookieService = authenticationCookieService;
        this.loginProtection = loginProtection;
        this.loginCaptcha = loginCaptcha;
        this.accountActivationService = accountActivationService;
        this.clientIpResolver = clientIpResolver;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginRequest request, HttpServletRequest servletRequest,
                                     HttpServletResponse servletResponse) {
        String clientIp = clientIp(servletRequest);
        loginProtection.check("login", request.username(), clientIp);
        if (loginProtection.requiresCaptcha("login", clientIp)
                && !loginCaptcha.verify(request.captchaChallengeId(), request.captchaAnswer(), clientIp)) {
            loginProtection.recordFailure("login", request.username(), clientIp);
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "验证码错误或已过期");
        }
        var auth = authenticate(request, clientIp);
        ErpUserDetails user = (ErpUserDetails) auth.getPrincipal();
        var account = user.account();
        account.lastLoginAt = OffsetDateTime.now();
        account.lastLoginIp = clientIp;
        accounts.save(account);
        return sessionResponse(user, servletResponse);
    }

    @GetMapping("/login-protection")
    public LoginProtectionResponse loginProtection(HttpServletRequest servletRequest) {
        String clientIp = clientIp(servletRequest);
        return new LoginProtectionResponse(loginProtection.requiresCaptcha("login", clientIp));
    }

    @GetMapping("/login-captcha")
    public LoginCaptchaService.CaptchaChallenge loginCaptcha(HttpServletRequest servletRequest) {
        String clientIp = clientIp(servletRequest);
        loginProtection.check("login", clientIp);
        if (!loginProtection.requiresCaptcha("login", clientIp)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前无需验证码");
        }
        return loginCaptcha.create(clientIp);
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
        var account = user.account();
        if (!passwordEncoder.matches(request.currentPassword(), account.passwordHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前密码错误");
        }
        validatePasswordStrength(request.newPassword(), request.confirmPassword());
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
        var account = user.account();
        applySecurityQuestions(account, request.answers());
        accounts.save(account);
        return Map.of("securityQuestionsConfigured", true);
    }

    @PutMapping("/change-security-questions")
    public Map<String, Object> changeSecurityQuestions(@AuthenticationPrincipal ErpUserDetails user,
                                                        @Valid @RequestBody ChangeSecurityQuestionsRequest request) {
        var account = user.account();
        if (!passwordEncoder.matches(request.currentPassword(), account.passwordHash)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "当前密码错误");
        }
        applySecurityQuestions(account, request.answers());
        securityQuestionService.clearResetToken(account);
        accounts.save(account);
        return Map.of("securityQuestionsConfigured", true);
    }

    @PostMapping("/account-activation/verify")
    public AccountActivationVerification verifyAccountActivation(
            @Valid @RequestBody AccountActivationTokenRequest request) {
        var account = accountActivationService.requirePendingActivation(accounts, request.token());
        return new AccountActivationVerification(account.username, account.username == null);
    }

    @PostMapping("/account-activation")
    public Map<String, Object> activateAccount(@Valid @RequestBody AccountActivationRequest request) {
        var account = accountActivationService.requirePendingActivation(accounts, request.token());
        if (account.username == null) {
            if (request.username() == null || request.username().isBlank()) {
                throw new IllegalArgumentException("请输入用户名");
            }
            String username = request.username().trim();
            if (accounts.existsByUsername(username)) {
                throw new IllegalArgumentException("用户名已被使用");
            }
            account.username = username;
        } else if (request.username() != null && !request.username().isBlank()
                && !account.username.equals(request.username().trim())) {
            throw new IllegalArgumentException("激活时不能修改用户名");
        }
        validatePasswordStrength(request.password(), request.confirmPassword());
        if (request.answers().stream().map(SecurityQuestionAnswer::question).distinct().count() < 3
                || request.answers().stream().anyMatch(answer -> answer.answer().isBlank())) {
            throw new IllegalArgumentException("请设置三个不同的安全问题及答案");
        }
        account.securityQuestion1 = securityQuestionService.questionCode(request.answers().get(0).question());
        account.securityAnswerHash1 = securityQuestionService.hashAnswer(request.answers().get(0).answer());
        account.securityQuestion2 = securityQuestionService.questionCode(request.answers().get(1).question());
        account.securityAnswerHash2 = securityQuestionService.hashAnswer(request.answers().get(1).answer());
        account.securityQuestion3 = securityQuestionService.questionCode(request.answers().get(2).question());
        account.securityAnswerHash3 = securityQuestionService.hashAnswer(request.answers().get(2).answer());
        account.securityQuestionsConfigured = true;
        account.passwordHash = passwordEncoder.encode(request.password());
        account.passwordChangedAt = OffsetDateTime.now();
        account.passwordVersion = account.passwordVersion == null ? 1 : account.passwordVersion + 1;
        account.status = AccountStatus.ACTIVE;
        account.mustChangePassword = false;
        account.activatedAt = OffsetDateTime.now();
        accountActivationService.clear(account);
        accounts.save(account);
        return Map.of("success", true);
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

    private void recordFailedLogin(String username, String clientIp) {
        loginProtection.recordFailure("login", username, clientIp);
        accounts.findByUsername(username).ifPresent(account -> {
            int failedAttempts = (account.failedLoginCount == null ? 0 : account.failedLoginCount) + 1;
            account.failedLoginCount = failedAttempts;
            accounts.save(account);
        });
    }

    private ResponseStatusException failedForgotPassword(String username, String clientIp) {
        loginProtection.recordFailure("forgot-password", username, clientIp);
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, "账号或安全问题验证失败");
    }

    private String clientIp(HttpServletRequest request) {
        return clientIpResolver.resolve(request);
    }

    private void applySecurityQuestions(com.hcerp.erp.account.Account account,
                                        List<SecurityQuestionAnswer> answers) {
        if (answers.size() != 3) {
            throw new IllegalArgumentException("必须设置 3 个安全问题");
        }
        var selectedQuestions = answers.stream().map(SecurityQuestionAnswer::question).distinct().toList();
        if (selectedQuestions.size() != 3) {
            throw new IllegalArgumentException("安全问题不能重复");
        }
        for (SecurityQuestionAnswer answer : answers) {
            securityQuestionService.questionCode(answer.question());
            if (answer.answer() == null || answer.answer().trim().isBlank()) {
                throw new IllegalArgumentException("请输入安全问题答案");
            }
        }
        account.securityQuestion1 = securityQuestionService.questionCode(answers.get(0).question());
        account.securityAnswerHash1 = securityQuestionService.hashAnswer(answers.get(0).answer());
        account.securityQuestion2 = securityQuestionService.questionCode(answers.get(1).question());
        account.securityAnswerHash2 = securityQuestionService.hashAnswer(answers.get(1).answer());
        account.securityQuestion3 = securityQuestionService.questionCode(answers.get(2).question());
        account.securityAnswerHash3 = securityQuestionService.hashAnswer(answers.get(2).answer());
        account.securityQuestionsConfigured = true;
    }

    private void validatePasswordStrength(String newPassword, String confirmPassword) {
        if (!newPassword.equals(confirmPassword)) {
            throw new IllegalArgumentException("两次输入的密码不一致");
        }
        boolean hasLetter = newPassword.chars().anyMatch(Character::isLetter);
        boolean hasDigit = newPassword.chars().anyMatch(Character::isDigit);
        boolean hasSpecial = newPassword.chars().anyMatch(ch -> !Character.isLetterOrDigit(ch));
        if (newPassword.length() < 8 || !(hasLetter && hasDigit && hasSpecial)) {
            throw new IllegalArgumentException(
                    "密码至少需要 8 位，并包含字母、数字和特殊字符");
        }
    }

    public record LoginRequest(@NotBlank(message = "请输入用户名") String username, @NotBlank(message = "请输入密码") String password,
                               String captchaChallengeId, String captchaAnswer) {
    }

    public record LoginProtectionResponse(boolean captchaRequired) {
    }

    public record AccountActivationVerification(String username, boolean usernameEditable) {
    }

    public record LanguageRequest(@NotBlank(message = "请选择语言") String language) {
    }

    public record SecurityQuestionAnswer(@NotBlank(message = "请选择安全问题") String question,
                                         @NotBlank(message = "请输入安全问题答案") String answer) {
    }

    public record SecurityQuestionSetupRequest(@NotNull @Size(min = 3) List<@Valid SecurityQuestionAnswer> answers) {
    }

    public record ChangeSecurityQuestionsRequest(@NotBlank(message = "请输入当前密码") String currentPassword,
                                                 @NotNull @Size(min = 3) List<@Valid SecurityQuestionAnswer> answers) {
    }

    public record ForgotPasswordQuestionsRequest(@NotBlank(message = "请输入用户名") String username) {
    }

    public record ForgotPasswordQuestionsResponse(Integer questionIndex, String question) {
    }

    public record ForgotPasswordVerifyRequest(@NotBlank(message = "请输入用户名") String username,
                                              @NotNull(message = "请选择安全问题") Integer questionIndex,
                                              @NotBlank(message = "请输入安全问题答案") String answer) {
    }

    public record ForgotPasswordResetRequest(@NotBlank(message = "请输入用户名") String username,
                                             @NotBlank(message = "重置凭证无效") String resetToken,
                                             @NotBlank(message = "请输入新密码") String newPassword,
                                             @NotBlank(message = "请再次输入确认密码") String confirmPassword) {
    }

    public record ChangePasswordRequest(@NotBlank(message = "请输入当前密码") String currentPassword,
                                        @NotBlank(message = "请输入新密码") String newPassword,
                                        @NotBlank(message = "请再次输入确认密码") String confirmPassword) {
    }

    public record AccountActivationTokenRequest(@NotBlank(message = "激活链接无效或已失效") String token) {
    }

    public record AccountActivationRequest(@NotBlank(message = "激活链接无效或已失效") String token, String username,
                                           @NotBlank(message = "请输入新密码") String password,
                                           @NotBlank(message = "请再次输入确认密码") String confirmPassword,
                                           @NotNull @Size(min = 3) List<@Valid SecurityQuestionAnswer> answers) {
    }
}
