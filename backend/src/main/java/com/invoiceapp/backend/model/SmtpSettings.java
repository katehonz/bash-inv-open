package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "smtp_settings")
public class SmtpSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "smtp_host", nullable = false)
    private String smtpHost;

    @Column(name = "smtp_port", nullable = false)
    private Integer smtpPort;

    @Column(name = "smtp_username", nullable = false)
    private String smtpUsername;

    @Column(name = "smtp_password", nullable = false)
    private String smtpPassword; // Encrypted with AES-256

    @Column(name = "from_email", nullable = false)
    private String fromEmail;

    @Column(name = "from_name")
    private String fromName;

    @Column(name = "use_tls", nullable = false)
    private Boolean useTls = true;

    @Column(name = "use_ssl", nullable = false)
    private Boolean useSsl = false;

    @Column(name = "smtp_auth", nullable = false)
    private Boolean smtpAuth = true;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_tested_at")
    private LocalDateTime lastTestedAt;

    @Column(name = "test_result")
    private String testResult; // SUCCESS, FAILED, или error message

    @Column(name = "provider_name")
    private String providerName; // Alibaba Cloud DirectMail, Gmail, etc.

    // Constructors
    public SmtpSettings() {
        this.createdAt = LocalDateTime.now();
    }

    public SmtpSettings(String smtpHost, Integer smtpPort, String smtpUsername, 
                       String smtpPassword, String fromEmail) {
        this();
        this.smtpHost = smtpHost;
        this.smtpPort = smtpPort;
        this.smtpUsername = smtpUsername;
        this.smtpPassword = smtpPassword;
        this.fromEmail = fromEmail;
    }

    // Lifecycle callbacks
    @PreUpdate
    public void preUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getSmtpHost() {
        return smtpHost;
    }

    public void setSmtpHost(String smtpHost) {
        this.smtpHost = smtpHost;
    }

    public Integer getSmtpPort() {
        return smtpPort;
    }

    public void setSmtpPort(Integer smtpPort) {
        this.smtpPort = smtpPort;
    }

    public String getSmtpUsername() {
        return smtpUsername;
    }

    public void setSmtpUsername(String smtpUsername) {
        this.smtpUsername = smtpUsername;
    }

    public String getSmtpPassword() {
        return smtpPassword;
    }

    public void setSmtpPassword(String smtpPassword) {
        this.smtpPassword = smtpPassword;
    }

    public String getFromEmail() {
        return fromEmail;
    }

    public void setFromEmail(String fromEmail) {
        this.fromEmail = fromEmail;
    }

    public String getFromName() {
        return fromName;
    }

    public void setFromName(String fromName) {
        this.fromName = fromName;
    }

    public Boolean getUseTls() {
        return useTls;
    }

    public void setUseTls(Boolean useTls) {
        this.useTls = useTls;
    }

    public Boolean getUseSsl() {
        return useSsl;
    }

    public void setUseSsl(Boolean useSsl) {
        this.useSsl = useSsl;
    }

    public Boolean getSmtpAuth() {
        return smtpAuth;
    }

    public void setSmtpAuth(Boolean smtpAuth) {
        this.smtpAuth = smtpAuth;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public LocalDateTime getLastTestedAt() {
        return lastTestedAt;
    }

    public void setLastTestedAt(LocalDateTime lastTestedAt) {
        this.lastTestedAt = lastTestedAt;
    }

    public String getTestResult() {
        return testResult;
    }

    public void setTestResult(String testResult) {
        this.testResult = testResult;
    }

    public String getProviderName() {
        return providerName;
    }

    public void setProviderName(String providerName) {
        this.providerName = providerName;
    }

    // Helper methods
    public boolean isActive() {
        return isActive != null && isActive;
    }

    public boolean hasValidConfiguration() {
        return smtpHost != null && !smtpHost.trim().isEmpty() &&
               smtpPort != null && smtpPort > 0 &&
               smtpUsername != null && !smtpUsername.trim().isEmpty() &&
               smtpPassword != null && !smtpPassword.trim().isEmpty() &&
               fromEmail != null && !fromEmail.trim().isEmpty();
    }

    public String getDisplayName() {
        if (providerName != null && !providerName.trim().isEmpty()) {
            return providerName + " (" + smtpHost + ":" + smtpPort + ")";
        }
        return smtpHost + ":" + smtpPort;
    }
}