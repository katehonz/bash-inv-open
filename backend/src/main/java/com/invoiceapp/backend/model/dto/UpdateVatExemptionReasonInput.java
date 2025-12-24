package com.invoiceapp.backend.model.dto;

/**
 * DTO за обновяване на основание за неначисляване на ДДС
 */
public record UpdateVatExemptionReasonInput(
    String id,
    String reasonCode,
    String reasonName,
    String reasonNameEn,
    String legalBasis,
    String legalBasisEn,
    String description,
    Integer sortOrder,
    Boolean isActive
) {}