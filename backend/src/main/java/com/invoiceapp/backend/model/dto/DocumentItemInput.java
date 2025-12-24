package com.invoiceapp.backend.model.dto;

import java.math.BigDecimal;

public class DocumentItemInput {

    private Long itemId;
    private BigDecimal quantity;
    private BigDecimal unitPrice;
    private BigDecimal vatRate;
    private Long vatRateId;
    private Long vatExemptionReasonId;
    private String itemDescription;

    // Getters and Setters
    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public BigDecimal getQuantity() {
        return quantity;
    }

    public void setQuantity(BigDecimal quantity) {
        this.quantity = quantity;
    }

    public BigDecimal getUnitPrice() {
        return unitPrice;
    }

    public void setUnitPrice(BigDecimal unitPrice) {
        this.unitPrice = unitPrice;
    }

    public BigDecimal getVatRate() {
        return vatRate;
    }

    public void setVatRate(BigDecimal vatRate) {
        this.vatRate = vatRate;
    }

    public String getItemDescription() {
        return itemDescription;
    }

    public void setItemDescription(String itemDescription) {
        this.itemDescription = itemDescription;
    }

    public Long getVatRateId() {
        return vatRateId;
    }

    public void setVatRateId(Long vatRateId) {
        this.vatRateId = vatRateId;
    }

    public Long getVatExemptionReasonId() {
        return vatExemptionReasonId;
    }

    public void setVatExemptionReasonId(Long vatExemptionReasonId) {
        this.vatExemptionReasonId = vatExemptionReasonId;
    }
}
