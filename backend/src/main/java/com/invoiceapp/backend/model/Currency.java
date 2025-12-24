package com.invoiceapp.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "currencies")
@NoArgsConstructor
public class Currency {

    @Id
    @Column(name = "code", length = 3, nullable = false, unique = true)
    private String code; // ISO 4217 currency code (e.g., "EUR", "USD")

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "symbol", length = 5)
    private String symbol;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    public Currency(String code, String name, String symbol) {
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.isActive = true;
    }

    public Currency(String code, String name, String symbol, Boolean isActive) {
        this.code = code;
        this.name = name;
        this.symbol = symbol;
        this.isActive = isActive;
    }

    // Getters
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getSymbol() { return symbol; }
    public Boolean getIsActive() { return isActive; }

    // Setters
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}
