package com.invoiceapp.backend.model.dto;

/**
 * DTO за създаване на клиент с VIES интеграция
 * Поддържа автоматично попълване от VIES или ръчно въвеждане
 */
public record CreateClientWithViesInput(
    String companyId,
    String vatNumber,  // Ако е null/празен - ръчно въвеждане
    String name,       // За ръчно въвеждане
    String nameEn,     // За ръчно въвеждане
    String address,    // За ръчно въвеждане
    String eik,        // За ръчно въвеждане
    String contactPerson, // За ръчно въвеждане
    String phone,      // За ръчно въвеждане
    String email,      // За ръчно въвеждане
    String website,    // За ръчно въвеждане
    String clientType, // B2B/B2C
    Integer paymentTerms,
    Double creditLimit,
    Double discountPercent,
    Boolean isIndividual,
    Boolean forceManualEntry  // Принудително ръчно въвеждане дори с ДДС номер
) {}