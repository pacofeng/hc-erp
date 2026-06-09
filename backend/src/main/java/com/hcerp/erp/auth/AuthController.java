package com.hcerp.erp.auth;

import java.time.OffsetDateTime;
import java.util.Map;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.security.ErpUserDetails;
import com.hcerp.erp.security.JwtService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final AccountRepository accounts;

    public AuthController(AuthenticationManager authenticationManager, JwtService jwtService, AccountRepository accounts) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.accounts = accounts;
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
                "authorities", user.getAuthorities().stream().map(Object::toString).toList());
    }

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal ErpUserDetails user) {
        return Map.of(
                "accountId", user.accountId(),
                "username", user.getUsername(),
                "employeeId", user.account().employeeId == null ? "" : user.account().employeeId,
                "language", user.account().preferredLanguage,
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

    public record LoginRequest(@NotBlank String username, @NotBlank String password) {
    }

    public record LanguageRequest(@NotBlank String language) {
    }
}
