package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.DocumentTypeCode;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DocumentTypeCodeRepository extends JpaRepository<DocumentTypeCode, String> {

    List<DocumentTypeCode> findByAppliesToOrderBySortOrder(String appliesTo);

    List<DocumentTypeCode> findByIsCommonTrueOrderBySortOrder();

    @Query("SELECT d FROM DocumentTypeCode d WHERE d.appliesTo = :appliesTo OR d.appliesTo = 'BOTH' ORDER BY d.sortOrder")
    List<DocumentTypeCode> findByAppliesToOrBothOrderBySortOrder(String appliesTo);

    @Query("SELECT d FROM DocumentTypeCode d WHERE " +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "d.code LIKE CONCAT('%', :search, '%') " +
           "ORDER BY d.sortOrder")
    List<DocumentTypeCode> searchByNameOrCode(String search);

    @Query("SELECT d FROM DocumentTypeCode d WHERE " +
           "(LOWER(d.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "d.code LIKE CONCAT('%', :search, '%')) AND " +
           "(d.appliesTo = :appliesTo OR d.appliesTo = 'BOTH') " +
           "ORDER BY d.sortOrder")
    List<DocumentTypeCode> searchByNameOrCodeAndAppliesTo(String search, String appliesTo);
}
