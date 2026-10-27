package com.hcerp.erp.auth;

import java.awt.BasicStroke;
import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.imageio.ImageIO;

import org.springframework.stereotype.Service;

@Service
public class LoginCaptchaService {
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    private static final long EXPIRATION_MILLIS = 5 * 60 * 1000L;

    private final Map<String, Challenge> challenges = new ConcurrentHashMap<>();

    public CaptchaChallenge create(String clientIp) {
        discardExpired();
        String answer = randomAnswer();
        String challengeId = UUID.randomUUID().toString();
        challenges.put(challengeId, new Challenge(hash(answer), normalized(clientIp),
                System.currentTimeMillis() + EXPIRATION_MILLIS));
        return new CaptchaChallenge(challengeId, renderImage(answer));
    }

    public boolean verify(String challengeId, String answer, String clientIp) {
        if (challengeId == null || answer == null) return false;
        Challenge challenge = challenges.remove(challengeId);
        if (challenge == null || challenge.expiresAt < System.currentTimeMillis()
                || !challenge.clientIp.equals(normalized(clientIp))) {
            return false;
        }
        return MessageDigest.isEqual(challenge.answerHash, hash(answer.strip().toUpperCase()));
    }

    private String randomAnswer() {
        StringBuilder value = new StringBuilder(6);
        for (int index = 0; index < 6; index++) {
            value.append(CHARACTERS.charAt(RANDOM.nextInt(CHARACTERS.length())));
        }
        return value.toString();
    }

    private String renderImage(String answer) {
        BufferedImage image = new BufferedImage(190, 58, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics = image.createGraphics();
        try {
            graphics.setColor(Color.WHITE);
            graphics.fillRect(0, 0, image.getWidth(), image.getHeight());
            graphics.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            graphics.setStroke(new BasicStroke(1.5f));
            for (int index = 0; index < 8; index++) {
                graphics.setColor(new Color(150 + RANDOM.nextInt(80), 150 + RANDOM.nextInt(80), 150 + RANDOM.nextInt(80)));
                graphics.drawLine(RANDOM.nextInt(image.getWidth()), RANDOM.nextInt(image.getHeight()),
                        RANDOM.nextInt(image.getWidth()), RANDOM.nextInt(image.getHeight()));
            }
            graphics.setFont(new Font(Font.SANS_SERIF, Font.BOLD, 31));
            for (int index = 0; index < answer.length(); index++) {
                graphics.setColor(new Color(20 + RANDOM.nextInt(90), 30 + RANDOM.nextInt(90), 70 + RANDOM.nextInt(100)));
                graphics.drawString(String.valueOf(answer.charAt(index)), 18 + index * 27, 39 + RANDOM.nextInt(8));
            }
            ByteArrayOutputStream output = new ByteArrayOutputStream();
            ImageIO.write(image, "png", output);
            return "data:image/png;base64," + Base64.getEncoder().encodeToString(output.toByteArray());
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to create login captcha", exception);
        } finally {
            graphics.dispose();
        }
    }

    private void discardExpired() {
        long now = System.currentTimeMillis();
        challenges.entrySet().removeIf(entry -> entry.getValue().expiresAt < now);
    }

    private static byte[] hash(String value) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is unavailable", exception);
        }
    }

    private static String normalized(String value) {
        return value == null ? "" : value.strip().toLowerCase();
    }

    private record Challenge(byte[] answerHash, String clientIp, long expiresAt) {
    }

    public record CaptchaChallenge(String challengeId, String imageDataUrl) {
    }
}
