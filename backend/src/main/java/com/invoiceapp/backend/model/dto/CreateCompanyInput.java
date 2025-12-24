package com.invoiceapp.backend.model.dto;

public record CreateCompanyInput(
    String name,
    String nameEn,
    String address,
    String vatNumber,
    String eik,
    String phone,
    String email,
    String website,
    Integer userLimit
) {}
