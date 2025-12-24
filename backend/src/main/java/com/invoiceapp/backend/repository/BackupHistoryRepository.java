package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.BackupHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BackupHistoryRepository extends JpaRepository<BackupHistory, Long> {

    List<BackupHistory> findAllByOrderByStartedAtDesc();

    Page<BackupHistory> findAllByOrderByStartedAtDesc(Pageable pageable);

    List<BackupHistory> findByStatusOrderByStartedAtDesc(String status);

    List<BackupHistory> findByBackupTypeOrderByStartedAtDesc(String backupType);

    @Query("SELECT bh FROM BackupHistory bh WHERE bh.status = 'COMPLETED' AND bh.deletedAt IS NULL ORDER BY bh.startedAt DESC")
    List<BackupHistory> findCompletedBackups();

    @Query("SELECT bh FROM BackupHistory bh WHERE bh.status = 'COMPLETED' AND bh.deletedAt IS NULL AND bh.startedAt < :cutoffDate ORDER BY bh.startedAt ASC")
    List<BackupHistory> findBackupsOlderThan(@Param("cutoffDate") LocalDateTime cutoffDate);

    @Query("SELECT COUNT(bh) FROM BackupHistory bh WHERE bh.status = 'COMPLETED' AND bh.deletedAt IS NULL")
    long countActiveBackups();

    @Query("SELECT SUM(bh.sizeBytes) FROM BackupHistory bh WHERE bh.status = 'COMPLETED' AND bh.deletedAt IS NULL")
    Long getTotalBackupSize();

    List<BackupHistory> findTop10ByOrderByStartedAtDesc();
}
