package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "document_type_codes")
public class DocumentTypeCode {

    @Id
    @Column(length = 10, nullable = false)
    private String code; // UNCL1001 code

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en", nullable = false)
    private String nameEn;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "description_en", columnDefinition = "TEXT")
    private String descriptionEn;

    @Column(name = "applies_to", nullable = false)
    private String appliesTo; // INVOICE, CREDIT_NOTE, BOTH

    @Column(name = "is_common")
    private Boolean isCommon = false;

    @Column(name = "sort_order")
    private Integer sortOrder = 999;

    public DocumentTypeCode() {
    }

    public DocumentTypeCode(String code, String name, String nameEn, String appliesTo) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.appliesTo = appliesTo;
    }

    // Getters
    public String getCode() { return code; }
    public String getName() { return name; }
    public String getNameEn() { return nameEn; }
    public String getDescription() { return description; }
    public String getDescriptionEn() { return descriptionEn; }
    public String getAppliesTo() { return appliesTo; }
    public Boolean getIsCommon() { return isCommon; }
    public Integer getSortOrder() { return sortOrder; }

    // Setters
    public void setCode(String code) { this.code = code; }
    public void setName(String name) { this.name = name; }
    public void setNameEn(String nameEn) { this.nameEn = nameEn; }
    public void setDescription(String description) { this.description = description; }
    public void setDescriptionEn(String descriptionEn) { this.descriptionEn = descriptionEn; }
    public void setAppliesTo(String appliesTo) { this.appliesTo = appliesTo; }
    public void setIsCommon(Boolean isCommon) { this.isCommon = isCommon; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
}
