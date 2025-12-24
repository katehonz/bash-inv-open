package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_settings")
public class BackupSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // S3/Hetzner Object Storage Configuration
    @Column(name = "s3_endpoint", nullable = false)
    private String s3Endpoint; // e.g., https://fsn1.your-objectstorage.com

    @Column(name = "s3_region", nullable = false)
    private String s3Region; // e.g., fsn1

    @Column(name = "s3_bucket_name", nullable = false)
    private String s3BucketName;

    @Column(name = "s3_access_key", nullable = false)
    private String s3AccessKey;

    @Column(name = "s3_secret_key", nullable = false)
    private String s3SecretKey; // Encrypted

    @Column(name = "backup_prefix")
    private String backupPrefix = "db-backups"; // Folder prefix in bucket

    // Scheduling Configuration
    @Column(name = "auto_backup_enabled", nullable = false)
    private Boolean autoBackupEnabled = false;

    @Column(name = "backup_cron_expression")
    private String backupCronExpression = "0 0 2 * * ?"; // Default: 2 AM daily

    @Column(name = "retention_days", nullable = false)
    private Integer retentionDays = 30; // Keep backups for 30 days

    @Column(name = "max_backups")
    private Integer maxBackups = 10; // Maximum number of backups to keep

    // Status and Metadata
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "last_backup_at")
    private LocalDateTime lastBackupAt;

    @Column(name = "last_backup_status")
    private String lastBackupStatus; // SUCCESS, FAILED

    @Column(name = "last_backup_size_bytes")
    private Long lastBackupSizeBytes;

    @Column(name = "last_backup_filename")
    private String lastBackupFilename;

    @Column(name = "last_error_message")
    private String lastErrorMessage;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_tested_at")
    private LocalDateTime lastTestedAt;

    @Column(name = "test_result")
    private String testResult;

    // Constructors
    public BackupSettings() {
        this.createdAt = LocalDateTime.now();
    }

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

    public String getS3Endpoint() {
        return s3Endpoint;
    }

    public void setS3Endpoint(String s3Endpoint) {
        this.s3Endpoint = s3Endpoint;
    }

    public String getS3Region() {
        return s3Region;
    }

    public void setS3Region(String s3Region) {
        this.s3Region = s3Region;
    }

    public String getS3BucketName() {
        return s3BucketName;
    }

    public void setS3BucketName(String s3BucketName) {
        this.s3BucketName = s3BucketName;
    }

    public String getS3AccessKey() {
        return s3AccessKey;
    }

    public void setS3AccessKey(String s3AccessKey) {
        this.s3AccessKey = s3AccessKey;
    }

    public String getS3SecretKey() {
        return s3SecretKey;
    }

    public void setS3SecretKey(String s3SecretKey) {
        this.s3SecretKey = s3SecretKey;
    }

    public String getBackupPrefix() {
        return backupPrefix;
    }

    public void setBackupPrefix(String backupPrefix) {
        this.backupPrefix = backupPrefix;
    }

    public Boolean getAutoBackupEnabled() {
        return autoBackupEnabled;
    }

    public void setAutoBackupEnabled(Boolean autoBackupEnabled) {
        this.autoBackupEnabled = autoBackupEnabled;
    }

    public String getBackupCronExpression() {
        return backupCronExpression;
    }

    public void setBackupCronExpression(String backupCronExpression) {
        this.backupCronExpression = backupCronExpression;
    }

    public Integer getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(Integer retentionDays) {
        this.retentionDays = retentionDays;
    }

    public Integer getMaxBackups() {
        return maxBackups;
    }

    public void setMaxBackups(Integer maxBackups) {
        this.maxBackups = maxBackups;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public LocalDateTime getLastBackupAt() {
        return lastBackupAt;
    }

    public void setLastBackupAt(LocalDateTime lastBackupAt) {
        this.lastBackupAt = lastBackupAt;
    }

    public String getLastBackupStatus() {
        return lastBackupStatus;
    }

    public void setLastBackupStatus(String lastBackupStatus) {
        this.lastBackupStatus = lastBackupStatus;
    }

    public Long getLastBackupSizeBytes() {
        return lastBackupSizeBytes;
    }

    public void setLastBackupSizeBytes(Long lastBackupSizeBytes) {
        this.lastBackupSizeBytes = lastBackupSizeBytes;
    }

    public String getLastBackupFilename() {
        return lastBackupFilename;
    }

    public void setLastBackupFilename(String lastBackupFilename) {
        this.lastBackupFilename = lastBackupFilename;
    }

    public String getLastErrorMessage() {
        return lastErrorMessage;
    }

    public void setLastErrorMessage(String lastErrorMessage) {
        this.lastErrorMessage = lastErrorMessage;
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

    // Helper methods
    public boolean hasValidConfiguration() {
        return s3Endpoint != null && !s3Endpoint.trim().isEmpty() &&
               s3Region != null && !s3Region.trim().isEmpty() &&
               s3BucketName != null && !s3BucketName.trim().isEmpty() &&
               s3AccessKey != null && !s3AccessKey.trim().isEmpty() &&
               s3SecretKey != null && !s3SecretKey.trim().isEmpty();
    }
}
