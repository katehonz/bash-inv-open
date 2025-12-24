package com.invoiceapp.backend.model.dto;

import java.math.BigDecimal;

public class CreateItemInput {
    private String itemNumber;
    private String name;
    private String nameEn;
    private BigDecimal defaultVatRate;
    private String accountingAccountNumber;
    private Long companyId;
    private String description;
    private String unitOfMeasure;
    private BigDecimal unitPrice;

    // Constructors
    public CreateItemInput() {}

    public CreateItemInput(String itemNumber, String name, String nameEn, BigDecimal defaultVatRate, 
                          String accountingAccountNumber, Long companyId) {
        this.itemNumber = itemNumber;
        this.name = name;
        this.nameEn = nameEn;
        this.defaultVatRate = defaultVatRate;
        this.accountingAccountNumber = accountingAccountNumber;
        this.companyId = companyId;
    }

    // Getters and Setters
    public String getItemNumber() {
        return itemNumber;
    }

    public void setItemNumber(String itemNumber) {
        this.itemNumber = itemNumber;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public BigDecimal getDefaultVatRate() {
        return defaultVatRate;
    }

    public void setDefaultVatRate(BigDecimal defaultVatRate) {
        this.defaultVatRate = defaultVatRate;
    }

    public String getAccountingAccountNumber() {
        return accountingAccountNumber;
    }

    public void setAccountingAccountNumber(String accountingAccountNumber) {
        this.accountingAccountNumber = accountingAccountNumber;
    }

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getUnitOfMeasure() {
        return unitOfMeasure;
    }

    public void setUnitOfMeasure(String unitOfMeasure) {
        this.unitOfMeasure = unitOfMeasure;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }
}