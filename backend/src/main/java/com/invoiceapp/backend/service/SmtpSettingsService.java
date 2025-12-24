package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.SmtpSettings;
import com.invoiceapp.backend.repository.SmtpSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class SmtpSettingsService {

    private static final Logger logger = LoggerFactory.getLogger(SmtpSettingsService.class);

    private final SmtpSettingsRepository smtpSettingsRepository;
    private final EncryptionService encryptionService;
    private final EmailService emailService;

    @Autowired
    public SmtpSettingsService(SmtpSettingsRepository smtpSettingsRepository, 
                              EncryptionService encryptionService,
                              EmailService emailService) {
        this.smtpSettingsRepository = smtpSettingsRepository;
        this.encryptionService = encryptionService;
        this.emailService = emailService;
    }

    /**
     * Създава нови SMTP настройки
     */
    public SmtpSettings createSmtpSettings(CreateSmtpSettingsRequest request) {
        try {
            // Валидация на входните данни
            validateSmtpSettingsRequest(request);

            // Деактивираме всички стари настройки преди да създадем нови
            deactivateAllSettings();

            // Криптираме паролата
            String encryptedPassword = encryptionService.encrypt(request.getSmtpPassword());

            // Създаваме новите настройки
            SmtpSettings settings = new SmtpSettings();
            settings.setSmtpHost(request.getSmtpHost());
            settings.setSmtpPort(request.getSmtpPort());
            settings.setSmtpUsername(request.getSmtpUsername());
            settings.setSmtpPassword(encryptedPassword);
            settings.setFromEmail(request.getFromEmail());
            settings.setFromName(request.getFromName());
            settings.setUseTls(request.getUseTls() != null ? request.getUseTls() : true);
            settings.setUseSsl(request.getUseSsl() != null ? request.getUseSsl() : false);
            settings.setSmtpAuth(request.getSmtpAuth() != null ? request.getSmtpAuth() : true);
            settings.setProviderName(request.getProviderName());
            settings.setIsActive(true);

            SmtpSettings savedSettings = smtpSettingsRepository.save(settings);
            
            logger.info("SMTP settings created successfully: {}", savedSettings.getDisplayName());
            return savedSettings;

        } catch (Exception e) {
            logger.error("Failed to create SMTP settings", e);
            throw new RuntimeException("Failed to create SMTP settings: " + e.getMessage(), e);
        }
    }

    /**
     * Обновява съществуващи SMTP настройки
     */
    public SmtpSettings updateSmtpSettings(Long id, UpdateSmtpSettingsRequest request) {
        try {
            SmtpSettings settings = smtpSettingsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SMTP settings not found with id: " + id));

            // Обновяваме полетата, ако са предоставени
            if (request.getSmtpHost() != null) {
                settings.setSmtpHost(request.getSmtpHost());
            }
            if (request.getSmtpPort() != null) {
                settings.setSmtpPort(request.getSmtpPort());
            }
            if (request.getSmtpUsername() != null) {
                settings.setSmtpUsername(request.getSmtpUsername());
            }
            if (request.getSmtpPassword() != null) {
                // Криптираме новата парола
                String encryptedPassword = encryptionService.encrypt(request.getSmtpPassword());
                settings.setSmtpPassword(encryptedPassword);
            }
            if (request.getFromEmail() != null) {
                settings.setFromEmail(request.getFromEmail());
            }
            if (request.getFromName() != null) {
                settings.setFromName(request.getFromName());
            }
            if (request.getUseTls() != null) {
                settings.setUseTls(request.getUseTls());
            }
            if (request.getUseSsl() != null) {
                settings.setUseSsl(request.getUseSsl());
            }
            if (request.getSmtpAuth() != null) {
                settings.setSmtpAuth(request.getSmtpAuth());
            }
            if (request.getProviderName() != null) {
                settings.setProviderName(request.getProviderName());
            }
            if (request.getIsActive() != null) {
                settings.setIsActive(request.getIsActive());
            }

            SmtpSettings updatedSettings = smtpSettingsRepository.save(settings);
            
            logger.info("SMTP settings updated successfully: {}", updatedSettings.getDisplayName());
            return updatedSettings;

        } catch (Exception e) {
            logger.error("Failed to update SMTP settings with id: {}", id, e);
            throw new RuntimeException("Failed to update SMTP settings: " + e.getMessage(), e);
        }
    }

    /**
     * Получава активните SMTP настройки
     */
    public Optional<SmtpSettings> getActiveSmtpSettings() {
        return smtpSettingsRepository.findActiveSettings();
    }

    /**
     * Получава всички SMTP настройки
     */
    public List<SmtpSettings> getAllSmtpSettings() {
        return smtpSettingsRepository.findAll();
    }

    /**
     * Получава SMTP настройки по ID
     */
    public Optional<SmtpSettings> getSmtpSettingsById(Long id) {
        return smtpSettingsRepository.findById(id);
    }

    /**
     * Тества SMTP настройките
     */
    public EmailService.SmtpTestResult testSmtpSettings(Long id) {
        try {
            SmtpSettings settings = smtpSettingsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SMTP settings not found with id: " + id));

            return emailService.testSmtpSettings(settings);

        } catch (Exception e) {
            logger.error("Failed to test SMTP settings with id: {}", id, e);
            return new EmailService.SmtpTestResult(false, "Test failed: " + e.getMessage());
        }
    }

    /**
     * Активира SMTP настройки (деактивира всички други)
     */
    public SmtpSettings activateSmtpSettings(Long id) {
        try {
            SmtpSettings settings = smtpSettingsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SMTP settings not found with id: " + id));

            // Деактивираме всички други настройки
            deactivateAllSettings();

            // Активираме избраните настройки
            settings.setIsActive(true);
            SmtpSettings activatedSettings = smtpSettingsRepository.save(settings);

            logger.info("SMTP settings activated: {}", activatedSettings.getDisplayName());
            return activatedSettings;

        } catch (Exception e) {
            logger.error("Failed to activate SMTP settings with id: {}", id, e);
            throw new RuntimeException("Failed to activate SMTP settings: " + e.getMessage(), e);
        }
    }

    /**
     * Деактивира SMTP настройки
     */
    public SmtpSettings deactivateSmtpSettings(Long id) {
        try {
            SmtpSettings settings = smtpSettingsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SMTP settings not found with id: " + id));

            settings.setIsActive(false);
            SmtpSettings deactivatedSettings = smtpSettingsRepository.save(settings);

            logger.info("SMTP settings deactivated: {}", deactivatedSettings.getDisplayName());
            return deactivatedSettings;

        } catch (Exception e) {
            logger.error("Failed to deactivate SMTP settings with id: {}", id, e);
            throw new RuntimeException("Failed to deactivate SMTP settings: " + e.getMessage(), e);
        }
    }

    /**
     * Изтрива SMTP настройки
     */
    public boolean deleteSmtpSettings(Long id) {
        try {
            if (!smtpSettingsRepository.existsById(id)) {
                throw new IllegalArgumentException("SMTP settings not found with id: " + id);
            }

            smtpSettingsRepository.deleteById(id);
            logger.info("SMTP settings deleted with id: {}", id);
            return true;

        } catch (Exception e) {
            logger.error("Failed to delete SMTP settings with id: {}", id, e);
            throw new RuntimeException("Failed to delete SMTP settings: " + e.getMessage(), e);
        }
    }

    /**
     * Проверява дали има активни SMTP настройки
     */
    public boolean hasActiveSettings() {
        return smtpSettingsRepository.hasActiveSettings();
    }

    /**
     * Получава статуса на SMTP конфигурацията
     */
    public SmtpConfigurationStatus getConfigurationStatus() {
        Optional<SmtpSettings> activeSettings = getActiveSmtpSettings();
        
        if (activeSettings.isEmpty()) {
            return new SmtpConfigurationStatus(false, "No SMTP settings configured", null);
        }

        SmtpSettings settings = activeSettings.get();
        
        if (!settings.hasValidConfiguration()) {
            return new SmtpConfigurationStatus(false, "SMTP settings incomplete", settings);
        }

        return new SmtpConfigurationStatus(true, "SMTP configured and active", settings);
    }

    /**
     * Деактивира всички SMTP настройки
     */
    private void deactivateAllSettings() {
        List<SmtpSettings> allSettings = smtpSettingsRepository.findAll();
        allSettings.forEach(settings -> settings.setIsActive(false));
        smtpSettingsRepository.saveAll(allSettings);
    }

    /**
     * Валидира request за създаване на SMTP настройки
     */
    private void validateSmtpSettingsRequest(CreateSmtpSettingsRequest request) {
        if (request.getSmtpHost() == null || request.getSmtpHost().trim().isEmpty()) {
            throw new IllegalArgumentException("SMTP host is required");
        }
        if (request.getSmtpPort() == null || request.getSmtpPort() <= 0) {
            throw new IllegalArgumentException("Valid SMTP port is required");
        }
        if (request.getSmtpUsername() == null || request.getSmtpUsername().trim().isEmpty()) {
            throw new IllegalArgumentException("SMTP username is required");
        }
        if (request.getSmtpPassword() == null || request.getSmtpPassword().trim().isEmpty()) {
            throw new IllegalArgumentException("SMTP password is required");
        }
        if (request.getFromEmail() == null || request.getFromEmail().trim().isEmpty()) {
            throw new IllegalArgumentException("From email is required");
        }
        // Основна email валидация
        if (!request.getFromEmail().contains("@") || !request.getFromEmail().contains(".")) {
            throw new IllegalArgumentException("Invalid from email format");
        }
    }

    // DTOs
    public static class CreateSmtpSettingsRequest {
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

    public static class UpdateSmtpSettingsRequest {
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