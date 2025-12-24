package com.invoiceapp.backend.model.dto;

/**
 * DTO за броя документи на клиент
 */
public record ClientDocumentsCount(
    long totalDocuments,
    boolean hasDocuments
) {
}
