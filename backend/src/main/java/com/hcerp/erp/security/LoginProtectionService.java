package com.hcerp.erp.security;

import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/** In-process protection for public authentication endpoints. Use an edge limiter or Redis when running multiple instances. */
@Service
public class LoginProtectionService {
    private final Map<String, Deque<Long>> attempts = new ConcurrentHashMap<>();
    private final int maximumAttempts;
    private final long windowMillis;

    public LoginProtectionService(
            @Value("${app.security.rate-limit.maximum-attempts:10}") int maximumAttempts,
            @Value("${app.security.rate-limit.window-seconds:600}") long windowSeconds) {
        this.maximumAttempts = maximumAttempts;
        this.windowMillis = Duration.ofSeconds(windowSeconds).toMillis();
    }

    public void check(String scope, String username, String clientIp) {
        checkKey(scope + ":account:" + normalized(username));
        checkKey(scope + ":ip:" + normalized(clientIp));
    }

    public void recordFailure(String scope, String username, String clientIp) {
        record(scope + ":account:" + normalized(username));
        record(scope + ":ip:" + normalized(clientIp));
    }

    private void checkKey(String key) {
        Deque<Long> values = attempts.get(key);
        if (values == null) return;
        synchronized (values) {
            discardExpired(values);
            if (values.size() >= maximumAttempts) {
                throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "请求过于频繁，请稍后再试");
            }
            if (values.isEmpty()) attempts.remove(key, values);
        }
    }

    private void record(String key) {
        Deque<Long> values = attempts.computeIfAbsent(key, ignored -> new ArrayDeque<>());
        synchronized (values) {
            discardExpired(values);
            values.addLast(System.currentTimeMillis());
        }
    }

    private void discardExpired(Deque<Long> values) {
        long earliestAllowed = System.currentTimeMillis() - windowMillis;
        while (!values.isEmpty() && values.peekFirst() < earliestAllowed) values.removeFirst();
    }

    private static String normalized(String value) {
        return value == null ? "" : value.strip().toLowerCase();
    }
}
