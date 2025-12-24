package com.invoiceapp.backend.model.dto;

public record PublicDocumentInfo(
    String documentUuid,
    String documentNumber,
    String documentType,
    String issueDate,
    Double totalAmountWithVat,
    String currencyCode,
    String companyName,
    String companyEik,
    String clientName,
    Boolean isValid
) {}
