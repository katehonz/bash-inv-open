package com.invoiceapp.backend.model.dto;

public record CreateClientInput(
    String name,
    String nameEn,
    String address,
    String vatNumber,
    String eik,
    Long companyId
) {}
