package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "vat_exemption_reasons")
public class VatExemptionReason {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "reason_code", nullable = false, unique = true)
    private String reasonCode; // Код на основанието (например: "ART21", "ART22", etc.)

    @Column(name = "reason_name", nullable = false)
    private String reasonName; // Наименование на български

    @Column(name = "reason_name_en")
    private String reasonNameEn; // Наименование на английски

    @Column(name = "legal_basis", nullable = false)
    private String legalBasis; // Правно основание (например: "чл. 21 от ЗДДС")

    @Column(name = "legal_basis_en")
    private String legalBasisEn; // Правно основание на английски

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description; // Подробно описание

    @Column(name = "sort_order")
    private Integer sortOrder; // За подреждане в списъци

    @Column(name = "ubl_category_code", length = 3)
    private String ublCategoryCode; // UBL VAT Category: S, Z, E, K, G, O, AE

    @Column(name = "ubl_exemption_code", length = 50)
    private String ublExemptionCode; // UBL Exemption Code: vatex-eu-ic, vatex-eu-o, etc.

    // Constructors
    public VatExemptionReason() {}

    public VatExemptionReason(String reasonCode, String reasonName, String reasonNameEn, 
                             String legalBasis, String legalBasisEn) {
        this.reasonCode = reasonCode;
        this.reasonName = reasonName;
        this.reasonNameEn = reasonNameEn;
        this.legalBasis = legalBasis;
        this.legalBasisEn = legalBasisEn;
        this.isActive = true;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getReasonCode() {
        return reasonCode;
    }

    public void setReasonCode(String reasonCode) {
        this.reasonCode = reasonCode;
    }

    public String getReasonName() {
        return reasonName;
    }

    public void setReasonName(String reasonName) {
        this.reasonName = reasonName;
    }

    public String getReasonNameEn() {
        return reasonNameEn;
    }

    public void setReasonNameEn(String reasonNameEn) {
        this.reasonNameEn = reasonNameEn;
    }

    public String getLegalBasis() {
        return legalBasis;
    }

    public void setLegalBasis(String legalBasis) {
        this.legalBasis = legalBasis;
    }

    public String getLegalBasisEn() {
        return legalBasisEn;
    }

    public void setLegalBasisEn(String legalBasisEn) {
        this.legalBasisEn = legalBasisEn;
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

    public Integer getSortOrder() {
        return sortOrder;
    }

    public void setSortOrder(Integer sortOrder) {
        this.sortOrder = sortOrder;
    }

    public String getUblCategoryCode() {
        return ublCategoryCode;
    }

    public void setUblCategoryCode(String ublCategoryCode) {
        this.ublCategoryCode = ublCategoryCode;
    }

    public String getUblExemptionCode() {
        return ublExemptionCode;
    }

    public void setUblExemptionCode(String ublExemptionCode) {
        this.ublExemptionCode = ublExemptionCode;
    }

    /**
     * Helper method to get full reason description
     * @return formatted reason with legal basis
     */
    public String getFullReason() {
        return reasonName + " (" + legalBasis + ")";
    }

    /**
     * Helper method to get full reason description in English
     * @return formatted reason with legal basis in English
     */
    public String getFullReasonEn() {
        if (reasonNameEn != null && legalBasisEn != null) {
            return reasonNameEn + " (" + legalBasisEn + ")";
        }
        return getFullReason(); // fallback to Bulgarian
    }
}