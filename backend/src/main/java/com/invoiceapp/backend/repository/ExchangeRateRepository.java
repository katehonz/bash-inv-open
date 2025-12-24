package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, Long> {

    Optional<ExchangeRate> findByCurrencyCodeAndRateDate(String currencyCode, LocalDate rateDate);
    
    @Query("SELECT er FROM ExchangeRate er WHERE er.currency.code = ?1 AND er.rateDate <= ?2 AND er.baseCurrency = ?3 ORDER BY er.rateDate DESC")
    Optional<ExchangeRate> findMostRecentRate(String currencyCode, LocalDate date, String baseCurrency);
    
    @Query("SELECT er FROM ExchangeRate er WHERE er.currency.code = ?1 AND er.baseCurrency = ?2 ORDER BY er.rateDate DESC")
    List<ExchangeRate> findByCurrencyCodeAndBaseCurrency(String currencyCode, String baseCurrency);
    
    @Query("SELECT er FROM ExchangeRate er WHERE er.currency.code = ?1 AND er.rateDate = ?2 AND er.baseCurrency = ?3")
    Optional<ExchangeRate> findByCurrencyCodeAndDateAndBaseCurrency(String currencyCode, LocalDate date, String baseCurrency);
}
