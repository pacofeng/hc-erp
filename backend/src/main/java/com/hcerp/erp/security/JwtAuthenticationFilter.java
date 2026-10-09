package com.hcerp.erp.security;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {
    private final JwtService jwtService;
    private final ErpUserDetailsService userDetailsService;
    private final AuthenticationCookieService authenticationCookieService;

    public JwtAuthenticationFilter(JwtService jwtService, ErpUserDetailsService userDetailsService,
                                   AuthenticationCookieService authenticationCookieService) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.authenticationCookieService = authenticationCookieService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String token = tokenFromCookie(request);
        if (token == null) {
            String header = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (header != null && header.startsWith("Bearer ")) token = header.substring(7);
        }
        if (token != null) {
            try {
                String username = jwtService.username(token);
                if (SecurityContextHolder.getContext().getAuthentication() == null) {
                    ErpUserDetails user = (ErpUserDetails) userDetailsService.loadUserByUsername(username);
                    Integer tokenPasswordVersion = jwtService.passwordVersion(token);
                    Integer accountPasswordVersion = user.account().passwordVersion == null
                            ? 0
                            : user.account().passwordVersion;
                    if (!accountPasswordVersion.equals(tokenPasswordVersion)) {
                        throw new IllegalArgumentException("Token was issued before password change");
                    }
                    var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                    SecurityContextHolder.getContext().setAuthentication(auth);
                }
            } catch (RuntimeException ignored) {
                SecurityContextHolder.clearContext();
                authenticationCookieService.clear(response);
                response.sendError(HttpServletResponse.SC_UNAUTHORIZED, "Invalid or expired token");
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private static String tokenFromCookie(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;
        for (Cookie cookie : cookies) {
            if (AuthenticationCookieService.COOKIE_NAME.equals(cookie.getName())) return cookie.getValue();
        }
        return null;
    }
}
