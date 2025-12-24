package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "exchange_rates",
       uniqueConstraints = @UniqueConstraint(columnNames = {"currency_code", "rate_date"}))
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "currency_code", referencedColumnName = "code", nullable = false)
    private Currency currency;

    @Column(name = "rate_date", nullable = false)
    private LocalDate rateDate;

    @Column(name = "rate", nullable = false, precision = 19, scale = 9)
    private BigDecimal rate;

    @Column(name = "base_currency", length = 3, nullable = false)
    private String baseCurrency = "BGN"; // Default base currency (BGN до 2026, EUR след това)

    // Getters
    public Long getId() { return id; }
    public Currency getCurrency() { return currency; }
    public LocalDate getRateDate() { return rateDate; }
    public BigDecimal getRate() { return rate; }
    public String getBaseCurrency() { return baseCurrency; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setCurrency(Currency currency) { this.currency = currency; }
    public void setRateDate(LocalDate rateDate) { this.rateDate = rateDate; }
    public void setRate(BigDecimal rate) { this.rate = rate; }
    public void setBaseCurrency(String baseCurrency) { this.baseCurrency = baseCurrency; }
}
