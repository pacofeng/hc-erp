package com.hcerp.erp.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** In-process IP throttling for public authentication endpoints. Use a shared store when running multiple instances. */
@Service
public class LoginProtectionService {
    private static final int CAPTCHA_FAILURE_THRESHOLD = 3;
    private static final long DEFAULT_COOLDOWN_SECONDS = 300;

    private final Map<String, Attempts> attempts = new ConcurrentHashMap<>();
    private final int maximumAttempts;
    private final long windowMillis;
    private final long cooldownMillis;

    @Autowired
    public LoginProtectionService(
            @Value("${app.security.rate-limit.maximum-attempts:10}") int maximumAttempts,
            @Value("${app.security.rate-limit.window-seconds:600}") long windowSeconds,
            @Value("${app.security.rate-limit.cooldown-seconds:300}") long cooldownSeconds) {
        this.maximumAttempts = maximumAttempts;
        this.windowMillis = Duration.ofSeconds(windowSeconds).toMillis();
        this.cooldownMillis = Duration.ofSeconds(cooldownSeconds).toMillis();
    }

    LoginProtectionService(int maximumAttempts, long windowSeconds) {
        this(maximumAttempts, windowSeconds, DEFAULT_COOLDOWN_SECONDS);
    }

    public void check(String scope, String username, String clientIp) {
        check(scope, clientIp);
    }

    public void check(String scope, String clientIp) {
        String key = key(scope, clientIp);
        Attempts state = attempts.get(key);
        if (state == null) return;
        synchronized (state) {
            long now = System.currentTimeMillis();
            discardExpired(state.failures, now);
            if (state.cooldownUntil > now) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "请求过于频繁，请5分钟后再试");
            }
            if (state.cooldownUntil != 0) {
                state.cooldownUntil = 0;
                state.failures.clear();
            }
            if (state.failures.isEmpty()) attempts.remove(key, state);
        }
    }

    public void recordFailure(String scope, String username, String clientIp) {
        recordFailure(scope, clientIp);
    }

    public void recordFailure(String scope, String clientIp) {
        String key = key(scope, clientIp);
        Attempts state = attempts.computeIfAbsent(key, ignored -> new Attempts());
        synchronized (state) {
            long now = System.currentTimeMillis();
            discardExpired(state.failures, now);
            state.failures.addLast(now);
            if (state.failures.size() >= maximumAttempts) {
                state.cooldownUntil = now + cooldownMillis;
                state.failures.clear();
            }
        }
    }

    public boolean requiresCaptcha(String scope, String clientIp) {
        Attempts state = attempts.get(key(scope, clientIp));
        if (state == null) return false;
        synchronized (state) {
            long now = System.currentTimeMillis();
            discardExpired(state.failures, now);
            return state.cooldownUntil <= now && state.failures.size() >= CAPTCHA_FAILURE_THRESHOLD;
        }
    }

    private void discardExpired(Deque<Long> failures, long now) {
        long earliestAllowed = now - windowMillis;
        while (!failures.isEmpty() && failures.peekFirst() < earliestAllowed) failures.removeFirst();
    }

    private static String key(String scope, String clientIp) {
        return scope + ":ip:" + normalized(clientIp);
    }

    private static String normalized(String value) {
        return value == null ? "" : value.strip().toLowerCase();
    }

    private static final class Attempts {
        private final Deque<Long> failures = new ArrayDeque<>();
        private long cooldownUntil;
    }
}
