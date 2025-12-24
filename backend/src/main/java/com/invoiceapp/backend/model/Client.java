package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "clients")
public class Client {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    private String address;

    @Column(name = "vat_number")
    private String vatNumber;

    @Column(name = "eik")
    private String eik; // ЕИК - Единен идентификационен код

    @Column(name = "name_en")
    private String nameEn; // English name

    // --- Contact Information ---
    @Column(name = "phone")
    private String phone; // Телефон

    @Column(name = "email")
    private String email; // Имейл

    @Column(name = "website")
    private String website; // Уебсайт

    // --- Additional Address Information ---
    @Column(name = "registration_address")
    private String registrationAddress; // Адрес по регистрация


    // --- Client Classification ---
    @Column(name = "client_type")
    private String clientType = "B2B"; // B2B, B2C

    @Column(name = "is_eu_vat_payer")
    private Boolean isEuVatPayer = false; // ДДС плащач в ЕС

    @Column(name = "country_code", length = 2)
    private String countryCode; // ISO 3166-1 alpha-2 код на държавата

    @Column(name = "is_individual")
    private Boolean isIndividual = false; // Физическо лице

    // --- Payment Settings ---
    @Column(name = "payment_terms")
    private Integer paymentTerms = 14; // Дни за плащане

    @Column(name = "credit_limit")
    private java.math.BigDecimal creditLimit; // Кредитен лимит

    @Column(name = "discount_percent")
    private java.math.BigDecimal discountPercent; // Отстъпка в проценти

    // --- Additional Info ---
    @Column(name = "notes")
    private String notes; // Бележки

    @Column(name = "is_active")
    private Boolean isActive = true; // Активен клиент

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

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

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getVatNumber() {
        return vatNumber;
    }

    public void setVatNumber(String vatNumber) {
        this.vatNumber = vatNumber;
    }

    public String getEik() {
        return eik;
    }

    public void setEik(String eik) {
        this.eik = eik;
    }

    public String getNameEn() {
        return nameEn;
    }

    public void setNameEn(String nameEn) {
        this.nameEn = nameEn;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

// --- Contact Information Getters/Setters ---
    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    // --- Additional Address Information Getters/Setters ---
    public String getRegistrationAddress() {
        return registrationAddress;
    }

    public void setRegistrationAddress(String registrationAddress) {
        this.registrationAddress = registrationAddress;
    }


    // --- Client Classification Getters/Setters ---
    public String getClientType() {
        return clientType;
    }

    public void setClientType(String clientType) {
        this.clientType = clientType;
    }

    public Boolean getIsEuVatPayer() {
        return isEuVatPayer;
    }

    public void setIsEuVatPayer(Boolean isEuVatPayer) {
        this.isEuVatPayer = isEuVatPayer;
    }

    public String getCountryCode() {
        return countryCode;
    }

    public void setCountryCode(String countryCode) {
        this.countryCode = countryCode;
    }

    public Boolean getIsIndividual() {
        return isIndividual;
    }

    public void setIsIndividual(Boolean isIndividual) {
        this.isIndividual = isIndividual;
    }

    // --- Payment Settings Getters/Setters ---
    public Integer getPaymentTerms() {
        return paymentTerms;
    }

    public void setPaymentTerms(Integer paymentTerms) {
        this.paymentTerms = paymentTerms;
    }

    public java.math.BigDecimal getCreditLimit() {
        return creditLimit;
    }

    public void setCreditLimit(java.math.BigDecimal creditLimit) {
        this.creditLimit = creditLimit;
    }

    public java.math.BigDecimal getDiscountPercent() {
        return discountPercent;
    }

    public void setDiscountPercent(java.math.BigDecimal discountPercent) {
        this.discountPercent = discountPercent;
    }

    // --- Additional Info Getters/Setters ---
    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public Boolean getIsActive() {
        return isActive;
    }

    public void setIsActive(Boolean isActive) {
        this.isActive = isActive;
    }

    public java.time.LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(java.time.LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public java.time.LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(java.time.LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // --- Helper Methods ---
    /**
     * Проверява дали клиентът е B2B
     */
    public boolean isB2B() {
        return "B2B".equals(clientType);
    }

    /**
     * Проверява дали клиентът е B2C
     */
    public boolean isB2C() {
        return "B2C".equals(clientType);
    }

    /**
     * Проверява дали клиентът е активен
     */
    public boolean isActive() {
        return isActive != null && isActive;
    }

    /**
     * Проверява дали клиентът е физическо лице
     */
    public boolean isIndividual() {
        return isIndividual != null && isIndividual;
    }

    /**
     * Проверява дали е ДДС плащач в ЕС
     */
    public boolean isEuVatPayer() {
        return isEuVatPayer != null && isEuVatPayer;
    }

    /**
     * Получава пълно наименование с ЕИК/ЕГН
     */
    public String getFullDisplayName() {
        if (eik != null && !eik.trim().isEmpty()) {
            String prefix = isIndividual() ? "ЕГН" : "ЕИК";
            return name + " (" + prefix + ": " + eik + ")";
        }
        return name;
    }

    /**
     * Получава адрес за доставка или основен адрес
     */
    /**
     * Получава адрес за доставка (използва основният адрес)
     */
    public String getEffectiveDeliveryAddress() {
        return address;
    }

    /**
     * Проверява дали има валиден кредитен лимит
     */
    public boolean hasValidCreditLimit() {
        return creditLimit != null && creditLimit.compareTo(java.math.BigDecimal.ZERO) > 0;
    }

    /**
     * Проверява дали има отстъпка
     */
    public boolean hasDiscount() {
        return discountPercent != null && discountPercent.compareTo(java.math.BigDecimal.ZERO) > 0;
    }

    // --- JPA Lifecycle Methods ---
    @jakarta.persistence.PrePersist
    public void onPrePersist() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
    }

    @jakarta.persistence.PreUpdate
    public void onPreUpdate() {
        this.updatedAt = java.time.LocalDateTime.now();
    }

}
