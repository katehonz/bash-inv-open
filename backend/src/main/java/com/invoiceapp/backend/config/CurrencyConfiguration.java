package com.invoiceapp.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Конфигурация за валутната система
 * България е в Еврозоната - използваме само EUR
 */
@Component
@ConfigurationProperties(prefix = "currency")
public class CurrencyConfiguration {

    private static final LocalDate EUROZONE_TRANSITION_DATE = LocalDate.of(2025, 1, 1);
    private static final BigDecimal BGN_TO_EUR_FIXED_RATE = new BigDecimal("1.95583");

    private String defaultCurrency = "EUR";
    private boolean forceEurozoneMode = true;
    private boolean enableBnbRates = false;
    private boolean enableEcbRates = true;
    
    /**
     * Проверява дали сме в Еврозоната
     * @return true ако сме след 01.01.2026 или е форсирано
     */
    public boolean isEurozoneActive() {
        return forceEurozoneMode || 
               LocalDate.now().isAfter(EUROZONE_TRANSITION_DATE) || 
               LocalDate.now().isEqual(EUROZONE_TRANSITION_DATE);
    }
    
    /**
     * Връща базовата валута според текущия период
     * @return "EUR" ако сме в Еврозоната, "BGN" иначе
     */
    public String getBaseCurrency() {
        return isEurozoneActive() ? "EUR" : "BGN";
    }
    
    /**
     * Връща валутата по подразбиране според текущия период
     * @return "EUR" ако сме в Еврозоната, "BGN" иначе
     */
    public String getDefaultCurrency() {
        return isEurozoneActive() ? "EUR" : "BGN";
    }
    
    /**
     * Връща фиксирания курс BGN/EUR
     * @return 1.95583
     */
    public BigDecimal getBgnToEurRate() {
        return BGN_TO_EUR_FIXED_RATE;
    }
    
    /**
     * Връща датата на прехода към Еврозоната
     * @return 01.01.2026
     */
    public LocalDate getTransitionDate() {
        return EUROZONE_TRANSITION_DATE;
    }
    
    /**
     * Проверява дали трябва да се използват БНБ курсове
     * @return true ако не сме в Еврозоната и е разрешено
     */
    public boolean shouldUseBnbRates() {
        return !isEurozoneActive() && enableBnbRates;
    }
    
    /**
     * Проверява дали трябва да се използват ЕЦБ курсове
     * @return true ако сме в Еврозоната и е разрешено
     */
    public boolean shouldUseEcbRates() {
        return isEurozoneActive() && enableEcbRates;
    }
    
    // Getters and Setters
    public String getDefaultCurrencyProperty() {
        return defaultCurrency;
    }
    
    public void setDefaultCurrency(String defaultCurrency) {
        this.defaultCurrency = defaultCurrency;
    }
    
    public boolean isForceEurozoneMode() {
        return forceEurozoneMode;
    }
    
    public void setForceEurozoneMode(boolean forceEurozoneMode) {
        this.forceEurozoneMode = forceEurozoneMode;
    }
    
    public boolean isEnableBnbRates() {
        return enableBnbRates;
    }
    
    public void setEnableBnbRates(boolean enableBnbRates) {
        this.enableBnbRates = enableBnbRates;
    }
    
    public boolean isEnableEcbRates() {
        return enableEcbRates;
    }
    
    public void setEnableEcbRates(boolean enableEcbRates) {
        this.enableEcbRates = enableEcbRates;
    }
}