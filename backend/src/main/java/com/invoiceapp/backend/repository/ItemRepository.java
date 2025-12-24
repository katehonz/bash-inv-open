package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    
    /**
     * Find all items by company ID
     */
    List<Item> findByCompanyIdOrderByItemNumber(Long companyId);
    
    /**
     * Find active items by company ID
     */
    List<Item> findByCompanyIdAndIsActiveTrueOrderByItemNumber(Long companyId);
    
    /**
     * Find item by company ID and item number
     */
    Optional<Item> findByCompanyIdAndItemNumber(Long companyId, String itemNumber);
    
    /**
     * Find items by company ID and name containing (case insensitive)
     */
    @Query("SELECT i FROM Item i WHERE i.company.id = :companyId AND " +
           "(LOWER(i.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(i.nameEn) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(i.itemNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(i.description) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY i.itemNumber")
    List<Item> findItemsByCompanyAndSearchTerm(@Param("companyId") Long companyId,
                                              @Param("searchTerm") String searchTerm);
    
    /**
     * Check if item number exists for company
     */
    boolean existsByCompanyIdAndItemNumber(Long companyId, String itemNumber);
    
    /**
     * Count active items by company
     */
    long countByCompanyIdAndIsActiveTrue(Long companyId);
    
    /**
     * Find items by default VAT rate
     */
    @Query("SELECT i FROM Item i WHERE i.company.id = :companyId AND i.defaultVatRate = :vatRate AND i.isActive = true")
    List<Item> findActiveItemsByCompanyAndVatRate(@Param("companyId") Long companyId,
                                                 @Param("vatRate") java.math.BigDecimal vatRate);
    
    /**
     * Check if item is used in any documents
     */
    @Query("SELECT CASE WHEN COUNT(di) > 0 THEN true ELSE false END FROM DocumentItem di WHERE di.item.id = :itemId")
    boolean isItemUsedInDocuments(@Param("itemId") Long itemId);
}