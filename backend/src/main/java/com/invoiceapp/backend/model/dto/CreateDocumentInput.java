package com.invoiceapp.backend.model.dto;

import com.invoiceapp.backend.model.DocumentType;
import java.time.LocalDate;
import java.util.List;

/**
 * DTO за създаване на документ чрез GraphQL API
 */
public class CreateDocumentInput {

    private DocumentType documentType;
    private LocalDate issueDate;
    private LocalDate vatDate;    // Дата на данъчното събитие - само за данъчни документи
    private LocalDate dueDate;
    private Long companyId;
    private Long clientId;
    private List<DocumentItemInput> items;
    private String currencyCode;
    private String notes;
    private Long paymentMethodId;
    private Long bankAccountId;

    // Getters
    public DocumentType getDocumentType() { return documentType; }
    public LocalDate getIssueDate() { return issueDate; }
    public LocalDate getVatDate() { return vatDate; }
    public LocalDate getDueDate() { return dueDate; }
    public Long getCompanyId() { return companyId; }
    public Long getClientId() { return clientId; }
    public List<DocumentItemInput> getItems() { return items; }
    public String getCurrencyCode() { return currencyCode; }
    public String getNotes() { return notes; }
    public Long getPaymentMethodId() { return paymentMethodId; }
    public Long getBankAccountId() { return bankAccountId; }

    // Setters
    public void setDocumentType(DocumentType documentType) { this.documentType = documentType; }
    public void setIssueDate(LocalDate issueDate) { this.issueDate = issueDate; }
    public void setVatDate(LocalDate vatDate) { this.vatDate = vatDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }
    public void setCompanyId(Long companyId) { this.companyId = companyId; }
    public void setClientId(Long clientId) { this.clientId = clientId; }
    public void setItems(List<DocumentItemInput> items) { this.items = items; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public void setNotes(String notes) { this.notes = notes; }
    public void setPaymentMethodId(Long paymentMethodId) { this.paymentMethodId = paymentMethodId; }
    public void setBankAccountId(Long bankAccountId) { this.bankAccountId = bankAccountId; }

    /**
     * Валидира входните данни
     */
    public void validate() {
        if (documentType == null) {
            throw new IllegalArgumentException("Document type is required");
        }
        if (issueDate == null) {
            throw new IllegalArgumentException("Issue date is required");
        }
        if (dueDate == null) {
            throw new IllegalArgumentException("Due date is required");
        }
        if (dueDate.isBefore(issueDate)) {
            throw new IllegalArgumentException("Due date cannot be before issue date");
        }
        
        // Валидация на VAT дата за данъчни документи
        if (documentType.isTaxDocument()) {
            if (vatDate == null) {
                throw new IllegalArgumentException("VAT date is required for tax documents");
            }
            if (vatDate.isBefore(issueDate)) {
                throw new IllegalArgumentException("VAT date cannot be before issue date");
            }
        } else {
            // За неданъчни документи VAT дата не трябва да се задава
            if (vatDate != null) {
                throw new IllegalArgumentException("VAT date should not be provided for non-tax documents");
            }
        }
        if (companyId == null) {
            throw new IllegalArgumentException("Company ID is required");
        }
        if (clientId == null) {
            throw new IllegalArgumentException("Client ID is required");
        }
        if (items == null || items.isEmpty()) {
            throw new IllegalArgumentException("Document must have at least one item");
        }
    }
}