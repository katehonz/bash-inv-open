package com.invoiceapp.backend.service;

import com.invoiceapp.backend.config.CurrencyConfiguration;
import com.invoiceapp.backend.model.Currency;
import com.invoiceapp.backend.model.ExchangeRate;
import com.invoiceapp.backend.repository.CurrencyRepository;
import com.invoiceapp.backend.repository.ExchangeRateRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

/**
 * Унифициран сервис за получаване на валутни курсове
 * Работи с различни базови валути според периода (BGN до 2026, EUR след това)
 */
@Service
@Transactional(readOnly = true)
public class ExchangeRateService {
    
    private static final Logger logger = LoggerFactory.getLogger(ExchangeRateService.class);
    
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyRepository currencyRepository;
    private final CurrencyConfiguration currencyConfig;
    
    public ExchangeRateService(ExchangeRateRepository exchangeRateRepository,
                              CurrencyRepository currencyRepository,
                              CurrencyConfiguration currencyConfig) {
        this.exchangeRateRepository = exchangeRateRepository;
        this.currencyRepository = currencyRepository;
        this.currencyConfig = currencyConfig;
    }
    
    /**
     * Получаване на курс за валута на конкретна дата
     * @param currencyCode код на валутата
     * @param date датата
     * @return валутен курс
     */
    public ExchangeRate getRate(String currencyCode, LocalDate date) {
        String baseCurrency = currencyConfig.getBaseCurrency();
        
        // Ако търсим базовата валута, курсът е винаги 1.0
        if (currencyCode.equalsIgnoreCase(baseCurrency)) {
            return createBaseRate(currencyCode, date, baseCurrency);
        }
        
        // Специална обработка за BGN/EUR според периода
        if ("BGN".equalsIgnoreCase(currencyCode) && "EUR".equalsIgnoreCase(baseCurrency)) {
            return createBgnToEurRate(date);
        }
        
        if ("EUR".equalsIgnoreCase(currencyCode) && "BGN".equalsIgnoreCase(baseCurrency)) {
            return createEurToBgnRate(date);
        }
        
        // Търсим курса в базата данни
        Optional<ExchangeRate> exactRate = exchangeRateRepository
            .findByCurrencyCodeAndDateAndBaseCurrency(currencyCode, date, baseCurrency);
            
        if (exactRate.isPresent()) {
            return exactRate.get();
        }
        
        // Ако няма точен курс, търсим най-близкия
        return findMostRecentRate(currencyCode, date, baseCurrency);
    }
    
    /**
     * Създаване на курс за базовата валута (винаги 1.0)
     */
    private ExchangeRate createBaseRate(String currencyCode, LocalDate date, String baseCurrency) {
        Optional<Currency> currency = currencyRepository.findByCode(currencyCode);
        
        ExchangeRate baseRate = new ExchangeRate();
        baseRate.setCurrency(currency.orElse(null));
        baseRate.setRate(BigDecimal.ONE);
        baseRate.setRateDate(date);
        baseRate.setBaseCurrency(baseCurrency);
        
        logger.debug("Created base rate for {} = 1.0 (base: {})", currencyCode, baseCurrency);
        return baseRate;
    }
    
    /**
     * Създаване на фиксиран курс BGN към EUR
     */
    private ExchangeRate createBgnToEurRate(LocalDate date) {
        Optional<Currency> bgnCurrency = currencyRepository.findByCode("BGN");
        
        ExchangeRate bgnRate = new ExchangeRate();
        bgnRate.setCurrency(bgnCurrency.orElse(null));
        bgnRate.setRate(currencyConfig.getBgnToEurRate());
        bgnRate.setRateDate(date);
        bgnRate.setBaseCurrency("EUR");
        
        logger.debug("Created BGN to EUR rate: {}", currencyConfig.getBgnToEurRate());
        return bgnRate;
    }
    
    /**
     * Създаване на фиксиран курс EUR към BGN
     */
    private ExchangeRate createEurToBgnRate(LocalDate date) {
        Optional<Currency> eurCurrency = currencyRepository.findByCode("EUR");
        
        ExchangeRate eurRate = new ExchangeRate();
        eurRate.setCurrency(eurCurrency.orElse(null));
        eurRate.setRate(currencyConfig.getBgnToEurRate());
        eurRate.setRateDate(date);
        eurRate.setBaseCurrency("BGN");
        
        logger.debug("Created EUR to BGN rate: {}", currencyConfig.getBgnToEurRate());
        return eurRate;
    }
    
    /**
     * Намиране на най-близкия курс преди дадена дата
     */
    private ExchangeRate findMostRecentRate(String currencyCode, LocalDate date, String baseCurrency) {
        return exchangeRateRepository.findMostRecentRate(currencyCode, date, baseCurrency)
            .orElseThrow(() -> new IllegalStateException(
                String.format("No exchange rate found for currency '%s' on or before date '%s' with base currency '%s'. " +
                            "Please run the %s sync.",
                            currencyCode, date, baseCurrency,
                            currencyConfig.isEurozoneActive() ? "ECB" : "BNB")));
    }
    
    /**
     * Получаване на най-актуален курс за валута
     */
    public ExchangeRate getLatestRate(String currencyCode) {
        return getRate(currencyCode, LocalDate.now());
    }
    
    /**
     * Проверка дали съществува курс за дадена валута и дата
     */
    public boolean hasRate(String currencyCode, LocalDate date) {
        try {
            getRate(currencyCode, date);
            return true;
        } catch (IllegalStateException e) {
            return false;
        }
    }
    
    /**
     * Получаване на всички курсове за дадена дата
     */
    public java.util.List<ExchangeRate> getAllRatesForDate(LocalDate date) {
        String baseCurrency = currencyConfig.getBaseCurrency();

        // Тъй като нямаме директен метод в repository, използваме workaround
        return exchangeRateRepository.findAll().stream()
            .filter(rate -> rate.getRateDate().equals(date) &&
                           rate.getBaseCurrency().equals(baseCurrency))
            .collect(java.util.stream.Collectors.toList());
    }

    /**
     * Получаване на последните налични курсове (за най-скорошната дата)
     */
    public java.util.List<ExchangeRate> getLatestRates() {
        String baseCurrency = currencyConfig.getBaseCurrency();

        // Намираме най-скорошната дата с курсове
        LocalDate latestDate = exchangeRateRepository.findAll().stream()
            .filter(rate -> rate.getBaseCurrency().equals(baseCurrency))
            .map(ExchangeRate::getRateDate)
            .max(LocalDate::compareTo)
            .orElse(LocalDate.now());

        logger.debug("Latest exchange rate date: {}", latestDate);

        return getAllRatesForDate(latestDate);
    }
}
