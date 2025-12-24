package com.invoiceapp.backend.model;

/**
 * Модел за статистики на документи
 * Съдържа информация за броя документи по различни критерии
 */
public class DocumentStatistics {
    private int totalDocuments;
    private int draftDocuments;
    private int sentDocuments;
    private int paidDocuments;
    private int voidDocuments;
    private int overdueDocuments;
    private int taxDocuments;
    private int nonTaxDocuments;

    // Конструктор
    public DocumentStatistics(int totalDocuments, int draftDocuments, int sentDocuments, 
                            int paidDocuments, int voidDocuments, int overdueDocuments, 
                            int taxDocuments, int nonTaxDocuments) {
        this.totalDocuments = totalDocuments;
        this.draftDocuments = draftDocuments;
        this.sentDocuments = sentDocuments;
        this.paidDocuments = paidDocuments;
        this.voidDocuments = voidDocuments;
        this.overdueDocuments = overdueDocuments;
        this.taxDocuments = taxDocuments;
        this.nonTaxDocuments = nonTaxDocuments;
    }

    // Getters
    public int getTotalDocuments() {
        return totalDocuments;
    }

    public int getDraftDocuments() {
        return draftDocuments;
    }

    public int getSentDocuments() {
        return sentDocuments;
    }

    public int getPaidDocuments() {
        return paidDocuments;
    }

    public int getVoidDocuments() {
        return voidDocuments;
    }

    public int getOverdueDocuments() {
        return overdueDocuments;
    }

    public int getTaxDocuments() {
        return taxDocuments;
    }

    public int getNonTaxDocuments() {
        return nonTaxDocuments;
    }

    // Setters
    public void setTotalDocuments(int totalDocuments) {
        this.totalDocuments = totalDocuments;
    }

    public void setDraftDocuments(int draftDocuments) {
        this.draftDocuments = draftDocuments;
    }

    public void setSentDocuments(int sentDocuments) {
        this.sentDocuments = sentDocuments;
    }

    public void setPaidDocuments(int paidDocuments) {
        this.paidDocuments = paidDocuments;
    }

    public void setVoidDocuments(int voidDocuments) {
        this.voidDocuments = voidDocuments;
    }

    public void setOverdueDocuments(int overdueDocuments) {
        this.overdueDocuments = overdueDocuments;
    }

    public void setTaxDocuments(int taxDocuments) {
        this.taxDocuments = taxDocuments;
    }

    public void setNonTaxDocuments(int nonTaxDocuments) {
        this.nonTaxDocuments = nonTaxDocuments;
    }

    @Override
    public String toString() {
        return "DocumentStatistics{" +
                "totalDocuments=" + totalDocuments +
                ", draftDocuments=" + draftDocuments +
                ", sentDocuments=" + sentDocuments +
                ", paidDocuments=" + paidDocuments +
                ", voidDocuments=" + voidDocuments +
                ", overdueDocuments=" + overdueDocuments +
                ", taxDocuments=" + taxDocuments +
                ", nonTaxDocuments=" + nonTaxDocuments +
                '}';
    }
}