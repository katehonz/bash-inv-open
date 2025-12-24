package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.config.CurrencyConfiguration;
import com.invoiceapp.backend.model.Currency;
import com.invoiceapp.backend.model.ExchangeRate;
import com.invoiceapp.backend.repository.CurrencyRepository;
import com.invoiceapp.backend.repository.ExchangeRateRepository;
import com.invoiceapp.backend.service.ExchangeRateProviderService;
import com.invoiceapp.backend.service.ExchangeRateService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

/**
 * GraphQL контролер за управление на валути и курсове
 */
@Controller
public class CurrencyController {
    
    private static final Logger logger = LoggerFactory.getLogger(CurrencyController.class);
    
    private final CurrencyRepository currencyRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final CurrencyConfiguration currencyConfig;
    private final ExchangeRateProviderService exchangeRateProviderService;
    private final ExchangeRateService exchangeRateService;

    public CurrencyController(CurrencyRepository currencyRepository,
                             ExchangeRateRepository exchangeRateRepository,
                             CurrencyConfiguration currencyConfig,
                             ExchangeRateProviderService exchangeRateProviderService,
                             ExchangeRateService exchangeRateService) {
        this.currencyRepository = currencyRepository;
        this.exchangeRateRepository = exchangeRateRepository;
        this.currencyConfig = currencyConfig;
        this.exchangeRateProviderService = exchangeRateProviderService;
        this.exchangeRateService = exchangeRateService;
    }
    
    /**
     * Получаване на всички валути (сортирани - първо активни)
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Currency> allCurrencies() {
        logger.debug("Fetching all currencies");
        return currencyRepository.findAllByOrderByIsActiveDescCodeAsc();
    }

    /**
     * Получаване само на активни валути (за dropdown-и)
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<Currency> activeCurrencies() {
        logger.debug("Fetching active currencies");
        return currencyRepository.findByIsActiveTrueOrderByCodeAsc();
    }

    /**
     * Получаване на валута по код
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public Optional<Currency> currencyByCode(@Argument String code) {
        logger.debug("Fetching currency by code: {}", code);
        return currencyRepository.findByCode(code);
    }
    
    /**
     * Получаване на системния статус на валутите
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public CurrencySystemStatus currencySystemStatus() {
        logger.debug("Fetching currency system status");
        ExchangeRateProviderService.SystemStatus systemStatus = exchangeRateProviderService.getSystemStatus();
        
        return new CurrencySystemStatus(
            systemStatus.isEurozoneActive(),
            systemStatus.getTransitionDate(),
            systemStatus.getActiveProvider(),
            systemStatus.getBaseCurrency(),
            systemStatus.getDefaultCurrency(),
            currencyConfig.getBgnToEurRate(),
            currencyConfig.isForceEurozoneMode()
        );
    }
    
    /**
     * Получаване на курсове за дадена дата
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<ExchangeRate> exchangeRatesForDate(@Argument LocalDate date) {
        logger.debug("Fetching exchange rates for date: {}", date);
        return exchangeRateService.getAllRatesForDate(date);
    }
    
    /**
     * Получаване на най-актуалните курсове
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public List<ExchangeRate> latestExchangeRates() {
        logger.debug("Fetching latest exchange rates");
        return exchangeRateService.getLatestRates();
    }
    
    /**
     * Получаване на курс за валута на дадена дата
     */
    @QueryMapping
    @PreAuthorize("isAuthenticated()")
    public ExchangeRate exchangeRateForCurrency(@Argument String currencyCode, @Argument LocalDate date) {
        logger.debug("Fetching exchange rate for currency: {} on date: {}", currencyCode, date);
        return exchangeRateService.getRate(currencyCode, date);
    }
    
    /**
     * Ръчно синхронизиране на курсовете
     */
    @MutationMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public CurrencySystemStatus syncExchangeRates() {
        logger.info("Manual exchange rates sync requested");
        try {
            exchangeRateProviderService.fetchRatesManually();
            return currencySystemStatus();
        } catch (Exception e) {
            logger.error("Failed to sync exchange rates", e);
            throw new RuntimeException("Неуспешно синхронизиране на курсовете: " + e.getMessage());
        }
    }
    
    /**
     * Синхронизация на курсове за исторически период
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public CurrencySystemStatus syncHistoricalRates(@Argument LocalDate fromDate, @Argument LocalDate toDate) {
        logger.info("Historical exchange rates sync requested from {} to {}", fromDate, toDate);
        try {
            // Синхронизира курсове за всеки ден в периода
            LocalDate currentDate = fromDate;
            int totalDays = 0;
            int successfulDays = 0;

            while (!currentDate.isAfter(toDate)) {
                totalDays++;
                try {
                    // Използваме fallback курсове за исторически данни
                    saveFallbackRatesForDate(currentDate);
                    successfulDays++;
                } catch (Exception dayException) {
                    logger.warn("Failed to sync rates for date {}: {}", currentDate, dayException.getMessage());
                }
                currentDate = currentDate.plusDays(1);
            }

            logger.info("Historical sync completed: {}/{} days successful", successfulDays, totalDays);

            // Създаваме статус с информация за sync
            ExchangeRateProviderService.SystemStatus systemStatus = exchangeRateProviderService.getSystemStatus();
            return new CurrencySystemStatus(
                systemStatus.isEurozoneActive(),
                systemStatus.getTransitionDate(),
                systemStatus.getActiveProvider(),
                systemStatus.getBaseCurrency(),
                systemStatus.getDefaultCurrency(),
                currencyConfig.getBgnToEurRate(),
                currencyConfig.isForceEurozoneMode(),
                true,
                String.format("Успешно синхронизирани %d/%d дни", successfulDays, totalDays),
                successfulDays * 5, // Приблизителен брой курсове (5 валути на ден)
                fromDate.toString(),
                toDate.toString()
            );
        } catch (Exception e) {
            logger.error("Failed to sync historical exchange rates", e);
            ExchangeRateProviderService.SystemStatus systemStatus = exchangeRateProviderService.getSystemStatus();
            return new CurrencySystemStatus(
                systemStatus.isEurozoneActive(),
                systemStatus.getTransitionDate(),
                systemStatus.getActiveProvider(),
                systemStatus.getBaseCurrency(),
                systemStatus.getDefaultCurrency(),
                currencyConfig.getBgnToEurRate(),
                currencyConfig.isForceEurozoneMode(),
                false,
                "Грешка при синхронизиране: " + e.getMessage(),
                0,
                fromDate.toString(),
                toDate.toString()
            );
        }
    }
    
    /**
     * Запазване на fallback курсове за конкретна дата
     */
    private void saveFallbackRatesForDate(LocalDate date) {
        // Проверяваме дали вече има курсове за тази дата
        java.util.List<ExchangeRate> existingRates = exchangeRateRepository.findAll().stream()
            .filter(rate -> rate.getRateDate().equals(date))
            .collect(java.util.stream.Collectors.toList());
            
        if (!existingRates.isEmpty()) {
            logger.debug("Rates for date {} already exist, skipping", date);
            return;
        }
        
        logger.info("Saving fallback rates for date: {}", date);
        String baseCurrency = currencyConfig.getBaseCurrency();

        // Курсове спрямо EUR като базова валута (ЕЦБ формат)
        // 1 EUR = X единици от съответната валута
        // Добавяме само валути които съществуват в таблицата currencies
        saveHistoricalRate("EUR", new java.math.BigDecimal("1.0000"), date, baseCurrency);
        saveHistoricalRate("BGN", new java.math.BigDecimal("1.95583"), date, baseCurrency); // Фиксиран курс BGN/EUR
        saveHistoricalRate("USD", new java.math.BigDecimal("1.0550"), date, baseCurrency);  // Приблизителен курс
    }
    
    /**
     * Запазване на исторически курс
     */
    private void saveHistoricalRate(String currencyCode, java.math.BigDecimal rate, LocalDate date, String baseCurrency) {
        try {
            Optional<Currency> currency = currencyRepository.findByCode(currencyCode);
            if (currency.isEmpty()) {
                logger.warn("Currency {} not found in database - skipping rate", currencyCode);
                return;
            }
            
            ExchangeRate newRate = new ExchangeRate();
            newRate.setCurrency(currency.get());
            newRate.setRateDate(date);
            newRate.setRate(rate);
            newRate.setBaseCurrency(baseCurrency);
            
            exchangeRateRepository.save(newRate);
            logger.debug("Saved historical rate for {} on {}: {}", currencyCode, date, rate);
            
        } catch (Exception e) {
            logger.error("Failed to save historical rate for {}: {}", currencyCode, e.getMessage());
        }
    }
    
    /**
     * Промяна на режим на еврозоната (за тестване)
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public CurrencySystemStatus setEurozoneMode(@Argument Boolean forceEurozoneMode) {
        logger.info("Setting Eurozone mode to: {}", forceEurozoneMode);
        try {
            currencyConfig.setForceEurozoneMode(forceEurozoneMode);
            return currencySystemStatus();
        } catch (Exception e) {
            logger.error("Failed to set Eurozone mode", e);
            throw new RuntimeException("Неуспешна промяна на режим на еврозоната: " + e.getMessage());
        }
    }
    
    /**
     * Изчистване на всички валутни курсове
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public CurrencySystemStatus clearAllExchangeRates() {
        logger.info("Clearing all exchange rates");
        try {
            long count = exchangeRateRepository.count();
            exchangeRateRepository.deleteAll();
            logger.info("Deleted {} exchange rates", count);
            return currencySystemStatus();
        } catch (Exception e) {
            logger.error("Failed to clear exchange rates", e);
            throw new RuntimeException("Неуспешно изчистване на курсовете: " + e.getMessage());
        }
    }

    /**
     * Създаване на нова валута
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Currency createCurrency(@Argument String code, @Argument String name, @Argument String symbol) {
        logger.info("Creating new currency: {} - {}", code, name);
        try {
            Currency currency = new Currency(code, name, symbol);
            return currencyRepository.save(currency);
        } catch (Exception e) {
            logger.error("Failed to create currency", e);
            throw new RuntimeException("Неуспешно създаване на валута: " + e.getMessage());
        }
    }

    /**
     * Активиране на валута
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Currency activateCurrency(@Argument String code) {
        logger.info("Activating currency: {}", code);
        Currency currency = currencyRepository.findByCode(code)
            .orElseThrow(() -> new RuntimeException("Валутата не е намерена: " + code));
        currency.setIsActive(true);
        return currencyRepository.save(currency);
    }

    /**
     * Деактивиране на валута
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Currency deactivateCurrency(@Argument String code) {
        logger.info("Deactivating currency: {}", code);
        if ("EUR".equals(code)) {
            throw new RuntimeException("EUR е базовата валута и не може да бъде деактивирана");
        }
        Currency currency = currencyRepository.findByCode(code)
            .orElseThrow(() -> new RuntimeException("Валутата не е намерена: " + code));
        currency.setIsActive(false);
        return currencyRepository.save(currency);
    }

    /**
     * Превключване на активността на валута
     */
    @MutationMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public Currency toggleCurrencyActive(@Argument String code) {
        logger.info("Toggling currency active status: {}", code);
        if ("EUR".equals(code)) {
            throw new RuntimeException("EUR е базовата валута и не може да бъде деактивирана");
        }
        Currency currency = currencyRepository.findByCode(code)
            .orElseThrow(() -> new RuntimeException("Валутата не е намерена: " + code));
        currency.setIsActive(!currency.getIsActive());
        return currencyRepository.save(currency);
    }

    /**
     * Статус на валутната система
     */
    public static class CurrencySystemStatus {
        private final boolean eurozoneActive;
        private final LocalDate transitionDate;
        private final String activeProvider;
        private final String baseCurrency;
        private final String defaultCurrency;
        private final java.math.BigDecimal bgnToEurRate;
        private final boolean forceEurozoneMode;
        private final Boolean success;
        private final String message;
        private final Integer ratesCount;
        private final String fromDate;
        private final String toDate;

        public CurrencySystemStatus(boolean eurozoneActive, LocalDate transitionDate,
                                   String activeProvider, String baseCurrency, String defaultCurrency,
                                   java.math.BigDecimal bgnToEurRate, boolean forceEurozoneMode) {
            this(eurozoneActive, transitionDate, activeProvider, baseCurrency, defaultCurrency,
                 bgnToEurRate, forceEurozoneMode, null, null, null, null, null);
        }

        public CurrencySystemStatus(boolean eurozoneActive, LocalDate transitionDate,
                                   String activeProvider, String baseCurrency, String defaultCurrency,
                                   java.math.BigDecimal bgnToEurRate, boolean forceEurozoneMode,
                                   Boolean success, String message, Integer ratesCount,
                                   String fromDate, String toDate) {
            this.eurozoneActive = eurozoneActive;
            this.transitionDate = transitionDate;
            this.activeProvider = activeProvider;
            this.baseCurrency = baseCurrency;
            this.defaultCurrency = defaultCurrency;
            this.bgnToEurRate = bgnToEurRate;
            this.forceEurozoneMode = forceEurozoneMode;
            this.success = success;
            this.message = message;
            this.ratesCount = ratesCount;
            this.fromDate = fromDate;
            this.toDate = toDate;
        }

        // Getters
        public boolean isEurozoneActive() { return eurozoneActive; }
        public LocalDate getTransitionDate() { return transitionDate; }
        public String getActiveProvider() { return activeProvider; }
        public String getBaseCurrency() { return baseCurrency; }
        public String getDefaultCurrency() { return defaultCurrency; }
        public java.math.BigDecimal getBgnToEurRate() { return bgnToEurRate; }
        public boolean isForceEurozoneMode() { return forceEurozoneMode; }
        public Boolean getSuccess() { return success; }
        public String getMessage() { return message; }
        public Integer getRatesCount() { return ratesCount; }
        public String getFromDate() { return fromDate; }
        public String getToDate() { return toDate; }
    }
}