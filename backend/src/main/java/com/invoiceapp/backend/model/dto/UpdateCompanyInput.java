package com.invoiceapp.backend.model.dto;

public record UpdateCompanyInput(
    String name,
    String nameEn,
    String eik,
    String address,
    String vatNumber,
    String phone,
    String email,
    String website,
    Boolean isVatRegistered,
    String taxRegistrationDate,
    String logoUrl,
    String companyStampUrl,
    String signatureUrl,
    String invoiceFooter,
    String invoiceFooterEn,
    Integer defaultPaymentTerms,
    String compiledBy
) {}