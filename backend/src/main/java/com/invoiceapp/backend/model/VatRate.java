package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "vat_rates")
public class VatRate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "rate_value", nullable = false, precision = 5, scale = 2)
    private BigDecimal rateValue; // VAT rate percentage (e.g., 20.00, 9.00, 0.00)

    @Column(name = "rate_name", nullable = false)
    private String rateName; // Name of the rate (e.g., "Standard", "Reduced", "Zero")

    @Column(name = "rate_name_en")
    private String rateNameEn; // English name

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "description")
    private String description;

    @Column(name = "sort_order")
    private Integer sortOrder; // За подреждане в списъци

    // Constructors
    public VatRate() {}

    public VatRate(BigDecimal rateValue, String rateName, String rateNameEn) {
        this.rateValue = rateValue;
        this.rateName = rateName;
        this.rateNameEn = rateNameEn;
        this.isActive = true;
        this.isDefault = false;
    }

    public VatRate(BigDecimal rateValue, String rateName, String rateNameEn, Boolean isDefault) {
        this.rateValue = rateValue;
        this.rateName = rateName;
        this.rateNameEn = rateNameEn;
        this.isActive = true;
        this.isDefault = isDefault;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getRateValue() {
        return rateValue;
    }

    public void setRateValue(BigDecimal rateValue) {
        this.rateValue = rateValue;
    }

    public String getRateName() {
        return rateName;
    }

    public void setRateName(String rateName) {
        this.rateName = rateName;
    }

    public String getRateNameEn() {
        return rateNameEn;
    }

    public void setRateNameEn(String rateNameEn) {
        this.rateNameEn = rateNameEn;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    /**
     * Helper method to check if this is a zero rate
     * @return true if rate is 0%
     */
    public boolean isZeroRate() {
        return rateValue != null && rateValue.compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Helper method to get formatted rate as string
     * @return formatted rate (e.g., "20.00%")
     */
    public String getFormattedRate() {
        if (rateValue == null) return "0.00%";
        return rateValue.toString() + "%";
    }
}