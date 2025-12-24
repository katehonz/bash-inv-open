package com.invoiceapp.backend.repository;

import com.invoiceapp.backend.model.DocumentNumberSequence;
import com.invoiceapp.backend.model.SequenceType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;

/**
 * Repository за работа с последователности на номерациите
 */
@Repository
public interface DocumentNumberSequenceRepository extends JpaRepository<DocumentNumberSequence, Long> {

    /**
     * Намира последователност по фирма и тип
     */
    Optional<DocumentNumberSequence> findByCompanyIdAndSequenceType(Long companyId, SequenceType sequenceType);

    /**
     * Намира последователност по фирма и тип с pessimistic lock за thread-safe операции
     * Използва се при генериране на номера за да се избегнат race conditions
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM DocumentNumberSequence s WHERE s.company.id = :companyId AND s.sequenceType = :sequenceType")
    Optional<DocumentNumberSequence> findByCompanyIdAndSequenceTypeForUpdate(
            @Param("companyId") Long companyId, 
            @Param("sequenceType") SequenceType sequenceType);

    /**
     * Намира всички последователности на дадена фирма
     */
    List<DocumentNumberSequence> findByCompanyIdOrderBySequenceType(Long companyId);

    /**
     * Проверява дали съществува последователност за дадена фирма и тип
     */
    boolean existsByCompanyIdAndSequenceType(Long companyId, SequenceType sequenceType);

    /**
     * Намира всички последователности от даден тип
     */
    List<DocumentNumberSequence> findBySequenceTypeOrderByCompanyId(SequenceType sequenceType);

    /**
     * Получава текущия номер на последователност без да го заключва
     */
    @Query("SELECT s.currentNumber FROM DocumentNumberSequence s WHERE s.company.id = :companyId AND s.sequenceType = :sequenceType")
    Optional<Long> getCurrentNumber(@Param("companyId") Long companyId, @Param("sequenceType") SequenceType sequenceType);

    /**
     * Получава следващия номер на последователност без да го заключва
     */
    @Query("SELECT s.currentNumber + 1 FROM DocumentNumberSequence s WHERE s.company.id = :companyId AND s.sequenceType = :sequenceType")
    Optional<Long> getNextNumber(@Param("companyId") Long companyId, @Param("sequenceType") SequenceType sequenceType);
}