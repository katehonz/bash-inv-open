package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.PasswordResetToken;
import com.invoiceapp.backend.model.Role;
import com.invoiceapp.backend.model.User;
import com.invoiceapp.backend.repository.PasswordResetTokenRepository;
import com.invoiceapp.backend.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class PasswordResetService {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetService.class);
    
    private static final int TOKEN_EXPIRY_HOURS = 1;
    private static final int MAX_REQUESTS_PER_HOUR = 3;
    private static final int MAX_REQUESTS_PER_IP_PER_HOUR = 10;

    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public PasswordResetService(PasswordResetTokenRepository passwordResetTokenRepository,
                               UserRepository userRepository,
                               EmailService emailService,
                               PasswordEncoder passwordEncoder) {
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Заявява reset на парола за потребител по email
     */
    public PasswordResetResult requestPasswordReset(String email, String ipAddress, String userAgent) {
        try {
            logger.info("Password reset requested for email: {}", email);

            // Намираме потребителя по email
            Optional<User> userOptional = userRepository.findByEmail(email);
            if (userOptional.isEmpty()) {
                logger.warn("Password reset requested for non-existent email: {}", email);
                // Връщаме успех за security reasons (не разкриваме дали email съществува)
                return new PasswordResetResult(true, "If the email exists, a password reset link has been sent.");
            }

            User user = userOptional.get();

            // Проверяваме дали потребителят е активен
            if (!user.getIsActive()) {
                logger.warn("Password reset requested for inactive user: {}", email);
                return new PasswordResetResult(false, "Account is not active.");
            }

            // Проверяваме дали потребителят не е SUPER_ADMIN (те се управляват само с Linux скриптове)
            if (user.getRole() == Role.SUPER_ADMIN) {
                logger.warn("Password reset requested for SUPER_ADMIN user: {}", email);
                return new PasswordResetResult(false, "SUPER_ADMIN accounts cannot reset password through this system.");
            }

            // Rate limiting проверки
            if (!checkRateLimits(user, ipAddress)) {
                logger.warn("Password reset rate limit exceeded for user: {} from IP: {}", email, ipAddress);
                return new PasswordResetResult(false, "Too many password reset requests. Please try again later.");
            }

            // Деактивираме всички стари tokens за този потребител
            passwordResetTokenRepository.markAllUserTokensAsUsed(user, LocalDateTime.now());

            // Генерираме нов token
            String token = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now().plusHours(TOKEN_EXPIRY_HOURS);

            // Създаваме новия token
            PasswordResetToken resetToken = new PasswordResetToken(token, user, expiresAt);
            resetToken.setIpAddress(ipAddress);
            resetToken.setUserAgent(userAgent);

            passwordResetTokenRepository.save(resetToken);

            // Изпращаме email
            String userDisplayName = user.getUsername();
            boolean emailSent = emailService.sendPasswordResetEmail(user.getEmail(), token, userDisplayName);

            if (!emailSent) {
                logger.error("Failed to send password reset email to: {}", email);
                return new PasswordResetResult(false, "Failed to send password reset email. Please contact support.");
            }

            logger.info("Password reset token created and email sent for user: {}", email);
            return new PasswordResetResult(true, "Password reset link has been sent to your email.");

        } catch (Exception e) {
            logger.error("Error processing password reset request for email: {}", email, e);
            return new PasswordResetResult(false, "An error occurred processing your request. Please try again later.");
        }
    }

    /**
     * Валидира password reset token
     */
    public TokenValidationResult validateResetToken(String token) {
        try {
            Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findValidToken(token, LocalDateTime.now());
            
            if (tokenOptional.isEmpty()) {
                logger.warn("Invalid or expired password reset token: {}", token.substring(0, 8) + "...");
                return new TokenValidationResult(false, "Invalid or expired password reset token.", null);
            }

            PasswordResetToken resetToken = tokenOptional.get();
            User user = resetToken.getUser();

            // Проверяваме дали потребителят все още е активен
            if (!user.getIsActive()) {
                logger.warn("Password reset token for inactive user: {}", user.getEmail());
                return new TokenValidationResult(false, "Account is not active.", null);
            }

            // Проверяваме дали потребителят не е SUPER_ADMIN
            if (user.getRole() == Role.SUPER_ADMIN) {
                logger.warn("Password reset token for SUPER_ADMIN user: {}", user.getEmail());
                return new TokenValidationResult(false, "SUPER_ADMIN accounts cannot reset password through this system.", null);
            }

            logger.info("Valid password reset token for user: {}", user.getEmail());
            return new TokenValidationResult(true, "Token is valid.", resetToken);

        } catch (Exception e) {
            logger.error("Error validating password reset token: {}", token.substring(0, 8) + "...", e);
            return new TokenValidationResult(false, "An error occurred validating the token.", null);
        }
    }

    /**
     * Рестартира паролата използвайки валиден token
     */
    public PasswordResetResult resetPassword(String token, String newPassword) {
        try {
            // Валидираме token-а
            TokenValidationResult validation = validateResetToken(token);
            if (!validation.isValid()) {
                return new PasswordResetResult(false, validation.getMessage());
            }

            PasswordResetToken resetToken = validation.getToken();
            User user = resetToken.getUser();

            // Валидираме новата парола
            if (!isValidPassword(newPassword)) {
                return new PasswordResetResult(false, "Password must be at least 8 characters long and contain letters and numbers.");
            }

            // Хеширъм новата парола
            String hashedPassword = passwordEncoder.encode(newPassword);

            // Обновяваме паролата на потребителя
            user.setPassword(hashedPassword);
            userRepository.save(user);

            // Маркираме token-а като използван
            resetToken.markAsUsed();
            passwordResetTokenRepository.save(resetToken);

            // Деактивираме всички други tokens за този потребител
            passwordResetTokenRepository.markAllUserTokensAsUsed(user, LocalDateTime.now());

            logger.info("Password successfully reset for user: {}", user.getEmail());
            return new PasswordResetResult(true, "Password has been successfully reset. You can now log in with your new password.");

        } catch (Exception e) {
            logger.error("Error resetting password with token: {}", token.substring(0, 8) + "...", e);
            return new PasswordResetResult(false, "An error occurred resetting your password. Please try again.");
        }
    }

    /**
     * Получава информация за token без да го валидира напълно
     */
    public TokenInfo getTokenInfo(String token) {
        try {
            Optional<PasswordResetToken> tokenOptional = passwordResetTokenRepository.findByToken(token);
            
            if (tokenOptional.isEmpty()) {
                return new TokenInfo(false, "Token not found", null, null, null);
            }

            PasswordResetToken resetToken = tokenOptional.get();
            User user = resetToken.getUser();

            return new TokenInfo(
                resetToken.isValid(),
                resetToken.getTokenStatus(),
                user.getEmail(),
                user.getUsername(),
                resetToken.getMinutesUntilExpiration()
            );

        } catch (Exception e) {
            logger.error("Error getting token info: {}", token.substring(0, 8) + "...", e);
            return new TokenInfo(false, "Error retrieving token info", null, null, null);
        }
    }

    /**
     * Почиства изтекли и стари tokens
     */
    @Transactional
    public void cleanupExpiredTokens() {
        try {
            LocalDateTime now = LocalDateTime.now();
            
            // Изтриваме изтекли tokens
            passwordResetTokenRepository.deleteExpiredTokens(now);
            
            // Изтриваме използвани tokens по-стари от 7 дни
            LocalDateTime cutoffDate = now.minusDays(7);
            passwordResetTokenRepository.deleteOldUsedTokens(cutoffDate);
            
            logger.info("Expired password reset tokens cleanup completed");
            
        } catch (Exception e) {
            logger.error("Error during password reset tokens cleanup", e);
        }
    }

    /**
     * Проверява rate limits за password reset заявки
     */
    private boolean checkRateLimits(User user, String ipAddress) {
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
        
        // Проверяваме колко заявки има потребителят в последния час
        long userRequests = passwordResetTokenRepository.countRecentTokensForUser(user, oneHourAgo);
        if (userRequests >= MAX_REQUESTS_PER_HOUR) {
            return false;
        }
        
        // Проверяваме колко заявки има от този IP в последния час
        long ipRequests = passwordResetTokenRepository.countRecentTokensFromIp(ipAddress, oneHourAgo);
        if (ipRequests >= MAX_REQUESTS_PER_IP_PER_HOUR) {
            return false;
        }
        
        return true;
    }

    /**
     * Валидира дали паролата отговаря на изискванията
     */
    private boolean isValidPassword(String password) {
        if (password == null || password.length() < 8) {
            return false;
        }
        
        // Проверяваме дали има поне една буква и поне една цифра
        boolean hasLetter = password.chars().anyMatch(Character::isLetter);
        boolean hasDigit = password.chars().anyMatch(Character::isDigit);
        
        return hasLetter && hasDigit;
    }

    // Result classes
    public static class PasswordResetResult {
        private final boolean success;
        private final String message;

        public PasswordResetResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    public static class TokenValidationResult {
        private final boolean valid;
        private final String message;
        private final PasswordResetToken token;

        public TokenValidationResult(boolean valid, String message, PasswordResetToken token) {
            this.valid = valid;
            this.message = message;
            this.token = token;
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
        public PasswordResetToken getToken() { return token; }
    }

    public static class TokenInfo {
        private final boolean valid;
        private final String status;
        private final String userEmail;
        private final String userName;
        private final Long minutesUntilExpiration;

        public TokenInfo(boolean valid, String status, String userEmail, String userName, Long minutesUntilExpiration) {
            this.valid = valid;
            this.status = status;
            this.userEmail = userEmail;
            this.userName = userName;
            this.minutesUntilExpiration = minutesUntilExpiration;
        }

        public boolean isValid() { return valid; }
        public String getStatus() { return status; }
        public String getUserEmail() { return userEmail; }
        public String getUserName() { return userName; }
        public Long getMinutesUntilExpiration() { return minutesUntilExpiration; }
    }
}