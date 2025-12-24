package com.invoiceapp.backend.model.dto;

import com.invoiceapp.backend.model.DocumentType;
import java.time.LocalDate;

/**
 * DTO за копиране на документ в друг тип документ.
 * Поддържа:
 * - Проформа → Фактура
 * - Фактура → Кредитно известие (с обръщане на знака)
 * - Фактура → Дебитно известие
 * - Всеки документ → същия тип (дублиране)
 */
public class CopyDocumentInput {

    private Long sourceDocumentId;
    private DocumentType targetDocumentType;
    private LocalDate issueDate;
    private LocalDate vatDate;    // Само за данъчни документи
    private LocalDate dueDate;

    // Getters
    public Long getSourceDocumentId() { return sourceDocumentId; }
    public DocumentType getTargetDocumentType() { return targetDocumentType; }
    public LocalDate getIssueDate() { return issueDate; }
    public LocalDate getVatDate() { return vatDate; }
    public LocalDate getDueDate() { return dueDate; }

    // Setters
    public void setSourceDocumentId(Long sourceDocumentId) { this.sourceDocumentId = sourceDocumentId; }
    public void setTargetDocumentType(DocumentType targetDocumentType) { this.targetDocumentType = targetDocumentType; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public void setVatDate(LocalDate vatDate) { this.vatDate = vatDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    /**
     * Валидира входните данни
     */
    public void validate() {
        if (sourceDocumentId == null) {
            throw new IllegalArgumentException("Source document ID is required");
        }
        if (targetDocumentType == null) {
            throw new IllegalArgumentException("Target document type is required");
        }

        // Ако е зададена дата на падеж и дата на издаване, проверяваме
        if (issueDate != null && dueDate != null && dueDate.isBefore(issueDate)) {
            throw new IllegalArgumentException("Due date cannot be before issue date");
        }

        // Валидация на VAT дата за данъчни документи
        if (targetDocumentType.isTaxDocument()) {
            if (vatDate != null && issueDate != null && vatDate.isBefore(issueDate)) {
                throw new IllegalArgumentException("VAT date cannot be before issue date");
            }
        }
    }
}
