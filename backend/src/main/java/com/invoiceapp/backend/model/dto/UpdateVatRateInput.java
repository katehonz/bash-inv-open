package com.invoiceapp.backend.model.dto;

import java.math.BigDecimal;

/**
 * DTO за обновяване на ДДС ставка
 */
public record UpdateVatRateInput(
    String id,
    BigDecimal rateValue,
    String rateName,
    String rateNameEn,
    String description,
    Boolean isDefault,
    Integer sortOrder,
    Boolean isActive
) {}