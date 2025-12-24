package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.Country;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CountryRepository extends JpaRepository<Country, String> {

    List<Country> findByIsEuMemberTrueOrderByName();

    List<Country> findByIsEuMemberFalseOrderByName();

    @Query("SELECT c FROM Country c ORDER BY c.isEuMember DESC, c.name")
    List<Country> findAllOrderByEuMemberAndName();

    @Query("SELECT c FROM Country c WHERE " +
           "LOWER(c.name) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.nameEn) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(c.code) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "ORDER BY c.isEuMember DESC, c.name")
    List<Country> searchByNameOrCode(String search);

    @Query("SELECT c FROM Country c WHERE c.peppolSchemeId IS NOT NULL ORDER BY c.name")
    List<Country> findAllWithPeppolSchemeId();
}
