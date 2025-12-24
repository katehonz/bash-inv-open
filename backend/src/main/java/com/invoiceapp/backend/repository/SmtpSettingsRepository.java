package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.SmtpSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface SmtpSettingsRepository extends JpaRepository<SmtpSettings, Long> {

    /**
     * Намира активните SMTP настройки
     */
    @Query("SELECT s FROM SmtpSettings s WHERE s.isActive = true ORDER BY s.id DESC")
    Optional<SmtpSettings> findActiveSettings();

    /**
     * Намира последно добавените SMTP настройки
     */
    @Query("SELECT s FROM SmtpSettings s ORDER BY s.createdAt DESC")
    Optional<SmtpSettings> findLatestSettings();

    /**
     * Проверява дали има активни SMTP настройки
     */
    @Query("SELECT COUNT(s) > 0 FROM SmtpSettings s WHERE s.isActive = true")
    boolean hasActiveSettings();

    /**
     * Намира SMTP настройки по provider name
     */
    Optional<SmtpSettings> findByProviderNameIgnoreCase(String providerName);

    /**
     * Намира SMTP настройки по host и port
     */
    Optional<SmtpSettings> findBySmtpHostAndSmtpPort(String smtpHost, Integer smtpPort);

    /**
     * Деактивира всички SMTP настройки
     */
    @Query("UPDATE SmtpSettings s SET s.isActive = false")
    void deactivateAllSettings();
}