package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "payment_methods", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "method_code"})
})
public class PaymentMethod {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en")
    private String nameEn;

    @Column(name = "method_code", nullable = false)
    private String methodCode; // BANK_TRANSFER, CASH, CARD, PAYPAL, PAYBG

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "requires_bank_account", nullable = false)
    private Boolean requiresBankAccount = false; // true for BANK_TRANSFER

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "description")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // Constructors
    public PaymentMethod() {}

    public PaymentMethod(String name, String methodCode, Company company) {
        this.name = name;
        this.methodCode = methodCode;
        this.company = company;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
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

    public String getMethodCode() {
        return methodCode;
    }

    public void setMethodCode(String methodCode) {
        this.methodCode = methodCode;
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

    public Boolean getRequiresBankAccount() {
        return requiresBankAccount;
    }

    public void setRequiresBankAccount(Boolean requiresBankAccount) {
        this.requiresBankAccount = requiresBankAccount;
    }

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    // Helper methods
    public boolean isActive() {
        return isActive != null && isActive;
    }

    public boolean isDefault() {
        return isDefault != null && isDefault;
    }

    public boolean requiresBankAccount() {
        return requiresBankAccount != null && requiresBankAccount;
    }

    public String getEffectiveName() {
        return name != null ? name : methodCode;
    }
}