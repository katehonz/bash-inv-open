package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "bank_accounts")
public class BankAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bank_name", nullable = false)
    private String bankName;

    @Column(name = "iban", nullable = false)
    private String iban;

    @Column(name = "bic", nullable = false)
    private String bic;

    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode; // ISO 4217 currency code (BGN, USD, EUR, etc.)

    @Column(name = "account_name")
    private String accountName; // Optional descriptive name for the account

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "is_default", nullable = false)
    private Boolean isDefault = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 0;

    @Column(name = "description")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // Constructors
    public BankAccount() {}

    public BankAccount(String bankName, String iban, String bic, String currencyCode, Company company) {
        this.bankName = bankName;
        this.iban = iban;
        this.bic = bic;
        this.currencyCode = currencyCode;
        this.company = company;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBankName() {
        return bankName;
    }

    public void setBankName(String bankName) {
        this.bankName = bankName;
    }

    public String getIban() {
        return iban;
    }

    public void setIban(String iban) {
        this.iban = iban;
    }

    public String getBic() {
        return bic;
    }

    public void setBic(String bic) {
        this.bic = bic;
    }

    public String getCurrencyCode() {
        return currencyCode;
    }

    public void setCurrencyCode(String currencyCode) {
        this.currencyCode = currencyCode;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
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

    public String getDisplayName() {
        if (accountName != null && !accountName.trim().isEmpty()) {
            return accountName + " (" + bankName + ")";
        }
        return bankName + " - " + iban;
    }

    public String getFormattedIban() {
        if (iban != null && iban.length() > 4) {
            // Format IBAN with spaces every 4 characters for readability
            return iban.replaceAll("(.{4})", "$1 ").trim();
        }
        return iban;
    }

    public boolean isBgnAccount() {
        return "BGN".equals(currencyCode);
    }

    public boolean isForeignCurrencyAccount() {
        return !"BGN".equals(currencyCode);
    }
}