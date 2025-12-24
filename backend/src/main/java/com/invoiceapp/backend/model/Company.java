package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "companies")
public class Company {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String address;

    @Column(name = "vat_number")
    private String vatNumber;

    @Column(name = "eik")
    private String eik; // ЕИК - номер на търговския регистър

    @Column(name = "name_en")
    private String nameEn; // English name

    // --- Contact Information ---
    @Column(name = "phone")
    private String phone; // Телефон на фирмата

    @Column(name = "email")
    private String email; // Имейл на фирмата

    @Column(name = "website")
    private String website; // Уебсайт


    // --- Branding ---
    @Column(name = "logo_url")
    private String logoUrl; // URL към логото

    @Column(name = "signature_url")
    private String signatureUrl; // URL към подпис

    @Column(name = "company_stamp_url")
    private String companyStampUrl; // URL към печат

    // --- Subscription ---
    @Column(name = "subscription_plan")
    private String subscriptionPlan = "FREE"; // FREE, PRO, BUSINESS, ENTERPRISE

    @Column(name = "user_limit", nullable = false)
    private int userLimit = 2; // По подразбиране, например 2 за безплатен план

    // --- Additional Settings ---
    @Column(name = "tax_registration_date")
    private java.time.LocalDate taxRegistrationDate; // Дата на регистрация за ДДС

    @Column(name = "is_vat_registered", nullable = false)
    private Boolean isVatRegistered = false; // Дали е регистриран за ДДС

    @Column(name = "default_payment_terms")
    private Integer defaultPaymentTerms = 14; // Дни за плащане по подразбиране

    @Column(name = "invoice_footer")
    private String invoiceFooter; // Долен текст на фактури

    @Column(name = "invoice_footer_en")
    private String invoiceFooterEn; // Долен текст на фактури (английски)

    @Column(name = "compiled_by")
    private String compiledBy; // Име на съставителя на фактурите

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<User> users;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PaymentMethod> paymentMethods;

    @OneToMany(mappedBy = "company", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<BankAccount> bankAccounts;

    public Integer getActiveUserCount() {
        if (users == null) {
            return 0;
        }
        return (int) users.stream().filter(User::getIsActive).count();
    }

    public String getAdminUsername() {
        if (users == null) {
            return null;
        }
        return users.stream()
                .filter(user -> user.getRole().equals(Role.ADMIN))
                .map(User::getUsername)
                .findFirst()
                .orElse(null);
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


    // --- Branding Getters/Setters ---
    public String getLogoUrl() {
        return logoUrl;
    }

    public void setLogoUrl(String logoUrl) {
        this.logoUrl = logoUrl;
    }

    public String getSignatureUrl() {
        return signatureUrl;
    }

    public void setSignatureUrl(String signatureUrl) {
        this.signatureUrl = signatureUrl;
    }

    public String getCompanyStampUrl() {
        return companyStampUrl;
    }

    public void setCompanyStampUrl(String companyStampUrl) {
        this.companyStampUrl = companyStampUrl;
    }

    // --- Subscription Getters/Setters ---
    public String getSubscriptionPlan() {
        return subscriptionPlan;
    }

    public void setSubscriptionPlan(String subscriptionPlan) {
        this.subscriptionPlan = subscriptionPlan;
    }

    public int getUserLimit() {
        return userLimit;
    }

    public void setUserLimit(int userLimit) {
        this.userLimit = userLimit;
    }

    // --- Additional Settings Getters/Setters ---
    public java.time.LocalDate getTaxRegistrationDate() {
        return taxRegistrationDate;
    }

    public void setTaxRegistrationDate(java.time.LocalDate taxRegistrationDate) {
        this.taxRegistrationDate = taxRegistrationDate;
    }

    public Boolean getIsVatRegistered() {
        return isVatRegistered;
    }

    public void setIsVatRegistered(Boolean isVatRegistered) {
        this.isVatRegistered = isVatRegistered;
    }

    public Integer getDefaultPaymentTerms() {
        return defaultPaymentTerms;
    }

    public void setDefaultPaymentTerms(Integer defaultPaymentTerms) {
        this.defaultPaymentTerms = defaultPaymentTerms;
    }

    public String getInvoiceFooter() {
        return invoiceFooter;
    }

    public void setInvoiceFooter(String invoiceFooter) {
        this.invoiceFooter = invoiceFooter;
    }

    public String getInvoiceFooterEn() {
        return invoiceFooterEn;
    }

    public void setInvoiceFooterEn(String invoiceFooterEn) {
        this.invoiceFooterEn = invoiceFooterEn;
    }

    public String getCompiledBy() {
        return compiledBy;
    }

    public void setCompiledBy(String compiledBy) {
        this.compiledBy = compiledBy;
    }

    public List<User> getUsers() {
        return users;
    }

    public void setUsers(List<User> users) {
        this.users = users;
    }

    public List<PaymentMethod> getPaymentMethods() {
        return paymentMethods;
    }

    public void setPaymentMethods(List<PaymentMethod> paymentMethods) {
        this.paymentMethods = paymentMethods;
    }

    public List<BankAccount> getBankAccounts() {
        return bankAccounts;
    }

    public void setBankAccounts(List<BankAccount> bankAccounts) {
        this.bankAccounts = bankAccounts;
    }

    // --- Helper Methods ---
    /**
     * Проверява дали фирмата е регистрирана за ДДС
     */
    public boolean isVatRegistered() {
        return isVatRegistered != null && isVatRegistered;
    }


    /**
     * Проверява дали е премиум план
     */
    public boolean isPremiumPlan() {
        return !"FREE".equals(subscriptionPlan);
    }

    /**
     * Получава пълно наименование с ЕИК
     */
    public String getFullDisplayName() {
        if (eik != null && !eik.trim().isEmpty()) {
            return name + " (ЕИК: " + eik + ")";
        }
        return name;
    }
}
