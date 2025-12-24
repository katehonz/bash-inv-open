package com.invoiceapp.backend.model;

/**
 * Enum за типовете последователности на номерациите
 * TAX_DOCUMENT - за данъчни документи (фактури, кредитни и дебитни известия)
 * NON_TAX_DOCUMENT - за неданъчни документи (проформа фактури)
 */
public enum SequenceType {
    TAX_DOCUMENT("TAX_DOCUMENT", "Данъчни документи"),
    NON_TAX_DOCUMENT("NON_TAX_DOCUMENT", "Неданъчни документи");

    private final String value;
    private final String displayName;

    SequenceType(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public String getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }
}