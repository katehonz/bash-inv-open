package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {

    List<BankAccount> findByCompanyIdAndIsActiveTrueOrderBySortOrderAscBankNameAsc(Long companyId);

    List<BankAccount> findByCompanyIdOrderBySortOrderAscBankNameAsc(Long companyId);

    Optional<BankAccount> findByCompanyIdAndIban(Long companyId, String iban);

    Optional<BankAccount> findByCompanyIdAndIsDefaultTrue(Long companyId);

    List<BankAccount> findByCompanyIdAndCurrencyCode(Long companyId, String currencyCode);

    List<BankAccount> findByCompanyIdAndIsActiveTrueAndCurrencyCode(Long companyId, String currencyCode);

    @Query("SELECT ba FROM BankAccount ba WHERE ba.company.id = :companyId AND ba.isActive = true AND ba.currencyCode = 'BGN' ORDER BY ba.sortOrder ASC, ba.bankName ASC")
    List<BankAccount> findActiveBgnAccountsByCompany(@Param("companyId") Long companyId);

    @Query("SELECT ba FROM BankAccount ba WHERE ba.company.id = :companyId AND ba.isActive = true AND ba.currencyCode != 'BGN' ORDER BY ba.currencyCode ASC, ba.sortOrder ASC, ba.bankName ASC")
    List<BankAccount> findActiveForeignCurrencyAccountsByCompany(@Param("companyId") Long companyId);

    boolean existsByCompanyIdAndIban(Long companyId, String iban);

    @Query("SELECT COUNT(ba) FROM BankAccount ba WHERE ba.company.id = :companyId AND ba.isActive = true")
    long countActiveByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT ba FROM BankAccount ba WHERE ba.company.id = :companyId AND ba.isActive = true AND (ba.bankName LIKE %:searchTerm% OR ba.iban LIKE %:searchTerm% OR ba.accountName LIKE %:searchTerm%) ORDER BY ba.sortOrder ASC, ba.bankName ASC")
    List<BankAccount> searchActiveByCompanyAndTerm(@Param("companyId") Long companyId, @Param("searchTerm") String searchTerm);

    @Query("SELECT DISTINCT ba.currencyCode FROM BankAccount ba WHERE ba.company.id = :companyId AND ba.isActive = true ORDER BY ba.currencyCode ASC")
    List<String> findDistinctCurrenciesByCompanyId(@Param("companyId") Long companyId);
}