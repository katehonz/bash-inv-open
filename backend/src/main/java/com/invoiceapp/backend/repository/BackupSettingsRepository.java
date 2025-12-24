package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.BackupSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BackupSettingsRepository extends JpaRepository<BackupSettings, Long> {

    @Query("SELECT bs FROM BackupSettings bs WHERE bs.isActive = true ORDER BY bs.id DESC LIMIT 1")
    Optional<BackupSettings> findActiveSettings();

    @Query("SELECT bs FROM BackupSettings bs WHERE bs.autoBackupEnabled = true AND bs.isActive = true")
    Optional<BackupSettings> findActiveAutoBackupSettings();
}
