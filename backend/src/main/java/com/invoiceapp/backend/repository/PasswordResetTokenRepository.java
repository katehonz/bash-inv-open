package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.PasswordResetToken;
import com.invoiceapp.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    /**
     * Намира password reset token по token string
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Намира валиден (неизползван и неизтекъл) token по token string
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.token = :token AND t.isUsed = false AND t.expiresAt > :now")
    Optional<PasswordResetToken> findValidToken(@Param("token") String token, @Param("now") LocalDateTime now);

    /**
     * Намира всички tokens за конкретен потребител
     */
    List<PasswordResetToken> findByUserOrderByCreatedAtDesc(User user);

    /**
     * Намира всички неизползвани tokens за конкретен потребител
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.isUsed = false ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findUnusedTokensByUser(@Param("user") User user);

    /**
     * Намира валидни (неизползвани и неизтекли) tokens за конкретен потребител
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user AND t.isUsed = false AND t.expiresAt > :now ORDER BY t.createdAt DESC")
    List<PasswordResetToken> findValidTokensByUser(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Проверява дали потребителя има валиден token
     */
    @Query("SELECT COUNT(t) > 0 FROM PasswordResetToken t WHERE t.user = :user AND t.isUsed = false AND t.expiresAt > :now")
    boolean hasValidToken(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Маркира всички неизползвани tokens на потребител като използвани
     */
    @Modifying
    @Query("UPDATE PasswordResetToken t SET t.isUsed = true, t.usedAt = :now WHERE t.user = :user AND t.isUsed = false")
    void markAllUserTokensAsUsed(@Param("user") User user, @Param("now") LocalDateTime now);

    /**
     * Изтрива всички изтекли tokens
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now")
    void deleteExpiredTokens(@Param("now") LocalDateTime now);

    /**
     * Изтрива всички използвани tokens по-стари от дадена дата
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.isUsed = true AND t.usedAt < :cutoffDate")
    void deleteOldUsedTokens(@Param("cutoffDate") LocalDateTime cutoffDate);

    /**
     * Брои колко tokens са създадени за потребител в последния час
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.user = :user AND t.createdAt > :since")
    long countRecentTokensForUser(@Param("user") User user, @Param("since") LocalDateTime since);

    /**
     * Намира най-скорошния token за потребител
     */
    @Query("SELECT t FROM PasswordResetToken t WHERE t.user = :user ORDER BY t.createdAt DESC")
    Optional<PasswordResetToken> findLatestTokenByUser(@Param("user") User user);

    /**
     * Намира всички tokens създадени от конкретен IP адрес
     */
    List<PasswordResetToken> findByIpAddressOrderByCreatedAtDesc(String ipAddress);

    /**
     * Брои колко tokens са създадени от конкретен IP в последния час
     */
    @Query("SELECT COUNT(t) FROM PasswordResetToken t WHERE t.ipAddress = :ipAddress AND t.createdAt > :since")
    long countRecentTokensFromIp(@Param("ipAddress") String ipAddress, @Param("since") LocalDateTime since);
}