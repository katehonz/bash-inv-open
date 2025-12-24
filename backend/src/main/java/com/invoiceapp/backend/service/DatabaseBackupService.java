package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.BackupHistory;
import com.invoiceapp.backend.model.BackupSettings;
import com.invoiceapp.backend.repository.BackupHistoryRepository;
import com.invoiceapp.backend.repository.BackupSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.*;
import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class DatabaseBackupService {

    private static final Logger logger = LoggerFactory.getLogger(DatabaseBackupService.class);
    private static final DateTimeFormatter BACKUP_DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd_HH-mm-ss");

    private final BackupSettingsRepository backupSettingsRepository;
    private final BackupHistoryRepository backupHistoryRepository;

    @Value("${spring.datasource.url}")
    private String datasourceUrl;

    @Value("${spring.datasource.username}")
    private String datasourceUsername;

    @Value("${spring.datasource.password}")
    private String datasourcePassword;

    public DatabaseBackupService(BackupSettingsRepository backupSettingsRepository,
                                  BackupHistoryRepository backupHistoryRepository) {
        this.backupSettingsRepository = backupSettingsRepository;
        this.backupHistoryRepository = backupHistoryRepository;
    }

    /**
     * Creates an S3 client for the given settings
     */
    private S3Client createS3Client(BackupSettings settings) {
        return S3Client.builder()
                .endpointOverride(URI.create(settings.getS3Endpoint()))
                .region(Region.of(settings.getS3Region()))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(settings.getS3AccessKey(), settings.getS3SecretKey())
                ))
                .forcePathStyle(true) // Required for Hetzner Object Storage
                .build();
    }

    /**
     * Test S3 connection
     */
    @Transactional
    public String testConnection(BackupSettings settings) {
        try (S3Client s3Client = createS3Client(settings)) {
            // Try to list objects in the bucket (limited to 1)
            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(settings.getS3BucketName())
                    .maxKeys(1)
                    .build();

            s3Client.listObjectsV2(request);

            settings.setLastTestedAt(LocalDateTime.now());
            settings.setTestResult("SUCCESS");
            backupSettingsRepository.save(settings);

            return "SUCCESS";
        } catch (Exception e) {
            logger.error("S3 connection test failed", e);
            settings.setLastTestedAt(LocalDateTime.now());
            settings.setTestResult("FAILED: " + e.getMessage());
            backupSettingsRepository.save(settings);
            return "FAILED: " + e.getMessage();
        }
    }

    /**
     * Create a database backup and upload to S3
     */
    @Transactional
    public BackupHistory createBackup(String initiatedBy, String backupType) {
        Optional<BackupSettings> settingsOpt = backupSettingsRepository.findActiveSettings();
        if (settingsOpt.isEmpty()) {
            throw new RuntimeException("No active backup settings configured");
        }

        BackupSettings settings = settingsOpt.get();
        if (!settings.hasValidConfiguration()) {
            throw new RuntimeException("Backup settings are not properly configured");
        }

        // Generate filename first (needed for initial save due to not-null constraints)
        String timestamp = LocalDateTime.now().format(BACKUP_DATE_FORMAT);
        String filename = String.format("backup_%s_%s.sql.gz", extractDatabaseName(), timestamp);
        String s3Key = settings.getBackupPrefix() + "/" + filename;

        // Create backup history record with all required fields
        BackupHistory history = new BackupHistory();
        history.setBackupType(backupType);
        history.setInitiatedBy(initiatedBy);
        history.setDatabaseName(extractDatabaseName());
        history.setFilename(filename);
        history.setS3Key(s3Key);
        history.setSizeBytes(0L); // Will be updated after backup completes
        history = backupHistoryRepository.save(history);

        Path tempFile = null;
        try {

            // Create temporary file for backup
            tempFile = Files.createTempFile("db_backup_", ".sql.gz");

            // Execute pg_dump
            logger.info("Starting database backup: {}", filename);
            executeBackup(tempFile);

            // Calculate file size and checksum
            long fileSize = Files.size(tempFile);
            String checksum = calculateChecksum(tempFile);

            history.setSizeBytes(fileSize);
            history.setChecksum(checksum);
            backupHistoryRepository.save(history);

            // Upload to S3
            logger.info("Uploading backup to S3: {}", s3Key);
            uploadToS3(settings, s3Key, tempFile);

            // Mark as completed
            history.setStatus("COMPLETED");
            history.setCompletedAt(LocalDateTime.now());
            history.setDurationSeconds(ChronoUnit.SECONDS.between(history.getStartedAt(), history.getCompletedAt()));
            backupHistoryRepository.save(history);

            // Update settings
            settings.setLastBackupAt(LocalDateTime.now());
            settings.setLastBackupStatus("SUCCESS");
            settings.setLastBackupSizeBytes(fileSize);
            settings.setLastBackupFilename(filename);
            settings.setLastErrorMessage(null);
            backupSettingsRepository.save(settings);

            // Clean up old backups
            cleanupOldBackups(settings);

            logger.info("Backup completed successfully: {} ({} bytes)", filename, fileSize);
            return history;

        } catch (Exception e) {
            logger.error("Backup failed", e);
            history.setStatus("FAILED");
            history.setErrorMessage(e.getMessage());
            history.setCompletedAt(LocalDateTime.now());
            history.setDurationSeconds(ChronoUnit.SECONDS.between(history.getStartedAt(), history.getCompletedAt()));
            backupHistoryRepository.save(history);

            settings.setLastBackupAt(LocalDateTime.now());
            settings.setLastBackupStatus("FAILED");
            settings.setLastErrorMessage(e.getMessage());
            backupSettingsRepository.save(settings);

            throw new RuntimeException("Backup failed: " + e.getMessage(), e);
        } finally {
            // Clean up temp file
            if (tempFile != null) {
                try {
                    Files.deleteIfExists(tempFile);
                } catch (IOException e) {
                    logger.warn("Failed to delete temp file", e);
                }
            }
        }
    }

    /**
     * Execute pg_dump command
     */
    private void executeBackup(Path outputPath) throws IOException, InterruptedException {
        String host = extractHost();
        String port = extractPort();
        String database = extractDatabaseName();

        logger.info("Starting pg_dump: host={}, port={}, database={}, user={}", host, port, database, datasourceUsername);

        // Use plain format with gzip compression
        // Using set -o pipefail ensures we catch pg_dump errors even in a pipeline
        ProcessBuilder pb = new ProcessBuilder(
                "bash", "-c",
                String.format("set -o pipefail; PGPASSWORD='%s' pg_dump -h %s -p %s -U %s -F p %s 2>&1 | gzip > %s",
                        datasourcePassword, host, port, datasourceUsername, database, outputPath.toString())
        );

        pb.redirectErrorStream(true);
        Process process = pb.start();

        // Read output (captures any errors)
        StringBuilder output = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                logger.debug("pg_dump: {}", line);
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            String errorOutput = output.toString();
            logger.error("pg_dump failed with exit code {}: {}", exitCode, errorOutput);
            throw new RuntimeException("pg_dump failed with exit code: " + exitCode + ". Output: " + errorOutput);
        }

        // Verify the file was created and has content
        long fileSize = Files.size(outputPath);
        if (fileSize < 100) {
            logger.error("Backup file is suspiciously small: {} bytes", fileSize);
            throw new RuntimeException("Backup file is too small (" + fileSize + " bytes). pg_dump may have failed silently.");
        }

        logger.info("pg_dump completed successfully, file size: {} bytes", fileSize);
    }

    /**
     * Upload file to S3
     */
    private void uploadToS3(BackupSettings settings, String s3Key, Path filePath) {
        try (S3Client s3Client = createS3Client(settings)) {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(settings.getS3BucketName())
                    .key(s3Key)
                    .contentType("application/gzip")
                    .build();

            s3Client.putObject(request, RequestBody.fromFile(filePath));
        }
    }

    /**
     * Delete backup from S3
     */
    @Transactional
    public void deleteBackup(Long historyId) {
        BackupHistory history = backupHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("Backup not found"));

        Optional<BackupSettings> settingsOpt = backupSettingsRepository.findActiveSettings();
        if (settingsOpt.isEmpty()) {
            throw new RuntimeException("No active backup settings configured");
        }

        BackupSettings settings = settingsOpt.get();

        try (S3Client s3Client = createS3Client(settings)) {
            DeleteObjectRequest request = DeleteObjectRequest.builder()
                    .bucket(settings.getS3BucketName())
                    .key(history.getS3Key())
                    .build();

            s3Client.deleteObject(request);

            history.setDeletedAt(LocalDateTime.now());
            backupHistoryRepository.save(history);

            logger.info("Deleted backup: {}", history.getFilename());
        } catch (Exception e) {
            logger.error("Failed to delete backup from S3", e);
            throw new RuntimeException("Failed to delete backup: " + e.getMessage());
        }
    }

    /**
     * Get download URL for backup (pre-signed URL)
     */
    public String getDownloadUrl(Long historyId) {
        BackupHistory history = backupHistoryRepository.findById(historyId)
                .orElseThrow(() -> new RuntimeException("Backup not found"));

        if (history.isDeleted()) {
            throw new RuntimeException("Backup has been deleted");
        }

        Optional<BackupSettings> settingsOpt = backupSettingsRepository.findActiveSettings();
        if (settingsOpt.isEmpty()) {
            throw new RuntimeException("No active backup settings configured");
        }

        BackupSettings settings = settingsOpt.get();

        // Generate presigned URL for download (valid for 1 hour)
        try {
            software.amazon.awssdk.services.s3.presigner.S3Presigner presigner = software.amazon.awssdk.services.s3.presigner.S3Presigner.builder()
                    .endpointOverride(URI.create(settings.getS3Endpoint()))
                    .region(Region.of(settings.getS3Region()))
                    .credentialsProvider(StaticCredentialsProvider.create(
                            AwsBasicCredentials.create(settings.getS3AccessKey(), settings.getS3SecretKey())
                    ))
                    .build();

            software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest presignRequest =
                    software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest.builder()
                    .signatureDuration(java.time.Duration.ofHours(1))
                    .getObjectRequest(GetObjectRequest.builder()
                            .bucket(settings.getS3BucketName())
                            .key(history.getS3Key())
                            .build())
                    .build();

            software.amazon.awssdk.services.s3.presigner.model.PresignedGetObjectRequest presignedRequest =
                    presigner.presignGetObject(presignRequest);

            presigner.close();

            return presignedRequest.url().toString();
        } catch (Exception e) {
            logger.error("Failed to generate presigned URL", e);
            throw new RuntimeException("Failed to generate download URL: " + e.getMessage());
        }
    }

    /**
     * List all backups from S3
     */
    public List<S3Object> listS3Backups(BackupSettings settings) {
        try (S3Client s3Client = createS3Client(settings)) {
            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(settings.getS3BucketName())
                    .prefix(settings.getBackupPrefix() + "/")
                    .build();

            return s3Client.listObjectsV2(request).contents();
        }
    }

    /**
     * Clean up old backups based on retention policy
     */
    private void cleanupOldBackups(BackupSettings settings) {
        try {
            // Delete backups older than retention days
            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(settings.getRetentionDays());
            List<BackupHistory> oldBackups = backupHistoryRepository.findBackupsOlderThan(cutoffDate);

            for (BackupHistory backup : oldBackups) {
                try {
                    deleteBackup(backup.getId());
                    logger.info("Deleted old backup: {} (older than {} days)",
                            backup.getFilename(), settings.getRetentionDays());
                } catch (Exception e) {
                    logger.error("Failed to delete old backup: {}", backup.getFilename(), e);
                }
            }

            // Keep only maxBackups if specified
            if (settings.getMaxBackups() != null && settings.getMaxBackups() > 0) {
                long activeCount = backupHistoryRepository.countActiveBackups();
                if (activeCount > settings.getMaxBackups()) {
                    List<BackupHistory> completedBackups = backupHistoryRepository.findCompletedBackups();
                    int toDelete = (int) (activeCount - settings.getMaxBackups());

                    // Delete oldest backups
                    List<BackupHistory> backupsToDelete = completedBackups.stream()
                            .skip(settings.getMaxBackups())
                            .limit(toDelete)
                            .collect(Collectors.toList());

                    for (BackupHistory backup : backupsToDelete) {
                        try {
                            deleteBackup(backup.getId());
                            logger.info("Deleted excess backup: {} (keeping max {})",
                                    backup.getFilename(), settings.getMaxBackups());
                        } catch (Exception e) {
                            logger.error("Failed to delete excess backup: {}", backup.getFilename(), e);
                        }
                    }
                }
            }
        } catch (Exception e) {
            logger.error("Error during backup cleanup", e);
        }
    }

    /**
     * Calculate MD5 checksum of file
     */
    private String calculateChecksum(Path filePath) throws Exception {
        MessageDigest md = MessageDigest.getInstance("MD5");
        try (InputStream is = Files.newInputStream(filePath)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = is.read(buffer)) > 0) {
                md.update(buffer, 0, read);
            }
        }

        byte[] digest = md.digest();
        StringBuilder sb = new StringBuilder();
        for (byte b : digest) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }

    // Helper methods to extract database connection info
    private String extractDatabaseName() {
        // jdbc:postgresql://localhost:5432/sp-inv-app
        String url = datasourceUrl;
        int lastSlash = url.lastIndexOf('/');
        if (lastSlash >= 0) {
            String dbName = url.substring(lastSlash + 1);
            int queryStart = dbName.indexOf('?');
            if (queryStart >= 0) {
                dbName = dbName.substring(0, queryStart);
            }
            return dbName;
        }
        return "database";
    }

    private String extractHost() {
        // jdbc:postgresql://localhost:5432/sp-inv-app
        String url = datasourceUrl.replace("jdbc:postgresql://", "");
        int colonPos = url.indexOf(':');
        if (colonPos >= 0) {
            return url.substring(0, colonPos);
        }
        int slashPos = url.indexOf('/');
        if (slashPos >= 0) {
            return url.substring(0, slashPos);
        }
        return "localhost";
    }

    private String extractPort() {
        // jdbc:postgresql://localhost:5432/sp-inv-app
        String url = datasourceUrl.replace("jdbc:postgresql://", "");
        int colonPos = url.indexOf(':');
        if (colonPos >= 0) {
            int slashPos = url.indexOf('/');
            if (slashPos >= 0) {
                return url.substring(colonPos + 1, slashPos);
            }
        }
        return "5432";
    }
}
