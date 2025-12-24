package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "documents", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"company_id", "document_type", "document_number"})
})
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "document_uuid", nullable = false, unique = true, updatable = false)
    private String documentUuid;

    @Column(name = "document_number", nullable = false, length = 10)
    private String documentNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false)
    private DocumentType documentType;

    @Column(name = "issue_date", nullable = false)
    private LocalDate issueDate;

    @Column(name = "vat_date")
    private LocalDate vatDate;

    @Column(name = "due_date", nullable = false)
    private LocalDate dueDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private DocumentStatus status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @OneToMany(mappedBy = "document", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DocumentItem> documentItems;

    // --- Payment and Banking Fields ---
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payment_method_id")
    private PaymentMethod paymentMethod;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bank_account_id")
    private BankAccount bankAccount;

    // --- Currency and Amount Fields ---
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "currency_code", nullable = false)
    private Currency currency;

    @Column(name = "exchange_rate", precision = 19, scale = 9)
    private BigDecimal exchangeRate;

    @Column(name = "exchange_rate_date")
    private LocalDate exchangeRateDate;

    // Amounts in document currency
    @Column(name = "subtotal_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalAmount; // Amount before VAT

    @Column(name = "vat_amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal vatAmount;

    @Column(name = "total_amount_with_vat", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmountWithVat; // subtotalAmount + vatAmount

    // Amounts in base currency
    @Column(name = "subtotal_amount_base_currency", nullable = false, precision = 15, scale = 2)
    private BigDecimal subtotalAmountBaseCurrency;

    @Column(name = "vat_amount_base_currency", nullable = false, precision = 15, scale = 2)
    private BigDecimal vatAmountBaseCurrency;

    @Column(name = "total_amount_with_vat_base_currency", nullable = false, precision = 15, scale = 2)
    private BigDecimal totalAmountWithVatBaseCurrency;

    // --- Timestamps ---
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Constructors
    public Document() {
        this.status = DocumentStatus.DRAFT;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDocumentUuid() {
        return documentUuid;
    }

    public void setDocumentUuid(String documentUuid) {
        this.documentUuid = documentUuid;
    }

    public String getDocumentNumber() {
        return documentNumber;
    }

    public void setDocumentNumber(String documentNumber) {
        this.documentNumber = documentNumber;
    }

    public DocumentType getDocumentType() {
        return documentType;
    }

    public void setDocumentType(DocumentType documentType) {
        this.documentType = documentType;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getVatDate() {
        return vatDate;
    }

    public void setVatDate(LocalDate vatDate) {
        if (this.documentType != null && this.documentType.isTaxDocument()) {
            this.vatDate = vatDate;
        }
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public DocumentStatus getStatus() {
        return status;
    }

    public void setStatus(DocumentStatus status) {
        this.status = status;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Client getClient() {
        return client;
    }

    public void setClient(Client client) {
        this.client = client;
    }

    public List<DocumentItem> getDocumentItems() {
        return documentItems;
    }

    public void setDocumentItems(List<DocumentItem> documentItems) {
        this.documentItems = documentItems;
    }

    public Currency getCurrency() {
        return currency;
    }

    public void setCurrency(Currency currency) {
        this.currency = currency;
    }

    public BigDecimal getExchangeRate() {
        return exchangeRate;
    }

    public void setExchangeRate(BigDecimal exchangeRate) {
        this.exchangeRate = exchangeRate;
    }

    public LocalDate getExchangeRateDate() {
        return exchangeRateDate;
    }

    public void setExchangeRateDate(LocalDate exchangeRateDate) {
        this.exchangeRateDate = exchangeRateDate;
    }

    public BigDecimal getSubtotalAmount() {
        return subtotalAmount;
    }

    public void setSubtotalAmount(BigDecimal subtotalAmount) {
        this.subtotalAmount = subtotalAmount;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getTotalAmountWithVat() {
        return totalAmountWithVat;
    }

    public void setTotalAmountWithVat(BigDecimal totalAmountWithVat) {
        this.totalAmountWithVat = totalAmountWithVat;
    }

    public BigDecimal getSubtotalAmountBaseCurrency() {
        return subtotalAmountBaseCurrency;
    }

    public void setSubtotalAmountBaseCurrency(BigDecimal subtotalAmountBaseCurrency) {
        this.subtotalAmountBaseCurrency = subtotalAmountBaseCurrency;
    }

    public BigDecimal getVatAmountBaseCurrency() {
        return vatAmountBaseCurrency;
    }

    public void setVatAmountBaseCurrency(BigDecimal vatAmountBaseCurrency) {
        this.vatAmountBaseCurrency = vatAmountBaseCurrency;
    }

    public BigDecimal getTotalAmountWithVatBaseCurrency() {
        return totalAmountWithVatBaseCurrency;
    }

    public void setTotalAmountWithVatBaseCurrency(BigDecimal totalAmountWithVatBaseCurrency) {
        this.totalAmountWithVatBaseCurrency = totalAmountWithVatBaseCurrency;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // Helper methods
    public boolean isTaxDocument() {
        return documentType != null && documentType.isTaxDocument();
    }

    @PrePersist
    public void onPrePersist() {
        LocalDateTime now = LocalDateTime.now();
        this.createdAt = now;
        this.updatedAt = now;
        if (this.documentUuid == null) {
            this.documentUuid = UUID.randomUUID().toString();
        }
    }

    @PreUpdate
    public void onPreUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // --- Payment tracking ---
    @Column(name = "paid_at")
    private LocalDateTime paidAt;

    // --- Cancellation fields ---
    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "cancellation_reason")
    private String cancellationReason;

    // --- Additional fields for GraphQL ---

    @Column(name = "notes")
    private String notes;

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    // --- Derived fields for GraphQL ---

    public Long getClientId() {
        return (client != null) ? client.getId() : null;
    }

    public String getClientName() {
        return (client != null) ? client.getName() : null;
    }

    public String getCurrencyCode() {
        return (currency != null) ? currency.getCode() : null;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public BankAccount getBankAccount() {
        return bankAccount;
    }

    public void setBankAccount(BankAccount bankAccount) {
        this.bankAccount = bankAccount;
    }

    public LocalDateTime getPaidAt() {
        return paidAt;
    }

    public void setPaidAt(LocalDateTime paidAt) {
        this.paidAt = paidAt;
    }

    /**
     * Determines if the document is considered paid.
     * Documents with CASH or CARD payment methods are automatically paid.
     * Other documents are paid if paidAt is set.
     */
    public boolean isPaid() {
        if (paymentMethod != null) {
            String code = paymentMethod.getMethodCode();
            if ("CASH".equals(code) || "CARD".equals(code)) {
                return true;
            }
        }
        return paidAt != null;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public String getCancellationReason() {
        return cancellationReason;
    }

    public void setCancellationReason(String cancellationReason) {
        this.cancellationReason = cancellationReason;
    }

    /**
     * Determines if the document is cancelled.
     */
    public boolean isCancelled() {
        return status == DocumentStatus.CANCELLED;
    }
}