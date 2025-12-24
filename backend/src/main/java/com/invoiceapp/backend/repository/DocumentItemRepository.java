package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.DocumentItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;

@Repository
public interface DocumentItemRepository extends JpaRepository<DocumentItem, Long> {
    
    /**
     * Find all document items by document ID
     */
    List<DocumentItem> findByDocumentIdOrderByLineNumber(Long documentId);
    
    /**
     * Find document items by item ID
     */
    List<DocumentItem> findByItemId(Long itemId);
    
    /**
     * Find document items by document ID and item ID
     */
    List<DocumentItem> findByDocumentIdAndItemId(Long documentId, Long itemId);
    
    /**
     * Calculate total amount for a document
     */
    @Query("SELECT SUM(di.lineTotalWithVat) FROM DocumentItem di WHERE di.document.id = :documentId")
    BigDecimal calculateDocumentTotal(@Param("documentId") Long documentId);
    
    /**
     * Calculate total VAT amount for a document
     */
    @Query("SELECT SUM(di.vatAmount) FROM DocumentItem di WHERE di.document.id = :documentId")
    BigDecimal calculateDocumentVatTotal(@Param("documentId") Long documentId);
    
    /**
     * Calculate total amount without VAT for a document
     */
    @Query("SELECT SUM(di.lineTotal) FROM DocumentItem di WHERE di.document.id = :documentId")
    BigDecimal calculateDocumentSubTotal(@Param("documentId") Long documentId);
    
    /**
     * Find document items with zero VAT rate
     */
    @Query("SELECT di FROM DocumentItem di WHERE di.document.id = :documentId AND di.vatRate = 0")
    List<DocumentItem> findZeroVatItemsByDocument(@Param("documentId") Long documentId);
    
    /**
     * Find document items with specific VAT rate
     */
    @Query("SELECT di FROM DocumentItem di WHERE di.document.id = :documentId AND di.vatRate = :vatRate")
    List<DocumentItem> findItemsByDocumentAndVatRate(@Param("documentId") Long documentId, 
                                                    @Param("vatRate") BigDecimal vatRate);
    
    /**
     * Count document items by document ID
     */
    long countByDocumentId(Long documentId);
    
    /**
     * Find document items by company ID (through document relationship)
     */
    @Query("SELECT di FROM DocumentItem di WHERE di.document.company.id = :companyId")
    List<DocumentItem> findByCompanyId(@Param("companyId") Long companyId);
    
    /**
     * Find document items that require VAT exemption reason
     */
    @Query("SELECT di FROM DocumentItem di WHERE di.document.id = :documentId AND di.vatRate = 0 AND di.document.documentType IN ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE')")
    List<DocumentItem> findItemsRequiringVatExemptionReason(@Param("documentId") Long documentId);
    
    /**
     * Delete all document items for a document
     */
    void deleteByDocumentId(Long documentId);

    /**
     * Find all document items by multiple document IDs (for DataLoader batch loading)
     */
    @Query("SELECT di FROM DocumentItem di LEFT JOIN FETCH di.item WHERE di.document.id IN :documentIds ORDER BY di.document.id, di.lineNumber")
    List<DocumentItem> findByDocumentIdIn(@Param("documentIds") Set<Long> documentIds);
}