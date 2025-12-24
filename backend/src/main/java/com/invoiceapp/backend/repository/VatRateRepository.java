package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.VatRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface VatRateRepository extends JpaRepository<VatRate, Long> {
    
    /**
     * Find all active VAT rates ordered by sort order
     */
    List<VatRate> findByIsActiveTrueOrderBySortOrderAsc();
    
    /**
     * Find VAT rate by rate value
     */
    Optional<VatRate> findByRateValueAndIsActiveTrue(BigDecimal rateValue);
    
    /**
     * Find default VAT rate
     */
    Optional<VatRate> findByIsDefaultTrueAndIsActiveTrue();
    
    /**
     * Find zero VAT rates
     */
    @Query("SELECT v FROM VatRate v WHERE v.rateValue = 0 AND v.isActive = true")
    List<VatRate> findZeroVatRates();
    
    /**
     * Find non-zero VAT rates
     */
    @Query("SELECT v FROM VatRate v WHERE v.rateValue > 0 AND v.isActive = true ORDER BY v.sortOrder")
    List<VatRate> findNonZeroVatRates();
    
    /**
     * Check if rate value exists
     */
    boolean existsByRateValueAndIsActiveTrue(BigDecimal rateValue);
    
    /**
     * Count active VAT rates
     */
    long countByIsActiveTrue();
    
    /**
     * Unset all default VAT rates
     */
    @Modifying
    @Transactional
    @Query("UPDATE VatRate v SET v.isDefault = false WHERE v.isDefault = true")
    void unsetAllDefaults();
}