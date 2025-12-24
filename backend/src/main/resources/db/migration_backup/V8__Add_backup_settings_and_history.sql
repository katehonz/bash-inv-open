-- Backup Settings table for S3/Hetzner Object Storage configuration
CREATE TABLE backup_settings (
    id BIGSERIAL PRIMARY KEY,

    -- S3/Hetzner Object Storage Configuration
    s3_endpoint VARCHAR(255) NOT NULL,
    s3_region VARCHAR(50) NOT NULL,
    s3_bucket_name VARCHAR(255) NOT NULL,
    s3_access_key VARCHAR(255) NOT NULL,
    s3_secret_key VARCHAR(512) NOT NULL,
    backup_prefix VARCHAR(255) DEFAULT 'db-backups',

    -- Scheduling Configuration
    auto_backup_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    backup_cron_expression VARCHAR(100) DEFAULT '0 0 2 * * ?',
    retention_days INTEGER NOT NULL DEFAULT 30,
    max_backups INTEGER DEFAULT 10,

    -- Status and Metadata
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_backup_at TIMESTAMP,
    last_backup_status VARCHAR(50),
    last_backup_size_bytes BIGINT,
    last_backup_filename VARCHAR(255),
    last_error_message TEXT,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    last_tested_at TIMESTAMP,
    test_result VARCHAR(255)
);

-- Backup History table to track all backups
CREATE TABLE backup_history (
    id BIGSERIAL PRIMARY KEY,

    -- Backup Information
    filename VARCHAR(255) NOT NULL,
    s3_key VARCHAR(512) NOT NULL,
    size_bytes BIGINT NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'IN_PROGRESS',
    backup_type VARCHAR(50) NOT NULL,

    -- Timing
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    duration_seconds BIGINT,

    -- Metadata
    error_message TEXT,
    database_name VARCHAR(255),
    checksum VARCHAR(128),
    initiated_by VARCHAR(255),
    deleted_at TIMESTAMP
);

-- Indexes
CREATE INDEX idx_backup_history_status ON backup_history(status);
CREATE INDEX idx_backup_history_started_at ON backup_history(started_at DESC);
CREATE INDEX idx_backup_history_backup_type ON backup_history(backup_type);

-- Comments
COMMENT ON TABLE backup_settings IS 'Configuration for database backups to S3/Hetzner Object Storage';
COMMENT ON TABLE backup_history IS 'History of all database backup operations';
COMMENT ON COLUMN backup_settings.s3_endpoint IS 'S3-compatible endpoint URL (e.g., https://fsn1.your-objectstorage.com)';
COMMENT ON COLUMN backup_settings.backup_cron_expression IS 'Cron expression for automatic backups (default: 2 AM daily)';
COMMENT ON COLUMN backup_settings.retention_days IS 'Number of days to keep backups before automatic deletion';
COMMENT ON COLUMN backup_history.backup_type IS 'MANUAL or AUTOMATIC';
COMMENT ON COLUMN backup_history.checksum IS 'MD5 or SHA256 checksum of the backup file';
