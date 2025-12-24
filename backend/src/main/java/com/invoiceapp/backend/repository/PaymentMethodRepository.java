package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {

    List<PaymentMethod> findByCompanyIdAndIsActiveTrueOrderBySortOrderAscNameAsc(Long companyId);

    List<PaymentMethod> findByCompanyIdOrderBySortOrderAscNameAsc(Long companyId);

    Optional<PaymentMethod> findByCompanyIdAndMethodCode(Long companyId, String methodCode);

    Optional<PaymentMethod> findByCompanyIdAndIsDefaultTrue(Long companyId);

    List<PaymentMethod> findByCompanyIdAndRequiresBankAccountTrue(Long companyId);

    @Query("SELECT pm FROM PaymentMethod pm WHERE pm.company.id = :companyId AND pm.isActive = true AND pm.requiresBankAccount = :requiresBankAccount ORDER BY pm.sortOrder ASC, pm.name ASC")
    List<PaymentMethod> findActiveByCompanyAndBankAccountRequirement(@Param("companyId") Long companyId, @Param("requiresBankAccount") boolean requiresBankAccount);

    boolean existsByCompanyIdAndMethodCode(Long companyId, String methodCode);

    @Query("SELECT COUNT(pm) FROM PaymentMethod pm WHERE pm.company.id = :companyId AND pm.isActive = true")
    long countActiveByCompanyId(@Param("companyId") Long companyId);

    @Query("SELECT pm FROM PaymentMethod pm WHERE pm.company.id = :companyId AND pm.isActive = true AND pm.name LIKE %:searchTerm% ORDER BY pm.sortOrder ASC, pm.name ASC")
    List<PaymentMethod> searchActiveByCompanyAndName(@Param("companyId") Long companyId, @Param("searchTerm") String searchTerm);
}