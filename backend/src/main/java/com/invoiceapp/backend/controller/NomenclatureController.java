package com.invoiceapp.backend.controller;

import com.invoiceapp.backend.model.Country;
import com.invoiceapp.backend.model.DocumentTypeCode;
import com.invoiceapp.backend.model.UnitOfMeasure;
import com.invoiceapp.backend.repository.CountryRepository;
import com.invoiceapp.backend.repository.DocumentTypeCodeRepository;
import com.invoiceapp.backend.repository.UnitOfMeasureRepository;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.stereotype.Controller;

import java.util.List;

/**
 * Контролер за номенклатури по стандарти:
 * - Мерни единици (UN/ECE Rec 20)
 * - Държави (ISO 3166-1)
 * - Типове документи (UNCL1001)
 */
@Controller
public class NomenclatureController {

    private final CountryRepository countryRepository;
    private final UnitOfMeasureRepository unitOfMeasureRepository;
    private final DocumentTypeCodeRepository documentTypeCodeRepository;

    public NomenclatureController(
            CountryRepository countryRepository,
            UnitOfMeasureRepository unitOfMeasureRepository,
            DocumentTypeCodeRepository documentTypeCodeRepository) {
        this.countryRepository = countryRepository;
        this.unitOfMeasureRepository = unitOfMeasureRepository;
        this.documentTypeCodeRepository = documentTypeCodeRepository;
    }

    // ========== COUNTRIES (ISO 3166-1) ==========

    @QueryMapping
    public List<Country> allCountries() {
        return countryRepository.findAllOrderByEuMemberAndName();
    }

    @QueryMapping
    public List<Country> euCountries() {
        return countryRepository.findByIsEuMemberTrueOrderByName();
    }

    @QueryMapping
    public List<Country> searchCountries(@Argument String search) {
        if (search == null || search.trim().isEmpty()) {
            return countryRepository.findAllOrderByEuMemberAndName();
        }
        return countryRepository.searchByNameOrCode(search.trim());
    }

    @QueryMapping
    public Country countryByCode(@Argument String code) {
        return countryRepository.findById(code).orElse(null);
    }

    @QueryMapping
    public List<Country> peppolCountries() {
        return countryRepository.findAllWithPeppolSchemeId();
    }

    // ========== UNITS OF MEASURE (UN/ECE Rec 20) ==========

    @QueryMapping
    public List<UnitOfMeasure> allUnitsOfMeasure() {
        return unitOfMeasureRepository.findAllOrderByCategoryAndName();
    }

    @QueryMapping
    public List<UnitOfMeasure> searchUnitsOfMeasure(@Argument String search) {
        if (search == null || search.trim().isEmpty()) {
            return unitOfMeasureRepository.findAllOrderByCategoryAndName();
        }
        return unitOfMeasureRepository.searchByNameOrCode(search.trim());
    }

    @QueryMapping
    public List<UnitOfMeasure> unitsOfMeasureByCategory(@Argument String category) {
        return unitOfMeasureRepository.findByCategoryOrderByName(category);
    }

    @QueryMapping
    public List<String> unitCategories() {
        return unitOfMeasureRepository.findAllCategories();
    }

    @QueryMapping
    public UnitOfMeasure unitOfMeasureByCode(@Argument String code) {
        return unitOfMeasureRepository.findById(code).orElse(null);
    }

    // ========== DOCUMENT TYPE CODES (UNCL1001) ==========

    @QueryMapping
    public List<DocumentTypeCode> allDocumentTypeCodes() {
        return documentTypeCodeRepository.findAll();
    }

    @QueryMapping
    public List<DocumentTypeCode> commonDocumentTypeCodes() {
        return documentTypeCodeRepository.findByIsCommonTrueOrderBySortOrder();
    }

    @QueryMapping
    public List<DocumentTypeCode> invoiceTypeCodes() {
        return documentTypeCodeRepository.findByAppliesToOrBothOrderBySortOrder("INVOICE");
    }

    @QueryMapping
    public List<DocumentTypeCode> creditNoteTypeCodes() {
        return documentTypeCodeRepository.findByAppliesToOrBothOrderBySortOrder("CREDIT_NOTE");
    }

    @QueryMapping
    public List<DocumentTypeCode> searchDocumentTypeCodes(@Argument String search, @Argument String appliesTo) {
        if (search == null || search.trim().isEmpty()) {
            if (appliesTo != null && !appliesTo.isEmpty()) {
                return documentTypeCodeRepository.findByAppliesToOrBothOrderBySortOrder(appliesTo);
            }
            return documentTypeCodeRepository.findAll();
        }
        if (appliesTo != null && !appliesTo.isEmpty()) {
            return documentTypeCodeRepository.searchByNameOrCodeAndAppliesTo(search.trim(), appliesTo);
        }
        return documentTypeCodeRepository.searchByNameOrCode(search.trim());
    }

    @QueryMapping
    public DocumentTypeCode documentTypeCodeByCode(@Argument String code) {
        return documentTypeCodeRepository.findById(code).orElse(null);
    }
}
