package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "countries")
public class Country {

    @Id
    @Column(length = 2, nullable = false)
    private String code; // ISO 3166-1 alpha-2 (e.g., BG, DE)

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en")
    private String nameEn;

    @Column(name = "is_eu_member")
    private Boolean isEuMember = false;

    @Column(name = "peppol_scheme_id", length = 10)
    private String peppolSchemeId;

    public Country() {
    }

    public Country(String code, String name, String nameEn, Boolean isEuMember) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.isEuMember = isEuMember;
    }

    // Getters and Setters
    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
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

    public Boolean getIsEuMember() {
        return isEuMember;
    }

    public void setIsEuMember(Boolean isEuMember) {
        this.isEuMember = isEuMember;
    }

    public String getPeppolSchemeId() {
        return peppolSchemeId;
    }

    public void setPeppolSchemeId(String peppolSchemeId) {
        this.peppolSchemeId = peppolSchemeId;
    }
}
