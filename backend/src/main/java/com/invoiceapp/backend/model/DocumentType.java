package com.invoiceapp.backend.model;

/**
 * Enum за типовете документи в системата
 * Данъчни документи: INVOICE, CREDIT_NOTE, DEBIT_NOTE
 * Неданъчни документи: PROFORMA
 */
public enum DocumentType {
    INVOICE("INVOICE", SequenceType.TAX_DOCUMENT, "Фактура"),
    CREDIT_NOTE("CREDIT_NOTE", SequenceType.TAX_DOCUMENT, "Кредитно известие"),
    DEBIT_NOTE("DEBIT_NOTE", SequenceType.TAX_DOCUMENT, "Дебитно известие"),
    PROFORMA("PROFORMA", SequenceType.NON_TAX_DOCUMENT, "Проформа фактура");

    private final String value;
    private final SequenceType sequenceType;
    private final String displayName;

    DocumentType(String value, SequenceType sequenceType, String displayName) {
        this.value = value;
        this.sequenceType = sequenceType;
        this.displayName = displayName;
    }

    public String getValue() {
        return value;
    }

    public SequenceType getSequenceType() {
        return sequenceType;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Проверява дали документът е данъчен
     * @return true ако е данъчен документ
     */
    public boolean isTaxDocument() {
        return this.sequenceType == SequenceType.TAX_DOCUMENT;
    }

    /**
     * Проверява дали документът е неданъчен
     * @return true ако е неданъчен документ
     */
    public boolean isNonTaxDocument() {
        return this.sequenceType == SequenceType.NON_TAX_DOCUMENT;
    }
}