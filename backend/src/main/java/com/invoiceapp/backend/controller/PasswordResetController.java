package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.service.PasswordResetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;

@Controller
public class PasswordResetController {

    private static final Logger logger = LoggerFactory.getLogger(PasswordResetController.class);

    private final PasswordResetService passwordResetService;

    @Autowired
    public PasswordResetController(PasswordResetService passwordResetService) {
        this.passwordResetService = passwordResetService;
    }

    // QUERIES

    /**
     * Валидира password reset token
     */
    @QueryMapping
    public TokenValidationResult validatePasswordResetToken(@Argument String token) {
        try {
            PasswordResetService.TokenValidationResult result = passwordResetService.validateResetToken(token);
            return new TokenValidationResult(result.isValid(), result.getMessage());
        } catch (Exception e) {
            logger.error("Error validating password reset token", e);
            throw new RuntimeException("Failed to validate token: " + e.getMessage());
        }
    }

    /**
     * Получава информация за token
     */
    @QueryMapping
    public TokenInfo passwordResetTokenInfo(@Argument String token) {
        try {
            PasswordResetService.TokenInfo info = passwordResetService.getTokenInfo(token);
            return new TokenInfo(
                info.isValid(),
                info.getStatus(),
                info.getUserEmail(),
                info.getUserName(),
                info.getMinutesUntilExpiration()
            );
        } catch (Exception e) {
            logger.error("Error getting password reset token info", e);
            throw new RuntimeException("Failed to get token info: " + e.getMessage());
        }
    }

    // MUTATIONS

    /**
     * Заявява reset на парола
     */
    @MutationMapping
    public PasswordResetResult requestPasswordReset(@Argument RequestPasswordResetInput input) {
        try {
            // Получаваме IP адрес и User Agent от HTTP request
            String ipAddress = getClientIpAddress();
            String userAgent = getUserAgent();

            PasswordResetService.PasswordResetResult result = passwordResetService.requestPasswordReset(
                input.getEmail(), 
                ipAddress, 
                userAgent
            );

            return new PasswordResetResult(result.isSuccess(), result.getMessage());
        } catch (Exception e) {
            logger.error("Error requesting password reset for email: {}", input.getEmail(), e);
            throw new RuntimeException("Failed to process password reset request: " + e.getMessage());
        }
    }

    /**
     * Рестартира паролата с валиден token
     */
    @MutationMapping
    public PasswordResetResult resetPassword(@Argument ResetPasswordInput input) {
        try {
            PasswordResetService.PasswordResetResult result = passwordResetService.resetPassword(
                input.getToken(), 
                input.getNewPassword()
            );

            return new PasswordResetResult(result.isSuccess(), result.getMessage());
        } catch (Exception e) {
            logger.error("Error resetting password with token", e);
            throw new RuntimeException("Failed to reset password: " + e.getMessage());
        }
    }

    /**
     * Почиства изтекли tokens (за администратори)
     */
    @MutationMapping
    public Boolean cleanupExpiredPasswordResetTokens() {
        try {
            // TODO: Add security check - only SUPER_ADMIN should be able to do this
            passwordResetService.cleanupExpiredTokens();
            return true;
        } catch (Exception e) {
            logger.error("Error cleaning up expired password reset tokens", e);
            throw new RuntimeException("Failed to cleanup tokens: " + e.getMessage());
        }
    }

    // HELPER METHODS

    /**
     * Получава IP адреса на клиента
     */
    private String getClientIpAddress() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attr.getRequest();
            
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
            
            return request.getRemoteAddr();
        } catch (Exception e) {
            logger.warn("Could not determine client IP address", e);
            return "unknown";
        }
    }

    /**
     * Получава User Agent на клиента
     */
    private String getUserAgent() {
        try {
            ServletRequestAttributes attr = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            HttpServletRequest request = attr.getRequest();
            String userAgent = request.getHeader("User-Agent");
            return userAgent != null ? userAgent : "unknown";
        } catch (Exception e) {
            logger.warn("Could not determine User Agent", e);
            return "unknown";
        }
    }

    // INPUT TYPES
    public static class RequestPasswordResetInput {
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class ResetPasswordInput {
        private String token;
        private String newPassword;

        public String getToken() { return token; }
        public void setToken(String token) { this.token = token; }

        public String getNewPassword() { return newPassword; }
        public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
    }

    // RESPONSE TYPES
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

        public TokenValidationResult(boolean valid, String message) {
            this.valid = valid;
            this.message = message;
        }

        public boolean isValid() { return valid; }
        public String getMessage() { return message; }
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