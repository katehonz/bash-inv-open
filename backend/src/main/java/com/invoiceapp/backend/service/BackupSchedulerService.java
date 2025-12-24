package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.BackupSettings;
import com.invoiceapp.backend.repository.BackupSettingsRepository;
import jakarta.annotation.PostConstruct;
import org.quartz.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class BackupSchedulerService {

    private static final Logger logger = LoggerFactory.getLogger(BackupSchedulerService.class);
    private static final String BACKUP_JOB_KEY = "databaseBackupJob";
    private static final String BACKUP_TRIGGER_KEY = "databaseBackupTrigger";
    private static final String BACKUP_GROUP = "backupGroup";

    private final Scheduler scheduler;
    private final BackupSettingsRepository backupSettingsRepository;

    public BackupSchedulerService(Scheduler scheduler, BackupSettingsRepository backupSettingsRepository) {
        this.scheduler = scheduler;
        this.backupSettingsRepository = backupSettingsRepository;
    }

    @PostConstruct
    public void init() {
        try {
            // Check if there are active auto-backup settings and schedule accordingly
            Optional<BackupSettings> settingsOpt = backupSettingsRepository.findActiveAutoBackupSettings();
            if (settingsOpt.isPresent()) {
                scheduleBackup(settingsOpt.get());
            }
        } catch (Exception e) {
            logger.error("Failed to initialize backup scheduler", e);
        }
    }

    /**
     * Schedule automatic backups based on settings
     */
    public void scheduleBackup(BackupSettings settings) throws SchedulerException {
        if (!settings.getAutoBackupEnabled()) {
            unscheduleBackup();
            return;
        }

        JobDetail jobDetail = JobBuilder.newJob(BackupJob.class)
                .withIdentity(BACKUP_JOB_KEY, BACKUP_GROUP)
                .storeDurably()
                .build();

        CronTrigger trigger = TriggerBuilder.newTrigger()
                .withIdentity(BACKUP_TRIGGER_KEY, BACKUP_GROUP)
                .withSchedule(CronScheduleBuilder.cronSchedule(settings.getBackupCronExpression())
                        .withMisfireHandlingInstructionFireAndProceed())
                .build();

        // Remove existing job if present
        if (scheduler.checkExists(new JobKey(BACKUP_JOB_KEY, BACKUP_GROUP))) {
            scheduler.deleteJob(new JobKey(BACKUP_JOB_KEY, BACKUP_GROUP));
        }

        scheduler.scheduleJob(jobDetail, trigger);
        logger.info("Scheduled automatic backups with cron: {}", settings.getBackupCronExpression());
    }

    /**
     * Unschedule automatic backups
     */
    public void unscheduleBackup() throws SchedulerException {
        JobKey jobKey = new JobKey(BACKUP_JOB_KEY, BACKUP_GROUP);
        if (scheduler.checkExists(jobKey)) {
            scheduler.deleteJob(jobKey);
            logger.info("Unscheduled automatic backups");
        }
    }

    /**
     * Get next scheduled backup time
     */
    public java.util.Date getNextBackupTime() throws SchedulerException {
        TriggerKey triggerKey = new TriggerKey(BACKUP_TRIGGER_KEY, BACKUP_GROUP);
        Trigger trigger = scheduler.getTrigger(triggerKey);
        if (trigger != null) {
            return trigger.getNextFireTime();
        }
        return null;
    }

    /**
     * Check if backup is scheduled
     */
    public boolean isBackupScheduled() throws SchedulerException {
        return scheduler.checkExists(new JobKey(BACKUP_JOB_KEY, BACKUP_GROUP));
    }

    /**
     * Quartz Job for automatic backups
     */
    public static class BackupJob implements Job {
        @Override
        public void execute(JobExecutionContext context) throws JobExecutionException {
            Logger jobLogger = LoggerFactory.getLogger(BackupJob.class);
            jobLogger.info("Starting scheduled automatic backup");

            try {
                // Get the service from Spring context
                DatabaseBackupService backupService = (DatabaseBackupService) context.getScheduler()
                        .getContext().get("databaseBackupService");

                if (backupService != null) {
                    backupService.createBackup("SYSTEM", "AUTOMATIC");
                    jobLogger.info("Scheduled automatic backup completed successfully");
                } else {
                    jobLogger.error("DatabaseBackupService not found in scheduler context");
                }
            } catch (Exception e) {
                jobLogger.error("Scheduled automatic backup failed", e);
                throw new JobExecutionException(e);
            }
        }
    }
}
