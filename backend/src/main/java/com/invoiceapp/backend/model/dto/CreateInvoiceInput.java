package com.invoiceapp.backend.model.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CreateInvoiceInput(
    String invoiceNumber,
    LocalDate issueDate,
    LocalDate dueDate,
    BigDecimal totalAmount,
    Long companyId,
    Long clientId
) {}
