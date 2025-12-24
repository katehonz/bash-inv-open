package com.invoiceapp.backend.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Entity за управление на последователностите на номерациите на документи
 * Всяка фирма има отделни последователности за данъчни и неданъчни документи
 */
@Entity
@Table(name = "document_number_sequences")
public class DocumentNumberSequence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Enumerated(EnumType.STRING)
    @Column(name = "sequence_type", nullable = false)
    private SequenceType sequenceType;

    @Column(name = "current_number", nullable = false)
    private Long currentNumber = 0L;

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    // Constructors
    public DocumentNumberSequence() {
        this.lastUpdated = LocalDateTime.now();
    }

    public DocumentNumberSequence(Company company, SequenceType sequenceType) {
        this.company = company;
        this.sequenceType = sequenceType;
        this.currentNumber = 0L;
        this.lastUpdated = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public SequenceType getSequenceType() {
        return sequenceType;
    }

    public void setSequenceType(SequenceType sequenceType) {
        this.sequenceType = sequenceType;
    }

    public Long getCurrentNumberLong() {
        return currentNumber;
    }

    public void setCurrentNumber(Long currentNumber) {
        this.currentNumber = currentNumber;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }

    /**
     * Увеличава текущия номер с 1 и обновява времето
     * @return новия номер
     */
    public Long incrementNumber() {
        this.currentNumber++;
        this.lastUpdated = LocalDateTime.now();
        return this.currentNumber;
    }

    /**
     * Форматира номера в 10-цифрен формат с водещи нули
     * @return форматиран номер (например: 0000000001)
     */
    public String getFormattedCurrentNumber() {
        return String.format("%010d", this.currentNumber);
    }

    /**
     * Получава следващия номер без да го инкрементира
     * @return следващия номер като форматиран string
     */
    public String getNextFormattedNumber() {
        return String.format("%010d", this.currentNumber + 1);
    }

    /**
     * Получава следващия номер за GraphQL (required for nextNumber field)
     * @return следващия номер като форматиран string
     */
    public String getNextNumber() {
        return getNextFormattedNumber();
    }

    /**
     * Получава текущия номер като string за GraphQL (required for currentNumber field)
     * @return текущия номер като форматиран string
     */
    public String getCurrentNumber() {
        return getFormattedCurrentNumber();
    }
}