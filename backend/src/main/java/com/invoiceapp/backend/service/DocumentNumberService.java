package com.invoiceapp.backend.service;

import com.invoiceapp.backend.model.DocumentNumberSequence;
import com.invoiceapp.backend.model.DocumentType;
import com.invoiceapp.backend.model.SequenceType;
import com.invoiceapp.backend.repository.CompanyRepository;
import com.invoiceapp.backend.repository.DocumentNumberSequenceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

/**
 * Service за генериране на номера на документи
 * Управлява две отделни последователности - за данъчни и неданъчни документи
 */
@Service
@Transactional
public class DocumentNumberService {

    private static final String NUMBER_FORMAT = "%010d"; // 10 цифри с водещи нули
    
    @Autowired
    private DocumentNumberSequenceRepository sequenceRepository;
    
    @Autowired
    private CompanyRepository companyRepository;

    /**
     * Генерира следващия номер за документ от даден тип
     * @param companyId ID на фирмата
     * @param documentType тип на документа
     * @return форматиран номер (например: 0000000001)
     */
    public String generateNextNumber(Long companyId, DocumentType documentType) {
        SequenceType sequenceType = documentType.getSequenceType();
        
        // Получаваме последователността с pessimistic lock за thread-safety
        DocumentNumberSequence sequence = sequenceRepository
            .findByCompanyIdAndSequenceTypeForUpdate(companyId, sequenceType)
            .orElseGet(() -> createNewSequence(companyId, sequenceType));
        
        // Увеличаваме номера и запазваме
        Long nextNumber = sequence.incrementNumber();
        sequenceRepository.save(sequence);
        
        return String.format(NUMBER_FORMAT, nextNumber);
    }

    /**
     * Получава следващия номер без да го генерира
     * @param companyId ID на фирмата
     * @param documentType тип на документа
     * @return следващия номер като форматиран string
     */
    @Transactional(readOnly = true)
    public String getNextNumber(Long companyId, DocumentType documentType) {
        SequenceType sequenceType = documentType.getSequenceType();
        
        Optional<DocumentNumberSequence> sequence = sequenceRepository
            .findByCompanyIdAndSequenceType(companyId, sequenceType);
        
        if (sequence.isPresent()) {
            return sequence.get().getNextFormattedNumber();
        } else {
            // Ако няма последователност, следващият номер ще бъде 0000000001
            return String.format(NUMBER_FORMAT, 1);
        }
    }

    /**
     * Получава текущия номер на последователност
     * @param companyId ID на фирмата
     * @param sequenceType тип на последователността
     * @return текущия номер като форматиран string
     */
    @Transactional(readOnly = true)
    public String getCurrentNumber(Long companyId, SequenceType sequenceType) {
        Optional<DocumentNumberSequence> sequence = sequenceRepository
            .findByCompanyIdAndSequenceType(companyId, sequenceType);
        
        if (sequence.isPresent()) {
            return sequence.get().getFormattedCurrentNumber();
        } else {
            return String.format(NUMBER_FORMAT, 0);
        }
    }

    /**
     * Инициализира последователности за нова фирма
     * @param companyId ID на фирмата
     */
    public void initializeSequencesForCompany(Long companyId) {
        // Създаваме последователност за данъчни документи
        if (!sequenceRepository.existsByCompanyIdAndSequenceType(companyId, SequenceType.TAX_DOCUMENT)) {
            createNewSequence(companyId, SequenceType.TAX_DOCUMENT);
        }
        
        // Създаваме последователност за неданъчни документи
        if (!sequenceRepository.existsByCompanyIdAndSequenceType(companyId, SequenceType.NON_TAX_DOCUMENT)) {
            createNewSequence(companyId, SequenceType.NON_TAX_DOCUMENT);
        }
    }

    /**
     * Проверява дали съществува последователност за дадена фирма и тип
     * @param companyId ID на фирмата
     * @param sequenceType тип на последователността
     * @return true ако съществува
     */
    @Transactional(readOnly = true)
    public boolean sequenceExists(Long companyId, SequenceType sequenceType) {
        return sequenceRepository.existsByCompanyIdAndSequenceType(companyId, sequenceType);
    }

    /**
     * Рестартира последователност (задава нов стартов номер)
     * @param companyId ID на фирмата
     * @param sequenceType тип на последователността
     * @param newStartNumber новия стартов номер
     */
    public void resetSequence(Long companyId, SequenceType sequenceType, Long newStartNumber) {
        Optional<DocumentNumberSequence> sequenceOpt = sequenceRepository
            .findByCompanyIdAndSequenceType(companyId, sequenceType);
        
        if (sequenceOpt.isPresent()) {
            DocumentNumberSequence sequence = sequenceOpt.get();
            sequence.setCurrentNumber(newStartNumber);
            sequence.setLastUpdated(LocalDateTime.now());
            sequenceRepository.save(sequence);
        } else {
            // Ако няма последователност, създаваме нова с новия стартов номер
            DocumentNumberSequence sequence = createNewSequence(companyId, sequenceType);
            sequence.setCurrentNumber(newStartNumber);
            sequenceRepository.save(sequence);
        }
    }

    /**
     * Създава нова последователност за фирма
     * @param companyId ID на фирмата
     * @param sequenceType тип на последователността
     * @return новата последователност
     */
    private DocumentNumberSequence createNewSequence(Long companyId, SequenceType sequenceType) {
        DocumentNumberSequence sequence = new DocumentNumberSequence();
        sequence.setCompany(companyRepository.getReferenceById(companyId));
        sequence.setSequenceType(sequenceType);
        sequence.setCurrentNumber(0L);
        sequence.setLastUpdated(LocalDateTime.now());
        return sequenceRepository.save(sequence);
    }
}