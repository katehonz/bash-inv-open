package com.invoiceapp.backend.model.dto;

/**
 * DTO за обновяване на клиент
 */
public record UpdateClientInput(
    String name,
    String nameEn,
    String eik,
    String address,
    String vatNumber,
    String phone,
    String email,
    String website,
    String clientType,
    Boolean isEuVatPayer,
    Boolean isIndividual,
    Boolean isActive,
    String paymentTerms,
    Double creditLimit,
    Double discountPercent,
    String notes
) {
}
