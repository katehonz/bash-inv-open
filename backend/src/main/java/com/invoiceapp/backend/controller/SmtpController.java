package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.SmtpSettings;
import com.invoiceapp.backend.service.EmailService;
import com.invoiceapp.backend.service.SmtpSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Optional;

@Controller
public class SmtpController {

    private static final Logger logger = LoggerFactory.getLogger(SmtpController.class);

    private final SmtpSettingsService smtpSettingsService;

    @Autowired
    public SmtpController(SmtpSettingsService smtpSettingsService) {
        this.smtpSettingsService = smtpSettingsService;
    }

    // QUERIES

    /**
     * Получава активните SMTP настройки
     */
    @QueryMapping
    public SmtpSettings activeSmtpSettings() {
        try {
            Optional<SmtpSettings> settings = smtpSettingsService.getActiveSmtpSettings();
            return settings.orElse(null);
        } catch (Exception e) {
            logger.error("Error retrieving active SMTP settings", e);
            throw new RuntimeException("Failed to retrieve SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Получава всички SMTP настройки
     */
    @QueryMapping
    public List<SmtpSettings> allSmtpSettings() {
        try {
            return smtpSettingsService.getAllSmtpSettings();
        } catch (Exception e) {
            logger.error("Error retrieving all SMTP settings", e);
            throw new RuntimeException("Failed to retrieve SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Получава SMTP настройки по ID
     */
    @QueryMapping
    public SmtpSettings smtpSettingsById(@Argument Long id) {
        try {
            Optional<SmtpSettings> settings = smtpSettingsService.getSmtpSettingsById(id);
            return settings.orElse(null);
        } catch (Exception e) {
            logger.error("Error retrieving SMTP settings by ID: {}", id, e);
            throw new RuntimeException("Failed to retrieve SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Проверява дали има активни SMTP настройки
     */
    @QueryMapping
    public Boolean hasActiveSmtpSettings() {
        try {
            return smtpSettingsService.hasActiveSettings();
        } catch (Exception e) {
            logger.error("Error checking for active SMTP settings", e);
            throw new RuntimeException("Failed to check SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Получава статуса на SMTP конфигурацията
     */
    @QueryMapping
    public SmtpConfigurationStatus smtpConfigurationStatus() {
        try {
            SmtpSettingsService.SmtpConfigurationStatus status = smtpSettingsService.getConfigurationStatus();
            return new SmtpConfigurationStatus(
                status.isConfigured(),
                status.getMessage(),
                status.getActiveSettings()
            );
        } catch (Exception e) {
            logger.error("Error retrieving SMTP configuration status", e);
            throw new RuntimeException("Failed to retrieve SMTP status: " + e.getMessage());
        }
    }

    // MUTATIONS

    /**
     * Създава нови SMTP настройки
     */
    @MutationMapping
    public SmtpSettings createSmtpSettings(@Argument CreateSmtpSettingsInput input) {
        try {
            SmtpSettingsService.CreateSmtpSettingsRequest request = new SmtpSettingsService.CreateSmtpSettingsRequest();
            request.setSmtpHost(input.getSmtpHost());
            request.setSmtpPort(input.getSmtpPort());
            request.setSmtpUsername(input.getSmtpUsername());
            request.setSmtpPassword(input.getSmtpPassword());
            request.setFromEmail(input.getFromEmail());
            request.setFromName(input.getFromName());
            request.setUseTls(input.getUseTls());
            request.setUseSsl(input.getUseSsl());
            request.setSmtpAuth(input.getSmtpAuth());
            request.setProviderName(input.getProviderName());

            return smtpSettingsService.createSmtpSettings(request);
        } catch (Exception e) {
            logger.error("Error creating SMTP settings", e);
            throw new RuntimeException("Failed to create SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Обновява SMTP настройки
     */
    @MutationMapping
    public SmtpSettings updateSmtpSettings(@Argument Long id, @Argument UpdateSmtpSettingsInput input) {
        try {
            SmtpSettingsService.UpdateSmtpSettingsRequest request = new SmtpSettingsService.UpdateSmtpSettingsRequest();
            request.setSmtpHost(input.getSmtpHost());
            request.setSmtpPort(input.getSmtpPort());
            request.setSmtpUsername(input.getSmtpUsername());
            request.setSmtpPassword(input.getSmtpPassword());
            request.setFromEmail(input.getFromEmail());
            request.setFromName(input.getFromName());
            request.setUseTls(input.getUseTls());
            request.setUseSsl(input.getUseSsl());
            request.setSmtpAuth(input.getSmtpAuth());
            request.setProviderName(input.getProviderName());
            request.setIsActive(input.getIsActive());

            return smtpSettingsService.updateSmtpSettings(id, request);
        } catch (Exception e) {
            logger.error("Error updating SMTP settings with ID: {}", id, e);
            throw new RuntimeException("Failed to update SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Тества SMTP настройки
     */
    @MutationMapping
    public SmtpTestResult testSmtpSettings(@Argument Long id) {
        try {
            EmailService.SmtpTestResult result = smtpSettingsService.testSmtpSettings(id);
            return new SmtpTestResult(result.isSuccess(), result.getMessage());
        } catch (Exception e) {
            logger.error("Error testing SMTP settings with ID: {}", id, e);
            throw new RuntimeException("Failed to test SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Активира SMTP настройки
     */
    @MutationMapping
    public SmtpSettings activateSmtpSettings(@Argument Long id) {
        try {
            return smtpSettingsService.activateSmtpSettings(id);
        } catch (Exception e) {
            logger.error("Error activating SMTP settings with ID: {}", id, e);
            throw new RuntimeException("Failed to activate SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Деактивира SMTP настройки
     */
    @MutationMapping
    public SmtpSettings deactivateSmtpSettings(@Argument Long id) {
        try {
            return smtpSettingsService.deactivateSmtpSettings(id);
        } catch (Exception e) {
            logger.error("Error deactivating SMTP settings with ID: {}", id, e);
            throw new RuntimeException("Failed to deactivate SMTP settings: " + e.getMessage());
        }
    }

    /**
     * Изтрива SMTP настройки
     */
    @MutationMapping
    public Boolean deleteSmtpSettings(@Argument Long id) {
        try {
            return smtpSettingsService.deleteSmtpSettings(id);
        } catch (Exception e) {
            logger.error("Error deleting SMTP settings with ID: {}", id, e);
            throw new RuntimeException("Failed to delete SMTP settings: " + e.getMessage());
        }
    }

    // INPUT TYPES
    public static class CreateSmtpSettingsInput {
        private String smtpHost;
        private Integer smtpPort;
        private String smtpUsername;
        private String smtpPassword;
        private String fromEmail;
        private String fromName;
        private Boolean useTls;
        private Boolean useSsl;
        private Boolean smtpAuth;
        private String providerName;

        // Getters and setters
        public String getSmtpHost() { return smtpHost; }
        public void setSmtpHost(String smtpHost) { this.smtpHost = smtpHost; }

        public Integer getSmtpPort() { return smtpPort; }
        public void setSmtpPort(Integer smtpPort) { this.smtpPort = smtpPort; }

        public String getSmtpUsername() { return smtpUsername; }
        public void setSmtpUsername(String smtpUsername) { this.smtpUsername = smtpUsername; }

        public String getSmtpPassword() { return smtpPassword; }
        public void setSmtpPassword(String smtpPassword) { this.smtpPassword = smtpPassword; }

        public String getFromEmail() { return fromEmail; }
        public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }

        public String getFromName() { return fromName; }
        public void setFromName(String fromName) { this.fromName = fromName; }

        public Boolean getUseTls() { return useTls; }
        public void setUseTls(Boolean useTls) { this.useTls = useTls; }

        public Boolean getUseSsl() { return useSsl; }
        public void setUseSsl(Boolean useSsl) { this.useSsl = useSsl; }

        public Boolean getSmtpAuth() { return smtpAuth; }
        public void setSmtpAuth(Boolean smtpAuth) { this.smtpAuth = smtpAuth; }

        public String getProviderName() { return providerName; }
        public void setProviderName(String providerName) { this.providerName = providerName; }
    }

    public static class UpdateSmtpSettingsInput {
        private String smtpHost;
        private Integer smtpPort;
        private String smtpUsername;
        private String smtpPassword;
        private String fromEmail;
        private String fromName;
        private Boolean useTls;
        private Boolean useSsl;
        private Boolean smtpAuth;
        private String providerName;
        private Boolean isActive;

        // Getters and setters
        public String getSmtpHost() { return smtpHost; }
        public void setSmtpHost(String smtpHost) { this.smtpHost = smtpHost; }

        public Integer getSmtpPort() { return smtpPort; }
        public void setSmtpPort(Integer smtpPort) { this.smtpPort = smtpPort; }

        public String getSmtpUsername() { return smtpUsername; }
        public void setSmtpUsername(String smtpUsername) { this.smtpUsername = smtpUsername; }

        public String getSmtpPassword() { return smtpPassword; }
        public void setSmtpPassword(String smtpPassword) { this.smtpPassword = smtpPassword; }

        public String getFromEmail() { return fromEmail; }
        public void setFromEmail(String fromEmail) { this.fromEmail = fromEmail; }

        public String getFromName() { return fromName; }
        public void setFromName(String fromName) { this.fromName = fromName; }

        public Boolean getUseTls() { return useTls; }
        public void setUseTls(Boolean useTls) { this.useTls = useTls; }

        public Boolean getUseSsl() { return useSsl; }
        public void setUseSsl(Boolean useSsl) { this.useSsl = useSsl; }

        public Boolean getSmtpAuth() { return smtpAuth; }
        public void setSmtpAuth(Boolean smtpAuth) { this.smtpAuth = smtpAuth; }

        public String getProviderName() { return providerName; }
        public void setProviderName(String providerName) { this.providerName = providerName; }

        public Boolean getIsActive() { return isActive; }
        public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    }

    // RESPONSE TYPES
    public static class SmtpTestResult {
        private final boolean success;
        private final String message;

        public SmtpTestResult(boolean success, String message) {
            this.success = success;
            this.message = message;
        }

        public boolean isSuccess() { return success; }
        public String getMessage() { return message; }
    }

    public static class SmtpConfigurationStatus {
        private final boolean configured;
        private final String message;
        private final SmtpSettings activeSettings;

        public SmtpConfigurationStatus(boolean configured, String message, SmtpSettings activeSettings) {
            this.configured = configured;
            this.message = message;
            this.activeSettings = activeSettings;
        }

        public boolean isConfigured() { return configured; }
        public String getMessage() { return message; }
        public SmtpSettings getActiveSettings() { return activeSettings; }
    }
}