package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.BackupHistory;
import com.invoiceapp.backend.model.BackupSettings;
import com.invoiceapp.backend.model.dto.BackupSettingsInput;
import com.invoiceapp.backend.repository.BackupHistoryRepository;
import com.invoiceapp.backend.repository.BackupSettingsRepository;
import com.invoiceapp.backend.service.BackupSchedulerService;
import com.invoiceapp.backend.service.DatabaseBackupService;
import org.quartz.SchedulerException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.graphql.data.method.annotation.SchemaMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Controller;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

@Controller
public class BackupController {

    private static final Logger logger = LoggerFactory.getLogger(BackupController.class);

    private final BackupSettingsRepository backupSettingsRepository;
    private final BackupHistoryRepository backupHistoryRepository;
    private final DatabaseBackupService databaseBackupService;
    private final BackupSchedulerService backupSchedulerService;

    public BackupController(BackupSettingsRepository backupSettingsRepository,
                           BackupHistoryRepository backupHistoryRepository,
                           DatabaseBackupService databaseBackupService,
                           BackupSchedulerService backupSchedulerService) {
        this.backupSettingsRepository = backupSettingsRepository;
        this.backupHistoryRepository = backupHistoryRepository;
        this.databaseBackupService = databaseBackupService;
        this.backupSchedulerService = backupSchedulerService;
    }

    // ========== QUERIES ==========

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public BackupSettings backupSettings() {
        return backupSettingsRepository.findActiveSettings().orElse(null);
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public List<BackupHistory> backupHistory() {
        return backupHistoryRepository.findTop10ByOrderByStartedAtDesc();
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public List<BackupHistory> allBackupHistory() {
        return backupHistoryRepository.findAllByOrderByStartedAtDesc();
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public BackupHistory backupById(@Argument Long id) {
        return backupHistoryRepository.findById(id).orElse(null);
    }

    @QueryMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public BackupStats backupStats() {
        long totalBackups = backupHistoryRepository.countActiveBackups();
        Long totalSize = backupHistoryRepository.getTotalBackupSize();

        Optional<BackupSettings> settingsOpt = backupSettingsRepository.findActiveSettings();
        String nextBackupTime = null;
        boolean isScheduled = false;

        try {
            isScheduled = backupSchedulerService.isBackupScheduled();
            Date nextTime = backupSchedulerService.getNextBackupTime();
            if (nextTime != null) {
                nextBackupTime = nextTime.toString();
            }
        } catch (SchedulerException e) {
            logger.error("Error getting scheduler info", e);
        }

        return new BackupStats(
                totalBackups,
                totalSize != null ? totalSize : 0L,
                settingsOpt.map(BackupSettings::getLastBackupAt).orElse(null),
                settingsOpt.map(BackupSettings::getLastBackupStatus).orElse(null),
                isScheduled,
                nextBackupTime
        );
    }

    // ========== MUTATIONS ==========

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public BackupSettings saveBackupSettings(@Argument BackupSettingsInput input) {
        BackupSettings settings = backupSettingsRepository.findActiveSettings()
                .orElse(new BackupSettings());

        // Validate cron expression if provided and auto-backup is enabled
        if (input.getBackupCronExpression() != null && !input.getBackupCronExpression().isEmpty()) {
            String cronExpr = input.getBackupCronExpression().trim();
            // Convert Unix cron (5 fields) to Quartz cron (6 fields) if needed
            String[] parts = cronExpr.split("\\s+");
            if (parts.length == 5) {
                // Unix format: minute hour day month weekday
                // Quartz format: second minute hour day month weekday
                cronExpr = "0 " + cronExpr;
                // Replace weekday * with ? for Quartz (day-of-week and day-of-month conflict)
                parts = cronExpr.split("\\s+");
                if (parts.length == 6 && parts[3].equals("*") && parts[5].equals("*")) {
                    parts[5] = "?";
                    cronExpr = String.join(" ", parts);
                } else if (parts.length == 6 && !parts[3].equals("?") && parts[5].equals("*")) {
                    parts[5] = "?";
                    cronExpr = String.join(" ", parts);
                }
            }
            // Validate the cron expression
            try {
                org.quartz.CronExpression.validateExpression(cronExpr);
                input.setBackupCronExpression(cronExpr);
            } catch (java.text.ParseException e) {
                throw new RuntimeException("Невалиден cron израз: " + e.getMessage());
            }
        }

        // Update fields
        if (input.getS3Endpoint() != null) settings.setS3Endpoint(input.getS3Endpoint());
        if (input.getS3Region() != null) settings.setS3Region(input.getS3Region());
        if (input.getS3BucketName() != null) settings.setS3BucketName(input.getS3BucketName());
        if (input.getS3AccessKey() != null) settings.setS3AccessKey(input.getS3AccessKey());
        if (input.getS3SecretKey() != null && !input.getS3SecretKey().isEmpty()) {
            settings.setS3SecretKey(input.getS3SecretKey());
        }
        if (input.getBackupPrefix() != null) settings.setBackupPrefix(input.getBackupPrefix());
        if (input.getAutoBackupEnabled() != null) settings.setAutoBackupEnabled(input.getAutoBackupEnabled());
        if (input.getBackupCronExpression() != null) settings.setBackupCronExpression(input.getBackupCronExpression());
        if (input.getRetentionDays() != null) settings.setRetentionDays(input.getRetentionDays());
        if (input.getMaxBackups() != null) settings.setMaxBackups(input.getMaxBackups());

        settings = backupSettingsRepository.save(settings);

        // Update scheduler
        try {
            backupSchedulerService.scheduleBackup(settings);
        } catch (SchedulerException e) {
            logger.error("Failed to update backup schedule", e);
            throw new RuntimeException("Грешка при настройка на автоматичния график: " + e.getMessage());
        }

        return settings;
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public String testBackupConnection() {
        Optional<BackupSettings> settingsOpt = backupSettingsRepository.findActiveSettings();
        if (settingsOpt.isEmpty()) {
            return "FAILED: No backup settings configured";
        }

        return databaseBackupService.testConnection(settingsOpt.get());
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public BackupHistory createManualBackup() {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        return databaseBackupService.createBackup(username, "MANUAL");
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public Boolean deleteBackup(@Argument Long id) {
        try {
            databaseBackupService.deleteBackup(id);
            return true;
        } catch (Exception e) {
            logger.error("Failed to delete backup", e);
            return false;
        }
    }

    @MutationMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    public String getBackupDownloadUrl(@Argument Long id) {
        return databaseBackupService.getDownloadUrl(id);
    }

    // ========== SCHEMA MAPPINGS ==========

    @SchemaMapping(typeName = "BackupSettings", field = "hasValidConfiguration")
    public boolean hasValidConfiguration(BackupSettings settings) {
        return settings.hasValidConfiguration();
    }

    @SchemaMapping(typeName = "BackupHistory", field = "formattedSize")
    public String formattedSize(BackupHistory history) {
        return history.getFormattedSize();
    }

    // ========== INNER CLASSES ==========

    public static class BackupStats {
        private final long totalBackups;
        private final long totalSizeBytes;
        private final LocalDateTime lastBackupAt;
        private final String lastBackupStatus;
        private final boolean isScheduled;
        private final String nextBackupTime;

        public BackupStats(long totalBackups, long totalSizeBytes, LocalDateTime lastBackupAt,
                          String lastBackupStatus, boolean isScheduled, String nextBackupTime) {
            this.totalBackups = totalBackups;
            this.totalSizeBytes = totalSizeBytes;
            this.lastBackupAt = lastBackupAt;
            this.lastBackupStatus = lastBackupStatus;
            this.isScheduled = isScheduled;
            this.nextBackupTime = nextBackupTime;
        }

        public long getTotalBackups() { return totalBackups; }
        public long getTotalSizeBytes() { return totalSizeBytes; }
        public LocalDateTime getLastBackupAt() { return lastBackupAt; }
        public String getLastBackupStatus() { return lastBackupStatus; }
        public boolean getIsScheduled() { return isScheduled; }
        public String getNextBackupTime() { return nextBackupTime; }

        public String getFormattedTotalSize() {
            if (totalSizeBytes < 1024) return totalSizeBytes + " B";
            if (totalSizeBytes < 1024 * 1024) return String.format("%.2f KB", totalSizeBytes / 1024.0);
            if (totalSizeBytes < 1024 * 1024 * 1024) return String.format("%.2f MB", totalSizeBytes / (1024.0 * 1024));
            return String.format("%.2f GB", totalSizeBytes / (1024.0 * 1024 * 1024));
        }
    }
}
