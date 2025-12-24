package com.invoiceapp.backend.model;

import jakarta.persistence.*;

@Entity
@Table(name = "units_of_measure")
public class UnitOfMeasure {

    @Id
    @Column(length = 10, nullable = false)
    private String code; // UN/ECE Rec 20 code (e.g., C62, KGM)

    @Column(nullable = false)
    private String name;

    @Column(name = "name_en")
    private String nameEn;

    @Column(name = "symbol")
    private String symbol;

    @Column(name = "category")
    private String category; // e.g., WEIGHT, LENGTH, TIME, UNIT

    public UnitOfMeasure() {
    }

    public UnitOfMeasure(String code, String name, String nameEn, String symbol, String category) {
        this.code = code;
        this.name = name;
        this.nameEn = nameEn;
        this.symbol = symbol;
        this.category = category;
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

    public String getSymbol() {
        return symbol;
    }

    public void setSymbol(String symbol) {
        this.symbol = symbol;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }
}
