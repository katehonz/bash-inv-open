package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.VatExemptionReason;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VatExemptionReasonRepository extends JpaRepository<VatExemptionReason, Long> {
    
    /**
     * Find all active VAT exemption reasons ordered by sort order
     */
    List<VatExemptionReason> findByIsActiveTrueOrderBySortOrderAsc();
    
    /**
     * Find VAT exemption reason by reason code
     */
    Optional<VatExemptionReason> findByReasonCodeAndIsActiveTrue(String reasonCode);
    
    /**
     * Find reasons by name containing (case insensitive)
     */
    @Query("SELECT v FROM VatExemptionReason v WHERE " +
           "(LOWER(v.reasonName) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(v.reasonNameEn) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "v.isActive = true ORDER BY v.sortOrder")
    List<VatExemptionReason> findActiveReasonsByNameContaining(@Param("searchTerm") String searchTerm);
    
    /**
     * Check if reason code exists
     */
    boolean existsByReasonCodeAndIsActiveTrue(String reasonCode);
    
    /**
     * Count active VAT exemption reasons
     */
    long countByIsActiveTrue();
    
    /**
     * Find reasons by legal basis containing
     */
    @Query("SELECT v FROM VatExemptionReason v WHERE " +
           "(LOWER(v.legalBasis) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(v.legalBasisEn) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) AND " +
           "v.isActive = true ORDER BY v.sortOrder")
    List<VatExemptionReason> findActiveReasonsByLegalBasisContaining(@Param("searchTerm") String searchTerm);
}