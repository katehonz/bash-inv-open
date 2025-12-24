package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "document_items")
public class DocumentItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    private Document document;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(name = "quantity", nullable = false, precision = 10, scale = 3)
    private BigDecimal quantity;

    @Column(name = "unit_price", nullable = false, precision = 10, scale = 2)
    private BigDecimal unitPrice;

    @Column(name = "vat_rate", nullable = false, precision = 5, scale = 2)
    private BigDecimal vatRate; // VAT rate for this line item

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vat_exemption_reason_id")
    private VatExemptionReason vatExemptionReason; // Only for 0% VAT items

    @Column(name = "line_total", nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotal; // quantity * unitPrice

    @Column(name = "vat_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal vatAmount; // VAT amount for this line

    @Column(name = "line_total_with_vat", nullable = false, precision = 10, scale = 2)
    private BigDecimal lineTotalWithVat; // lineTotal + vatAmount

    @Column(name = "item_description")
    private String itemDescription; // Custom description for this document line

    @Column(name = "item_description_en")
    private String itemDescriptionEn; // Custom English description

    @Column(name = "line_number")
    private Integer lineNumber; // Line number in the document

    // Constructors
    public DocumentItem() {}

    public DocumentItem(Document document, Item item, BigDecimal quantity, BigDecimal unitPrice, BigDecimal vatRate) {
        this.document = document;
        this.item = item;
        this.quantity = quantity;
        this.unitPrice = unitPrice;
        this.vatRate = vatRate;
        calculateAmounts();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Document getDocument() {
        return document;
    }

    public void setDocument(Document document) {
        this.document = document;
    }

    public Item getItem() {
        return item;
    }

    public void setItem(Item item) {
        this.item = item;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
        calculateAmounts();
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
        calculateAmounts();
    }

    public BigDecimal getVatRate() {
        return vatRate;
    }

    public void setVatRate(BigDecimal vatRate) {
        this.vatRate = vatRate;
        calculateAmounts();
    }

    public VatExemptionReason getVatExemptionReason() {
        return vatExemptionReason;
    }

    public void setVatExemptionReason(VatExemptionReason vatExemptionReason) {
        this.vatExemptionReason = vatExemptionReason;
    }

    public BigDecimal getLineTotal() {
        return lineTotal;
    }

    public void setLineTotal(BigDecimal lineTotal) {
        this.lineTotal = lineTotal;
    }

    public BigDecimal getVatAmount() {
        return vatAmount;
    }

    public void setVatAmount(BigDecimal vatAmount) {
        this.vatAmount = vatAmount;
    }

    public BigDecimal getLineTotalWithVat() {
        return lineTotalWithVat;
    }

    public void setLineTotalWithVat(BigDecimal lineTotalWithVat) {
        this.lineTotalWithVat = lineTotalWithVat;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public String getItemDescriptionEn() {
        return itemDescriptionEn;
    }

    public void setItemDescriptionEn(String itemDescriptionEn) {
        this.itemDescriptionEn = itemDescriptionEn;
    }

    public Integer getLineNumber() {
        return lineNumber;
    }

    public void setLineNumber(Integer lineNumber) {
        this.lineNumber = lineNumber;
    }

    /**
     * Calculate line amounts based on quantity, unit price, and VAT rate
     */
    public void calculateAmounts() {
        if (quantity != null && unitPrice != null && vatRate != null) {
            this.lineTotal = quantity.multiply(unitPrice);
            this.vatAmount = lineTotal.multiply(vatRate).divide(new BigDecimal("100"));
            this.lineTotalWithVat = lineTotal.add(vatAmount);
        }
    }

    /**
     * Get the effective item name (custom description or item name)
     */
    public String getEffectiveItemName() {
        if (itemDescription != null && !itemDescription.trim().isEmpty()) {
            return itemDescription;
        }
        return item != null ? item.getName() : "";
    }

    /**
     * Get the effective item name in English (custom description or item name)
     */
    public String getEffectiveItemNameEn() {
        if (itemDescriptionEn != null && !itemDescriptionEn.trim().isEmpty()) {
            return itemDescriptionEn;
        }
        return item != null ? item.getNameEn() : "";
    }

    /**
     * Check if this line item has zero VAT rate
     */
    public boolean isZeroVatRate() {
        return vatRate != null && vatRate.compareTo(BigDecimal.ZERO) == 0;
    }

    /**
     * Check if this line item requires VAT exemption reason
     */
    public boolean requiresVatExemptionReason() {
        return isZeroVatRate() && document != null && document.isTaxDocument();
    }

    /**
     * Callback method for automatic calculation before persist/update
     */
    @PrePersist
    @PreUpdate
    public void prePersist() {
        calculateAmounts();
    }
}