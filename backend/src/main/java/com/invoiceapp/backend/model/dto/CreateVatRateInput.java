package com.invoiceapp.backend.model.dto;

import java.math.BigDecimal;

/**
 * DTO за създаване на ДДС ставка
 */
public record CreateVatRateInput(
    BigDecimal rateValue,
    String rateName,
    String rateNameEn,
    String description,
    Boolean isDefault,
    Integer sortOrder
) {}