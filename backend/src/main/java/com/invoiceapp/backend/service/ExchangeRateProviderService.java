package com.invoiceapp.backend.service;

import com.invoiceapp.backend.config.CurrencyConfiguration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

/**
 * Централизиран сервис за управление на валутни курсове
 * България е в Еврозоната - използваме само ECB курсове
 */
@Service
public class ExchangeRateProviderService {

    private static final Logger logger = LoggerFactory.getLogger(ExchangeRateProviderService.class);

    private final EcbService ecbService;
    private final CurrencyConfiguration currencyConfig;
    private final ApplicationEventPublisher eventPublisher;

    private boolean wasEurozoneActive = false;

    public ExchangeRateProviderService(EcbService ecbService,
                                     CurrencyConfiguration currencyConfig,
                                     ApplicationEventPublisher eventPublisher) {
        this.ecbService = ecbService;
        this.currencyConfig = currencyConfig;
        this.eventPublisher = eventPublisher;

        // Инициализиране на състоянието
        this.wasEurozoneActive = currencyConfig.isEurozoneActive();
    }
    
    /**
     * Автоматично изтегляне на курсове всеки ден в 15:00
     */
    @Scheduled(cron = "0 0 15 * * ?")
    public void fetchDailyRates() {
        logger.info("Fetching ECB exchange rates (Bulgaria is in Eurozone)");
        ecbService.fetchAndSaveRates();
    }
    
    /**
     * Ръчно изтегляне на курсове
     */
    public void fetchRatesManually() {
        logger.info("Manual ECB exchange rates fetch triggered");
        ecbService.fetchAndSaveRates();
    }
    
    /**
     * Получаване на активния източник на курсове
     */
    public String getActiveProvider() {
        return "ECB";
    }
    
    /**
     * Получаване на базовата валута
     */
    public String getBaseCurrency() {
        return currencyConfig.getBaseCurrency();
    }
    
    /**
     * Получаване на валутата по подразбиране
     */
    public String getDefaultCurrency() {
        return currencyConfig.getDefaultCurrency();
    }
    
    /**
     * Проверка дали даден източник е активен
     */
    public boolean isProviderActive(String provider) {
        return "ECB".equalsIgnoreCase(provider);
    }
    
    /**
     * Получаване на информация за състоянието на системата
     */
    public SystemStatus getSystemStatus() {
        return new SystemStatus(
            currencyConfig.isEurozoneActive(),
            currencyConfig.getTransitionDate(),
            getActiveProvider(),
            getBaseCurrency(),
            getDefaultCurrency()
        );
    }
    
    /**
     * Статус на системата
     */
    public static class SystemStatus {
        private final boolean eurozoneActive;
        private final LocalDate transitionDate;
        private final String activeProvider;
        private final String baseCurrency;
        private final String defaultCurrency;
        
        public SystemStatus(boolean eurozoneActive, LocalDate transitionDate, 
                          String activeProvider, String baseCurrency, String defaultCurrency) {
            this.eurozoneActive = eurozoneActive;
            this.transitionDate = transitionDate;
            this.activeProvider = activeProvider;
            this.baseCurrency = baseCurrency;
            this.defaultCurrency = defaultCurrency;
        }
        
        // Getters
        public boolean isEurozoneActive() { return eurozoneActive; }
        public LocalDate getTransitionDate() { return transitionDate; }
        public String getActiveProvider() { return activeProvider; }
        public String getBaseCurrency() { return baseCurrency; }
        public String getDefaultCurrency() { return defaultCurrency; }
        
        @Override
        public String toString() {
            return String.format("SystemStatus{eurozone=%s, provider=%s, baseCurrency=%s, defaultCurrency=%s, transitionDate=%s}", 
                               eurozoneActive, activeProvider, baseCurrency, defaultCurrency, transitionDate);
        }
    }
}