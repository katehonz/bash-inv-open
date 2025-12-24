package com.invoiceapp.backend.model.dto;

public class CreatePaymentMethodInput {
    private String name;
    private String nameEn;
    private String methodCode;
    private Boolean requiresBankAccount;
    private Integer sortOrder;
    private String description;
    private Long companyId;
    private Boolean isDefault;

    // Constructors
    public CreatePaymentMethodInput() {}

    // Getters and Setters
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

    public Long getCompanyId() {
        return companyId;
    }

    public void setCompanyId(Long companyId) {
        this.companyId = companyId;
    }

    public Boolean getIsDefault() {
        return isDefault;
    }

    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }
}