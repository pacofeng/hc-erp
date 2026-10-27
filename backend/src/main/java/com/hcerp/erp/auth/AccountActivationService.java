package com.hcerp.erp.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;

import org.springframework.stereotype.Service;

import com.hcerp.erp.account.Account;
import com.hcerp.erp.account.AccountRepository;
import com.hcerp.erp.common.Enums.AccountStatus;

@Service
public class AccountActivationService {
    public static final int ACTIVATION_VALIDITY_HOURS = 48;

    private static final SecureRandom RANDOM = new SecureRandom();

    public String issue(Account account) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        account.activationTokenHash = hash(token);
        account.activationExpiresAt = OffsetDateTime.now().plusHours(ACTIVATION_VALIDITY_HOURS);
        account.activatedAt = null;
        return token;
    }

    public Account requirePendingActivation(AccountRepository accounts, String token) {
        Account account = accounts.findByActivationTokenHash(hash(token))
                .orElseThrow(() -> new IllegalArgumentException("激活链接无效或已失效"));
        if (account.status != AccountStatus.PENDING_ACTIVATION
                || account.activationExpiresAt == null
                || !account.activationExpiresAt.isAfter(OffsetDateTime.now())) {
            throw new IllegalArgumentException("激活链接无效或已失效");
        }
        return account;
    }

    public void clear(Account account) {
        account.activationTokenHash = null;
        account.activationExpiresAt = null;
    }

    private String hash(String token) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }
}
