package com.hcerp.erp.auth;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.hcerp.erp.account.Account;

@Service
public class SecurityQuestionService {
    public static final Map<String, String> SECURITY_QUESTIONS = securityQuestions();

    private static final SecureRandom RANDOM = new SecureRandom();
    private final PasswordEncoder passwordEncoder;

    public SecurityQuestionService(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    private static Map<String, String> securityQuestions() {
        Map<String, String> questions = new LinkedHashMap<>();
        questions.put("BIRTH_CITY", "What city were you born in?");
        questions.put("FIRST_SCHOOL", "What was the name of your first school?");
        questions.put("CHILDHOOD_NICKNAME", "What was your childhood nickname?");
        questions.put("OLDEST_SIBLING", "What is your oldest sibling's first name?");
        questions.put("FIRST_PET", "What was your first pet's name?");
        questions.put("PARENTS_MET_CITY", "In what city did your parents meet?");
        questions.put("CHILDHOOD_FOOD", "What was your favorite food as a child?");
        questions.put("FAVORITE_BOOK_MOVIE", "What is your favorite book or movie?");
        questions.put("FAVORITE_TEACHER", "Who is your favorite teacher?");
        questions.put("HIGH_SCHOOL_GRAD_YEAR", "What year did you graduate high school?");
        questions.put("BIRTH_HOSPITAL", "What is the name of the hospital where you were born?");
        return questions;
    }

    public String normalizeAnswer(String answer) {
        return answer == null ? "" : answer.trim().toLowerCase();
    }

    public String hashAnswer(String answer) {
        return passwordEncoder.encode(normalizeAnswer(answer));
    }

    public boolean matchesAnswer(String answer, String hash) {
        return hash != null && passwordEncoder.matches(normalizeAnswer(answer), hash);
    }

    public List<String> questionTexts() {
        return SECURITY_QUESTIONS.values().stream().toList();
    }

    public String questionCode(String questionTextOrCode) {
        if (SECURITY_QUESTIONS.containsKey(questionTextOrCode)) {
            return questionTextOrCode;
        }
        return SECURITY_QUESTIONS.entrySet().stream()
                .filter(entry -> entry.getValue().equals(questionTextOrCode))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unsupported security question"));
    }

    public String questionText(String questionCodeOrText) {
        return SECURITY_QUESTIONS.getOrDefault(questionCodeOrText, questionCodeOrText);
    }

    public String createResetToken(Account account) {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        String token = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        account.passwordResetTokenHash = passwordEncoder.encode(token);
        account.passwordResetTokenExpiresAt = OffsetDateTime.now().plusMinutes(10);
        return token;
    }

    public boolean matchesResetToken(Account account, String token) {
        return account.passwordResetTokenHash != null
                && account.passwordResetTokenExpiresAt != null
                && account.passwordResetTokenExpiresAt.isAfter(OffsetDateTime.now())
                && passwordEncoder.matches(token, account.passwordResetTokenHash);
    }

    public void clearResetToken(Account account) {
        account.passwordResetTokenHash = null;
        account.passwordResetTokenExpiresAt = null;
    }
}
