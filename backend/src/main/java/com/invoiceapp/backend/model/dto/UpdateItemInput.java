package com.invoiceapp.backend.model.dto;

import java.math.BigDecimal;

public class UpdateItemInput {
    private Long id;
    private String itemNumber;
    private String name;
    private String nameEn;
    private BigDecimal defaultVatRate;
    private String accountingAccountNumber;
    private String description;
    private String unitOfMeasure;
    private BigDecimal unitPrice;

    // Constructors
    public UpdateItemInput() {}

    public UpdateItemInput(Long id, String itemNumber, String name, String nameEn, 
                          BigDecimal defaultVatRate, String accountingAccountNumber) {
        this.id = id;
        this.itemNumber = itemNumber;
        this.name = name;
        this.nameEn = nameEn;
        this.defaultVatRate = defaultVatRate;
        this.accountingAccountNumber = accountingAccountNumber;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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