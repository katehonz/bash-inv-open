package com.invoiceapp.backend.model.dto;

/**
 * DTO за създаване на основание за неначисляване на ДДС
 */
public record CreateVatExemptionReasonInput(
    String reasonCode,
    String reasonName,
    String reasonNameEn,
    String legalBasis,
    String legalBasisEn,
    String description,
    Integer sortOrder
) {}