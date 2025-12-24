package com.invoiceapp.backend.model.dto;

public class BackupSettingsInput {
    private String s3Endpoint;
    private String s3Region;
    private String s3BucketName;
    private String s3AccessKey;
    private String s3SecretKey;
    private String backupPrefix;
    private Boolean autoBackupEnabled;
    private String backupCronExpression;
    private Integer retentionDays;
    private Integer maxBackups;

    // Getters and Setters
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
}
