package com.invoiceapp.backend.model.dto;

import com.invoiceapp.backend.model.DocumentStatus;

public class RecentInvoice {
    private Long id;
    private String documentNumber;
    private String clientName;
    private Double totalAmountWithVat;
    private String currency;
    private String issueDate;
    private String dueDate;
    private DocumentStatus status;

    public RecentInvoice() {}

    public RecentInvoice(Long id, String documentNumber, String clientName, 
                        Double totalAmountWithVat, String currency, String issueDate, 
                        String dueDate, DocumentStatus status) {
        this.id = id;
        this.documentNumber = documentNumber;
        this.clientName = clientName;
        this.totalAmountWithVat = totalAmountWithVat;
        this.currency = currency;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.status = status;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

    public String getClientName() {
        return clientName;
    }

    public void setClientName(String clientName) {
        this.clientName = clientName;
    }

    public Double getTotalAmountWithVat() {
        return totalAmountWithVat;
    }

    public void setTotalAmountWithVat(Double totalAmountWithVat) {
        this.totalAmountWithVat = totalAmountWithVat;
    }

    public String getCurrency() {
        return currency;
    }

    public void setCurrency(String currency) {
        this.currency = currency;
    }

    public String getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(String issueDate) {
        this.issueDate = issueDate;
    }

    public String getDueDate() {
        return dueDate;
    }

    public void setDueDate(String dueDate) {
        this.dueDate = dueDate;
    }

    public DocumentStatus getStatus() {
        return status;
    }

    public void setStatus(DocumentStatus status) {
        this.status = status;
    }
}