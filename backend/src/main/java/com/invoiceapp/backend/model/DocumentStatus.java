package com.invoiceapp.backend.model;

/**
 * Enum за статусите на документи в системата
 * Опростена версия с 2 статуса за работа на счетоводители/мениджъри
 */
public enum DocumentStatus {
    DRAFT("DRAFT", "Чернова"),
    FINAL("FINAL", "Приключен"),
    CANCELLED("CANCELLED", "Анулиран");

    private final String value;
    private final String displayName;

    DocumentStatus(String value, String displayName) {
        this.value = value;
        this.displayName = displayName;
    }

    public String getValue() {
        return value;
    }

    public String getDisplayName() {
        return displayName;
    }

    /**
     * Проверява дали документът е приключен
     * @return true ако документът е приключен
     */
    public boolean isFinal() {
        return this == FINAL;
    }

    /**
     * Проверява дали документът е чернова
     * @return true ако документът е чернова
     */
    public boolean isDraft() {
        return this == DRAFT;
    }

    /**
     * Проверява дали документът е анулиран
     * @return true ако документът е анулиран
     */
    public boolean isCancelled() {
        return this == CANCELLED;
    }
}