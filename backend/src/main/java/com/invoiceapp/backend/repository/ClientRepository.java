package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.Client;
import com.invoiceapp.backend.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ClientRepository extends JpaRepository<Client, Long> {
    List<Client> findByCompanyId(Long companyId);
    
    /**
     * Намира клиент по ДДС номер и фирма
     */
    Optional<Client> findByVatNumberAndCompany(String vatNumber, Company company);
    
    /**
     * Намира клиент по ЕИК и фирма
     */
    Optional<Client> findByEikAndCompany(String eik, Company company);
    
    /**
     * Намира всички активни клиенти за фирма
     */
    List<Client> findByCompanyAndIsActiveTrue(Company company);
    
    /**
     * Намира клиенти по тип (B2B/B2C) за фирма
     */
    List<Client> findByCompanyAndClientType(Company company, String clientType);
    
    /**
     * Търси клиенти по име (like search)
     */
    @Query("SELECT c FROM Client c WHERE c.company = :company AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.nameEn) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Client> searchByName(@Param("company") Company company, @Param("searchTerm") String searchTerm);
    
    /**
     * Проверява дали съществува клиент с даден ДДС номер в същата фирма
     */
    boolean existsByVatNumberAndCompany(String vatNumber, Company company);
    
    /**
     * Проверява дали съществува клиент с даден ЕИК в същата фирма
     */
    boolean existsByEikAndCompany(String eik, Company company);
    
    /**
     * Търси клиенти по име, ЕИК или ДДС номер
     */
    @Query("SELECT c FROM Client c WHERE c.company.id = :companyId AND " +
           "(LOWER(c.name) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.nameEn) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.eik) LIKE LOWER(CONCAT('%', :searchTerm, '%')) OR " +
           "LOWER(c.vatNumber) LIKE LOWER(CONCAT('%', :searchTerm, '%')))")
    List<Client> searchByNameEikOrVatNumber(@Param("companyId") Long companyId, @Param("searchTerm") String searchTerm);
}
