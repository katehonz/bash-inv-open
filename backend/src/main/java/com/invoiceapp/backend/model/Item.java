package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "items", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "item_number"})
})
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "item_number", nullable = false)
    private String itemNumber;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en")
    private String nameEn; // English name

    @Column(name = "default_vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal defaultVatRate; // Default VAT % (e.g., 20.00)

    @Column(name = "accounting_account_number")
    private String accountingAccountNumber; // Номер на счетоводна сметка

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "description")
    private String description;

    @Column(name = "unit_of_measure")
    private String unitOfMeasure; // мера (бр., кг., л., и т.н.)

    @Column(name = "unit_price", precision = 10, scale = 2)
    private BigDecimal unitPrice; // Единична цена

    // Constructors
    public Item() {}

    public Item(String itemNumber, String name, String nameEn, BigDecimal defaultVatRate, 
                String accountingAccountNumber, Company company) {
        this.itemNumber = itemNumber;
        this.name = name;
        this.nameEn = nameEn;
        this.defaultVatRate = defaultVatRate;
        this.accountingAccountNumber = accountingAccountNumber;
        this.company = company;
        this.isActive = true;
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

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
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