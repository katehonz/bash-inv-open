package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.Document;
import com.invoiceapp.backend.model.DocumentStatus;
import com.invoiceapp.backend.model.DocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository за работа с документи
 */
@Repository
public interface DocumentRepository extends JpaRepository<Document, Long> {

    /**
     * Намира всички документи на дадена фирма, сортирани по дата на създаване (най-новите първо)
     */
    List<Document> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    /**
     * Намира документи по фирма и тип, сортирани по дата на създаване
     */
    List<Document> findByCompanyIdAndDocumentTypeOrderByCreatedAtDesc(Long companyId, DocumentType documentType);

    /**
     * Намира документи по фирма и статус, сортирани по дата на създаване
     */
    List<Document> findByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, DocumentStatus status);

    /**
     * Намира документ по фирма и номер на документа
     */
    Optional<Document> findByCompanyIdAndDocumentNumber(Long companyId, String documentNumber);

    /**
     * Намира документи по фирма, тип и статус
     */
    List<Document> findByCompanyIdAndDocumentTypeAndStatusOrderByCreatedAtDesc(
            Long companyId, DocumentType documentType, DocumentStatus status);

    /**
     * Брои документи по фирма и тип
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.company.id = :companyId AND d.documentType = :documentType")
    long countByCompanyIdAndDocumentType(@Param("companyId") Long companyId, 
                                       @Param("documentType") DocumentType documentType);

    /**
     * Брои документи по фирма и статус
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.company.id = :companyId AND d.status = :status")
    long countByCompanyIdAndStatus(@Param("companyId") Long companyId, 
                                 @Param("status") DocumentStatus status);

    /**
     * Намира всички данъчни документи на дадена фирма
     */
    @Query("SELECT d FROM Document d WHERE d.company.id = :companyId AND d.documentType IN ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE') ORDER BY d.createdAt DESC")
    List<Document> findTaxDocumentsByCompanyId(@Param("companyId") Long companyId);

    /**
     * Намира всички неданъчни документи на дадена фирма
     */
    @Query("SELECT d FROM Document d WHERE d.company.id = :companyId AND d.documentType = 'PROFORMA' ORDER BY d.createdAt DESC")
    List<Document> findNonTaxDocumentsByCompanyId(@Param("companyId") Long companyId);

    /**
     * Проверява дали съществува документ с даден номер в рамките на фирмата
     */
    boolean existsByCompanyIdAndDocumentNumber(Long companyId, String documentNumber);

    /**
     * Намира документи на клиент в рамките на фирма
     */
    List<Document> findByCompanyIdAndClient_IdOrderByCreatedAtDesc(Long companyId, Long clientId);

    /**
     * Намира документи в даден период за дадена фирма
     */
    @Query("SELECT d FROM Document d WHERE d.company.id = :companyId AND d.issueDate BETWEEN :startDate AND :endDate ORDER BY d.issueDate DESC")
    List<Document> findByCompanyIdAndIssueDateBetween(@Param("companyId") Long companyId, 
                                                    @Param("startDate") java.time.LocalDate startDate,
                                                    @Param("endDate") java.time.LocalDate endDate);

    /**
     * Намира документи с просрочен срок на плащане
     */
    @Query("SELECT d FROM Document d WHERE d.company.id = :companyId AND d.dueDate < CURRENT_DATE AND d.status != 'PAID' AND d.status != 'VOID' ORDER BY d.dueDate ASC")
    List<Document> findOverdueDocumentsByCompanyId(@Param("companyId") Long companyId);

    /**
     * Брои общия брой документи на дадена фирма
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.company.id = :companyId")
    long countByCompanyId(@Param("companyId") Long companyId);

    /**
     * Брои данъчни документи на дадена фирма
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.company.id = :companyId AND d.documentType IN ('INVOICE', 'CREDIT_NOTE', 'DEBIT_NOTE')")
    long countTaxDocumentsByCompanyId(@Param("companyId") Long companyId);

    /**
     * Брои неданъчни документи на дадена фирма
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.company.id = :companyId AND d.documentType = 'PROFORMA'")
    long countNonTaxDocumentsByCompanyId(@Param("companyId") Long companyId);

    /**
     * Брои просрочени документи на дадена фирма
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.company.id = :companyId AND d.dueDate < CURRENT_DATE AND d.status != 'PAID' AND d.status != 'VOID'")
    long countOverdueDocumentsByCompanyId(@Param("companyId") Long companyId);

    /**
     * Брои всички документи на даден клиент
     */
    @Query("SELECT COUNT(d) FROM Document d WHERE d.client.id = :clientId")
    long countByClientId(@Param("clientId") Long clientId);

    /**
     * Намира документ по UUID (за публична верификация)
     */
    Optional<Document> findByDocumentUuid(String documentUuid);
}