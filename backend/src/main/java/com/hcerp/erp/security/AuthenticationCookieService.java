package com.hcerp.erp.security;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;

import jakarta.servlet.http.HttpServletResponse;

@Service
public class AuthenticationCookieService {
    public static final String COOKIE_NAME = "HCERP_SESSION";

    private final boolean secure;
    private final String sameSite;
    private final String domain;
    private final long expirationMinutes;

    public AuthenticationCookieService(
            @Value("${app.security.cookie.secure:false}") boolean secure,
            @Value("${app.security.cookie.same-site:Lax}") String sameSite,
            @Value("${app.security.cookie.domain:}") String domain,
            @Value("${app.jwt.expiration-minutes:30}") long expirationMinutes) {
        this.secure = secure;
        this.sameSite = sameSite;
        this.domain = domain;
        this.expirationMinutes = expirationMinutes;
    }

    public void write(HttpServletResponse response, String token) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie(token, Duration.ofMinutes(expirationMinutes)).toString());
    }

    public void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, cookie("", Duration.ZERO).toString());
    }

    private ResponseCookie cookie(String value, Duration maxAge) {
        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie.from(COOKIE_NAME, value)
                .httpOnly(true)
                .secure(secure)
                .sameSite(sameSite)
                .path("/api")
                .maxAge(maxAge);
        if (!domain.isBlank()) builder.domain(domain);
        return builder.build();
    }
}
